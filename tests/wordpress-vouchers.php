<?php
/** DEMONSTRAÇÃO: run ONLY against a disposable loopback WordPress/WooCommerce. No delivery or charge. */
$_SERVER['DOCUMENT_ROOT'] = dirname(realpath($argv[1]));
define('RAK_PRIVATE_DOCUMENT_ROOT', dirname($_SERVER['DOCUMENT_ROOT']) . '/private-documents');
require $argv[1] . '/wp-load.php';
if (wp_parse_url(home_url(), PHP_URL_HOST) !== '127.0.0.1' || !function_exists('wc_get_order')) throw new RuntimeException('Use a réplica local com WooCommerce.');
use ReAlmeida\Kits\{Accounts, KitOrderRepository, RequestOperations, RequestQueue, VoucherRepository, Vouchers, VoucherMail, VoucherPdf, VoucherPickup};
$checks = 0;
function check($condition, string $message): void { global $checks; if (!$condition) throw new RuntimeException($message); $checks++; }
global $wpdb;
$admin = (int) get_users(['role' => 'administrator', 'number' => 1, 'fields' => 'ID'])[0];
wp_set_current_user($admin);
$race = wp_insert_post(['post_type' => 'corrida', 'post_status' => 'publish', 'post_title' => 'DEMONSTRAÇÃO — corrida QA']);
$documentToken = bin2hex(random_bytes(16));
file_put_contents(RAK_PRIVATE_DOCUMENT_ROOT . '/' . $documentToken, 'DEMONSTRAÇÃO — anexo sintético sem dados pessoais');
add_user_meta($admin, '_rak_private_document_' . $documentToken, ['mime' => 'application/pdf'], true);
$ids = $orders = [];
$mailCalls = 0;
$mailSuccess = false;
// Mathematically valid synthetic value, used only in the loopback fixture.
$testCpf = '98765432100';
add_filter('pre_wp_mail', static function ($result, $args) use (&$mailCalls, &$mailSuccess) {
    if (!str_contains($args['subject'], 'Seu voucher de retirada')) return false;
    $mailCalls++;
    check(!str_contains($args['message'], '#voucher=') && !str_contains($args['message'], 'CPF'), 'E-mail expôs token ou CPF.');
    return $mailSuccess;
}, 999, 2);
$seed = static function () use ($admin, $race, $documentToken, $testCpf, &$ids, &$orders) {
    $order = wc_create_order(['customer_id' => $admin]);
    $order->set_billing_email('demonstracao@example.invalid');
    $order->set_billing_first_name('DEMONSTRAÇÃO');
    $order->set_total(30);
    $order->save();
    $orders[] = $order;
    $lines = $people = [];
    for ($i = 0; $i < 3; $i++) {
        $lines[] = ['raceId' => (string) $race, 'race' => 'DEMONSTRAÇÃO — corrida QA', 'participantId' => $i + 1,
            'participant' => 'DEMONSTRAÇÃO ' . $i, 'modality' => 'oficial', 'raceDate' => '2026-12-01',
            'documentRequirements' => $i === 2 ? [['id' => 'qa-doc', 'required' => true, 'requiresUpload' => true]] : [], 'documentStatus' => $i === 2 ? 'pending_review' : 'not_required', 'pickupStatus' => 'pending'];
        $people[] = ['directoryId' => $i + 1, 'person' => $i === 0 ? ['cpf' => $testCpf] : [], 'items' => [['raceId' => (string) $race, 'modality' => 'oficial', 'documents' => $i === 2 ? ['qa-doc' => $documentToken] : []]]];
    }
    $id = KitOrderRepository::reserve($admin, wp_generate_uuid4(), ['responsible' => ['name' => 'DEMONSTRAÇÃO'], 'lines' => $lines, 'draft' => ['participants' => $people]]);
    check($id && KitOrderRepository::attach($id, $order->get_id()), 'Não vinculou pedido.');
    $order->update_meta_data('_rak_request_id', $id); $order->save();
    $ids[] = $id;
    return [KitOrderRepository::get($id), $order];
};
try {
    check((int) get_option('rak_schema_version') === \ReAlmeida\Kits\SCHEMA_VERSION, 'Migração ausente.');
    check(current_user_can(Vouchers::CAPABILITY), 'Administrador sem conferência.');
    $role = get_role('rak_pickup_staff');
    check($role && $role->has_cap(Vouchers::CAPABILITY) && !$role->has_cap(RequestOperations::CAPABILITY) && !$role->has_cap('manage_options'), 'Papel excessivo.');
    ob_start(); VoucherPickup::render();
    file_put_contents(dirname(__DIR__) . '/.local-tools/voucher-qa/pickup-markup.html', ob_get_clean());
    [$row, $order] = $seed();
    Vouchers::sync($row);
    check(VoucherRepository::get((int) $row->id, 0)->state === 'blocked', 'Liberou antes do pagamento.');
    $order->payment_complete();
    $first = VoucherRepository::get((int) $row->id, 0);
    check($first->state === 'released', 'Pagamento não liberou.');
    check(VoucherRepository::get((int) $row->id, 1)->state === 'released' && VoucherRepository::get((int) $row->id, 2)->state === 'blocked', 'Estados individuais incorretos.');
    Vouchers::orderChanged($order->get_id()); Vouchers::sync($row);
    check(VoucherRepository::get((int) $row->id, 0)->token === $first->token, 'Evento duplicou voucher.');
    $table = Accounts::table('vouchers');
    check((int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE request_id=%d", $row->id)) === 3, 'Emissão duplicada.');
    VoucherMail::send((int) $first->id);
    check(VoucherRepository::get((int) $row->id, 0)->mail_state === 'pending' && $mailCalls === 1, 'Falha não foi registrada.');
    $mailSuccess = true;
    VoucherMail::send((int) $first->id); VoucherMail::send((int) $first->id);
    check(VoucherRepository::get((int) $row->id, 0)->mail_state === 'sent' && $mailCalls === 2, 'Envio repetido.');
    $patch = ['documentStatus' => 'pending_review', 'pickupStatus' => 'pending', 'bib' => null,
        'review' => ['id' => 'qa-doc', 'status' => 'approved', 'reason' => '']];
    check(!is_wp_error(RequestOperations::update($row, 2, 0, $patch)), 'Documentos depois de pagamento falharam.');
    check(VoucherRepository::get((int) $row->id, 2)->state === 'released', 'Documentos não acionaram liberação.');
    $auditCount = count(json_decode(VoucherRepository::get((int) $row->id, 2)->audit, true));
    check(!is_wp_error(RequestOperations::update($row, 2, 1, $patch)), 'Evento documental repetido falhou.');
    check(count(json_decode(VoucherRepository::get((int) $row->id, 2)->audit, true)) === $auditCount, 'Evento documental repetiu emissão.');
    $snapshot = json_decode($row->snapshot, true);
    $pdf = VoucherPdf::generate($first, $snapshot['lines'][0]);
    $manual = VoucherRepository::code($first);
    check(VoucherRepository::byCode(strtolower($manual))->token === $first->token, 'Código manual não aponta para o QR original.');
    check(str_contains($pdf, $manual) && !str_contains($pdf, $first->token), 'PDF sem código manual ou com token exposto em texto.');
    $search = new WP_REST_Request('POST');
    $search->set_header('Content-Type', 'application/json');
    foreach ([$testCpf, '987.654.321-00'] as $query) {
        $search->set_body(wp_json_encode(['q' => $query]));
        $results = VoucherPickup::search($search)['results'];
        check(count($results) === 1 && $results[0]['code'] === $manual && !str_contains(wp_json_encode($results), $testCpf),
            'Busca exata não localizou o participante ou expôs CPF.');
    }
    $search->set_body(wp_json_encode(['token' => $manual]));
    check(is_wp_error(VoucherPickup::confirm($search)), 'Confirmação aceitou código manual como token.');
    check(is_string(VoucherPdf::content((int) $row->id, 0)), 'Titular sem PDF autenticado.');
    $other = wp_insert_user(['user_login' => 'qa-voucher-' . wp_generate_uuid4(), 'user_email' => 'qa-voucher-' . wp_generate_uuid4() . '@example.invalid', 'user_pass' => wp_generate_password(32), 'role' => 'customer']);
    wp_set_current_user($other);
    check(is_wp_error(VoucherPdf::content((int) $row->id, 0)), 'Outro cliente acessou PDF.');
    wp_set_current_user($admin);
    $sessionData = [];
    $sessions = [];
    foreach (['owner' => $admin, 'other' => $other] as $key => $actor) {
        $session = WP_Session_Tokens::get_instance($actor)->create(time() + 600);
        $sessions[] = [$actor, $session];
        $logged = wp_generate_auth_cookie($actor, time() + 600, 'logged_in', $session);
        $_COOKIE[LOGGED_IN_COOKIE] = $logged;
        wp_set_current_user($actor);
        $sessionData[$key . 'Cookie'] = AUTH_COOKIE . '=' . wp_generate_auth_cookie($actor, time() + 600, 'auth', $session) . '; ' . LOGGED_IN_COOKIE . '=' . $logged;
        $sessionData[$key . 'Nonce'] = wp_create_nonce('wp_rest');
        $sessionData[$key . 'PdfNonce'] = wp_create_nonce('rak_voucher_pdf_' . $row->id . '_0');
        if ($key === 'owner') $sessionData['pdfUrl'] = Vouchers::describe($first)['pdfUrl'];
    }
    wp_set_current_user($admin);
    $sessionData += ['token' => $first->token, 'code' => $manual, 'request' => (int) $row->id,
        'pdfUrl' => add_query_arg(['action' => 'rak_voucher_pdf', 'request' => $row->id, 'line' => 0, '_wpnonce' => $sessionData['ownerPdfNonce']], admin_url('admin-post.php'))];
    $httpProcess = proc_open(['node', __DIR__ . '/voucher-http.mjs'], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $httpPipes);
    fwrite($httpPipes[0], json_encode($sessionData)); fclose($httpPipes[0]);
    $httpOutput = stream_get_contents($httpPipes[1]); $httpErrors = stream_get_contents($httpPipes[2]);
    fclose($httpPipes[1]); fclose($httpPipes[2]);
    foreach ($sessions as [$actor, $session]) WP_Session_Tokens::get_instance($actor)->destroy($session);
    unset($_COOKIE[LOGGED_IN_COOKIE]);
    check(proc_close($httpProcess) === 0, 'QA HTTP falhou: ' . $httpErrors);
    echo $httpOutput;
    check(str_starts_with($pdf, '%PDF-1.4') && str_contains($pdf, 'xref') && !str_contains($pdf, 'CPF'), 'PDF inválido.');
    $longLine = $snapshot['lines'][0];
    $longLine['participant'] = str_repeat('W', 160);
    $longLine['race'] = str_repeat('W', 200);
    $longLine['pickup'] = ['label' => str_repeat('W', 100), 'address' => str_repeat('W', 300)];
    $longPdf = VoucherPdf::generate($first, $longLine);
    preg_match('/\/Count (\d+)/', $longPdf, $pages);
    check((int) ($pages[1] ?? 0) > 1, 'Campos longos não paginaram.');
    file_put_contents(dirname(__DIR__) . '/.local-tools/voucher-qa/DEMONSTRACAO-voucher-longo.pdf', $longPdf);
    file_put_contents(dirname(__DIR__) . '/.local-tools/voucher-qa/DEMONSTRACAO-voucher.pdf', $pdf);
    check(VoucherRepository::token(str_repeat('0', 64)) === null && VoucherRepository::token('invalid') === null, 'Aceitou token inválido.');
    $request = new WP_REST_Request('POST'); $request->set_header('X-WP-Nonce', wp_create_nonce('wp_rest'));
    check(VoucherPickup::permission($request) === true, 'Permissão com nonce falhou.');
    $request->set_header('X-WP-Nonce', 'invalid'); check(is_wp_error(VoucherPickup::permission($request)), 'Aceitou nonce inválido.');
    $stale = clone $first;
    $staff = wp_insert_user(['user_login' => 'qa-staff-' . wp_generate_uuid4(), 'user_email' => 'qa-staff-' . wp_generate_uuid4() . '@example.invalid', 'user_pass' => wp_generate_password(32), 'role' => 'rak_pickup_staff']);
    $barrier = dirname(__DIR__) . '/.local-tools/voucher-qa/concurrent-' . wp_generate_uuid4();
    $workers = [];
    foreach ([$admin, $staff] as $slot => $actor) {
        $process = proc_open([PHP_BINARY, __DIR__ . '/wordpress-voucher-worker.php', realpath($argv[1]), (string) $row->id, (string) $actor, $barrier, (string) $slot], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        $workers[] = [$process, $pipes];
    }
    $deadline = microtime(true) + 25;
    while ((!is_file($barrier . '.0.ready') || !is_file($barrier . '.1.ready')) && microtime(true) < $deadline) usleep(20000);
    check(is_file($barrier . '.0.ready') && is_file($barrier . '.1.ready'), 'Workers não inicializaram.');
    file_put_contents($barrier . '.start', 'go');
    $outcomes = [];
    foreach ($workers as [$process, $pipes]) {
        $output = stream_get_contents($pipes[1]); $errors = stream_get_contents($pipes[2]);
        fclose($pipes[1]); fclose($pipes[2]);
        check(proc_close($process) === 0, 'Worker falhou: ' . $errors);
        $outcomes[] = json_decode($output, true);
    }
    foreach (['.start', '.0.ready', '.1.ready'] as $suffix) unlink($barrier . $suffix);
    check(count(array_filter($outcomes, static fn($outcome) => $outcome['success'])) === 1, 'Duas confirmações simultâneas foram aceitas.');
    $used = VoucherRepository::get((int) $row->id, 0);
    check($used->state === 'used' && in_array((int) $used->collected_by, [$admin, $staff], true) && $used->operation_id, 'Confirmação sem auditoria.');
    check(!VoucherRepository::transition($stale, 'used', 'stale', true), 'CAS aceitou revisão concorrente antiga.');
    check(is_wp_error(Vouchers::confirm($first)), 'Retirada duplicada.');
    check(RequestOperations::lines($row, $snapshot)[0]['pickupStatus'] === 'collected', 'Central não refletiu voucher.');
    check(is_wp_error(RequestOperations::update($row, 0, 1, $patch)), 'Apagou retirada.');
    wp_set_current_user(0);
    check(is_wp_error(Vouchers::confirm($first)) && is_wp_error(VoucherPickup::permission($request)), 'Anônimo autorizado.');
    wp_set_current_user($admin);
    $order->update_status('refunded');
    check(VoucherRepository::get((int) $row->id, 1)->state === 'invalidated', 'Estorno não invalidou.');
    $history = VoucherRepository::get((int) $row->id, 0);
    check($history->state === 'used' && $history->operation_id === $used->operation_id && str_contains($history->reason, 'administrativa'), 'Estorno apagou entrega.');
    [$second, $secondOrder] = $seed();
    $search->set_body(wp_json_encode(['q' => $testCpf]));
    $matches = VoucherPickup::search($search)['results'];
    check(count($matches) === 2 && in_array($manual, array_column($matches, 'code'), true),
        'Busca por CPF não retornou os dois vouchers do participante.');
    check(!is_wp_error(RequestOperations::update($second, 2, 0, $patch)), 'Aprovação antes de pagar bloqueada.');
    check(VoucherRepository::get((int) $second->id, 2)->state === 'blocked', 'Aprovação sem pagamento liberou.');
    $secondOrder->payment_complete();
    check(VoucherRepository::get((int) $second->id, 2)->state === 'released', 'Pagamento depois de documentos falhou.');
    $secondOrder->update_status('cancelled');
    check(VoucherRepository::get((int) $second->id, 2)->state === 'invalidated', 'Cancelamento não invalidou.');
    $requiredLine = $snapshot['lines'][0];
    $requiredLine['documentRequirements'] = [['id' => 'qa-doc', 'required' => true, 'requiresUpload' => true]];
    $requiredLine['documentStatus'] = 'approved';
    check(!Vouchers::documentsApproved($snapshot, $requiredLine), 'Aprovação global contornou documento ausente.');
    echo "OK $checks verificações de vouchers (DEMONSTRAÇÃO).\n";
} finally {
    wp_delete_post($race, true);
    delete_user_meta($admin, '_rak_private_document_' . $documentToken);
    if (is_file(RAK_PRIVATE_DOCUMENT_ROOT . '/' . $documentToken)) unlink(RAK_PRIVATE_DOCUMENT_ROOT . '/' . $documentToken);
    if (isset($other) && !is_wp_error($other)) { require_once ABSPATH . 'wp-admin/includes/user.php'; wp_delete_user($other); }
    if (isset($staff) && !is_wp_error($staff)) { require_once ABSPATH . 'wp-admin/includes/user.php'; wp_delete_user($staff); }
    foreach ($ids as $id) {
        foreach ($wpdb->get_col($wpdb->prepare("SELECT id FROM " . Accounts::table('vouchers') . " WHERE request_id=%d", $id)) as $voucherId) wp_clear_scheduled_hook('rak_voucher_mail', [(int) $voucherId]);
        $wpdb->delete(Accounts::table('vouchers'), ['request_id' => $id]);
        $wpdb->delete(Accounts::table('requests'), ['id' => $id]);
        delete_user_meta($admin, '_rak_request_ops_' . $id);
    }
    foreach ($orders as $order) $order->delete(true);
}
