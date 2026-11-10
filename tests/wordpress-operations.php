<?php
/** Integration checks against a disposable WordPress and WooCommerce installation. */
$_SERVER['DOCUMENT_ROOT'] = dirname(realpath($argv[1]));
define('RAK_PRIVATE_DOCUMENT_ROOT', dirname($_SERVER['DOCUMENT_ROOT']) . '/private-documents');
require $argv[1] . '/wp-load.php';
if (wp_parse_url(home_url(), PHP_URL_HOST) !== '127.0.0.1') exit(1);
use ReAlmeida\Kits\{Accounts, KitOrderRepository, Repository, RequestOperations, RequestQueue, RequestExport, Schema};
global $wpdb;
if (($argv[2] ?? '') === 'xlsx') {
    $path = $argv[3];
    ob_start(static function (string $buffer) use ($path): string {
        file_put_contents($path, $buffer, FILE_APPEND);
        return '';
    });
    $order = new WC_Order();
    RequestExport::send([[
        'line' => ['race' => 'Corrida de teste', 'participant' => '=1+1', 'modality' => 'oficial', 'documentStatus' => 'not_required', 'pickupStatus' => 'pending'],
        'holder' => 'Titular sintético', 'registration' => '00012', 'order' => $order, 'item' => ['size' => 'M'],
    ]], false);
}
$admin = (int) (get_users(['role' => 'administrator', 'number' => 1, 'fields' => 'ID'])[0] ?? 0);
wp_set_current_user($admin);
if (!current_user_can(RequestOperations::CAPABILITY)) throw new RuntimeException('Permissão administrativa ausente.');
$order = wc_create_order(['customer_id' => $admin]);
$id = 0;
$race = wp_insert_post(['post_type' => 'corrida', 'post_status' => 'publish', 'post_title' => 'Corrida sintética']);
$token = bin2hex(random_bytes(16));
$file = RAK_PRIVATE_DOCUMENT_ROOT . '/' . $token;
try {
    $config = Schema::validate([
        'status' => 'open', 'priceCents' => 2600, 'officialEnabled' => true, 'sizes' => [], 'shirtImageId' => 0,
        'distances' => [['id' => 'qa-distance', 'label' => '5 km', 'modality' => 'oficial']],
        'documents' => [['id' => 'qa-file', 'label' => 'Anexo sintético', 'scope' => 'race', 'modality' => 'oficial',
            'required' => true, 'requiresUpload' => true]],
    ]);
    if (is_wp_error($config)) throw new RuntimeException($config->get_error_message());
    Repository::save($race, $config);
    file_put_contents($file, 'somente teste');
    add_user_meta($admin, '_rak_private_document_' . $token, ['mime' => 'application/pdf'], true);
    $order->set_total(26);
    $order->save();
    $lines = [];
    foreach (['Participante Sintético A', 'Participante Sintético B'] as $i => $person) {
        $lines[] = ['raceId' => (string) $race, 'race' => 'Corrida sintética', 'participantId' => $i + 1, 'participant' => $person,
            'modality' => 'oficial', 'registration' => 'QA' . $i, 'bib' => null, 'documentStatus' => 'not_required', 'pickupStatus' => 'pending'];
    }
    $participants = [];
    foreach ([1, 2] as $participant) {
        $participants[] = ['directoryId' => $participant, 'person' => [], 'items' => [[
            'raceId' => (string) $race, 'modality' => 'oficial', 'documents' => $participant === 1 ? ['qa-file' => $token] : [],
        ]]];
    }
    $id = KitOrderRepository::reserve($admin, wp_generate_uuid4(), [
        'responsible' => ['name' => 'Titular sintético'], 'lines' => $lines, 'draft' => ['participants' => $participants],
    ]);
    if (!$id || !KitOrderRepository::attach($id, $order->get_id())) throw new RuntimeException('Vínculo não criado.');
    $filters = RequestQueue::filters(['race' => (string) $race]);
    $queue = static fn(bool $exceptions = false) => iterator_to_array(RequestQueue::entries($filters, $exceptions));
    if ($queue()) throw new RuntimeException('Pedido pendente apareceu.');
    $order->payment_complete();
    if (count($queue()) !== 2 || count(iterator_to_array(RequestQueue::entries($filters + [], true))) !== 0) {
        throw new RuntimeException('O pagamento confirmado deve listar os dois participantes.');
    }
    $search = array_replace($filters, ['q' => 'QA1']);
    if (count(iterator_to_array(RequestQueue::entries($search))) !== 1) throw new RuntimeException('Filtro por inscrição falhou.');
    $row = KitOrderRepository::get($id);
    $patch = ['bib' => '0008', 'documentStatus' => 'not_required', 'pickupStatus' => 'collected'];
    if (is_wp_error(RequestOperations::update($row, 1, 0, $patch))) throw new RuntimeException('Edição falhou.');
    $state = RequestOperations::read($row);
    if ($state['lines'][1]['bib'] !== '0008' || $state['audit'][0]['actor'] !== $admin ||
        !is_wp_error(RequestOperations::update($row, 1, 0, $patch))) throw new RuntimeException('Auditoria ou controle de versão falhou.');
    if (!is_wp_error(RequestOperations::update($row, 1, 1, array_replace($patch, ['documentStatus' => 'approved'])))) {
        throw new RuntimeException('Aprovação permitida sem documento obrigatório.');
    }
    $review = $patch + ['review' => ['id' => 'qa-file', 'status' => 'rejected', 'reason' => '']];
    if (!is_wp_error(RequestOperations::update($row, 0, 1, $review))) throw new RuntimeException('Rejeição exige motivo.');
    $review['review']['reason'] = 'Anexo sintético ilegível';
    if (is_wp_error(RequestOperations::update($row, 0, 1, $review))) throw new RuntimeException('Rejeição falhou.');
    $review['review'] = ['id' => 'qa-file', 'status' => 'approved', 'reason' => ''];
    if (is_wp_error(RequestOperations::update($row, 0, 2, $review)) ||
        RequestOperations::read($row)['lines'][0]['documentStatus'] !== 'approved') throw new RuntimeException('Aprovação documental falhou.');
    $order->update_status('refunded');
    if ($queue() || count($queue(true)) !== 2 || !is_wp_error(RequestOperations::update($row, 1, 3, $patch))) {
        throw new RuntimeException('O pedido reembolsado deve sair da fila e bloquear edição.');
    }
    echo "OK fila, múltiplos participantes, filtros, edição, auditoria, concorrência e reversão\n";
} finally {
    if ($id) {
        $wpdb->delete(Accounts::table('requests'), ['id' => $id]);
        delete_user_meta($admin, '_rak_request_ops_' . $id);
    }
    $order->delete(true);
    wp_delete_post($race, true);
    delete_user_meta($admin, '_rak_private_document_' . $token);
    if (is_file($file)) unlink($file);
}
