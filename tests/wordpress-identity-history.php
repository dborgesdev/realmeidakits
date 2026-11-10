<?php
/** Run against a disposable local WordPress/WooCommerce installation. */
$_SERVER['DOCUMENT_ROOT'] = dirname(realpath($argv[1]));
define('RAK_PRIVATE_DOCUMENT_ROOT', dirname($_SERVER['DOCUMENT_ROOT']) . '/private-documents');
require $argv[1] . '/wp-load.php';
if (wp_parse_url(home_url(), PHP_URL_HOST) !== '127.0.0.1') exit(1);
use ReAlmeida\Kits\{Accounts, KitOrderRepository, PersonalDocuments, PrivateDocumentStore};
global $wpdb;
$owners = [];
$requests = [];
$orders = [];
$tokens = [];
$cpf = (string) random_int(850000000, 859999999);
for ($length = 9; $length <= 10; $length++) {
    $sum = 0;
    for ($i = 0; $i < $length; $i++) $sum += ((int) $cpf[$i]) * ($length + 1 - $i);
    $cpf .= (string) ((($sum * 10) % 11) % 10);
}
try {
    for ($i = 0; $i < 2; $i++) {
        $slug = 'rak-test-' . substr(wp_generate_uuid4(), 0, 18);
        $id = wp_insert_user(['user_login' => $slug, 'user_email' => $slug . '@example.invalid', 'user_pass' => wp_generate_password(), 'role' => 'customer']);
        if (is_wp_error($id)) throw new RuntimeException('Conta sintética não criada.');
        $owners[] = $id;
    }
    if (is_wp_error(Accounts::claim($cpf, $owners[0]))) throw new RuntimeException('CPF sintético indisponível.');
    foreach ($owners as $owner) {
        $token = bin2hex(random_bytes(16));
        $tokens[] = $token;
        file_put_contents(RAK_PRIVATE_DOCUMENT_ROOT . '/' . $token, 'somente teste');
        add_user_meta($owner, '_rak_private_document_' . $token, ['mime' => 'image/png', 'context' => ['cpf' => $cpf]]);
        $order = wc_create_order(['customer_id' => $owner]);
        $orders[] = $order;
        $row = KitOrderRepository::reserve($owner, wp_generate_uuid4(), [
            'lines' => [['raceId' => '1', 'participantId' => 7]],
            'draft' => ['participants' => [['directoryId' => 7, 'person' => ['cpf' => $cpf], 'items' => [
                ['raceId' => '1', 'documents' => [PersonalDocuments::ID => $token]],
            ]]]],
        ]);
        $requests[] = $row;
        if (!$row || !KitOrderRepository::attach($row, $order->get_id())) throw new RuntimeException('Pedido sintético não vinculado.');
    }
    $source = new ReflectionMethod(PersonalDocuments::class, 'source');
    foreach ($owners as $requester) {
        if ($source->invoke(null, $cpf, $requester) !== ['owner' => $owners[0], 'token' => $tokens[0]]) {
            throw new RuntimeException('O histórico próprio deve estar disponível para reutilização sem upload separado.');
        }
    }
    if (PrivateDocumentStore::open($owners[1], $tokens[0]) !== null) throw new RuntimeException('A outra conta abriu o original.');
    PersonalDocuments::rejectSource($owners[0], $tokens[0]);
    if ($source->invoke(null, $cpf, $owners[1]) !== null) throw new RuntimeException('O rejeitado ou o envio alternativo foi reutilizado.');
    echo "OK identidade histórica própria e entre contas, isolamento, rejeição e arquivo alternativo\n";
} finally {
    foreach ($requests as $id) $wpdb->delete(Accounts::table('requests'), ['id' => $id]);
    foreach ($orders as $order) $order->delete(true);
    foreach ($tokens as $token) {
        $path = RAK_PRIVATE_DOCUMENT_ROOT . '/' . $token;
        if (is_file($path)) unlink($path);
    }
    require_once ABSPATH . 'wp-admin/includes/user.php';
    foreach ($owners as $id) {
        $wpdb->delete(Accounts::table('identities'), ['user_id' => $id]);
        wp_delete_user($id);
    }
}
