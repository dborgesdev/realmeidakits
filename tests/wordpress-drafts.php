<?php
/** Integration checks for the native-cookie draft endpoint on a disposable WordPress. */
$root = $argv[1] ?? '';
require $root . '/wp-load.php';
if (!in_array(wp_parse_url(home_url(), PHP_URL_HOST), ['127.0.0.1', 'localhost'], true)) {
    throw new RuntimeException('Use uma instalação local descartável.');
}
require_once ABSPATH . 'wp-admin/includes/user.php';

function expect_draft(bool $ok, string $message): void {
    if (!$ok) throw new RuntimeException($message);
    echo 'OK ' . $message . PHP_EOL;
}

function draft_call(string $method, ?array $payload = null, bool $nonce = true): WP_REST_Response {
    $request = new WP_REST_Request($method, '/re-almeida/v1/account/draft');
    if ($nonce) $request->set_header('X-WP-Nonce', wp_create_nonce('wp_rest'));
    if ($payload !== null) {
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode($payload));
    }
    return rest_do_request($request);
}

function draft_login(int $id): void {
    wp_set_current_user($id);
    $_COOKIE[LOGGED_IN_COOKIE] = wp_generate_auth_cookie($id, time() + 3600, 'logged_in');
}

$users = [];
try {
    foreach (range(1, 2) as $index) {
        $id = wp_insert_user(['user_login' => 'rak-test-' . wp_generate_uuid4(), 'user_pass' => wp_generate_password(), 'role' => 'customer']);
        if (is_wp_error($id)) throw new RuntimeException($id->get_error_message());
        $users[] = $id;
    }
    expect_draft(draft_call('GET', null, false)->get_status() === 401, 'visitante recusado');
    draft_login($users[0]);
    expect_draft(draft_call('GET', null, false)->get_status() === 401, 'sessão sem nonce recusada');
    $draft = [
        'selectedRaceIds' => [], 'prepared' => true, 'stage' => 'participantes',
        'participants' => [['id' => 'p1', 'person' => ['name' => 'DEMONSTRAÇÃO "barra\teste"'], 'items' => []]],
    ];
    $saved = draft_call('PUT', ['version' => 0, 'draft' => $draft]);
    expect_draft($saved->get_status() === 200 && $saved->get_data()['version'] === 1, 'primeira gravação cria versão 1');
    $loaded = draft_call('GET')->get_data();
    expect_draft($loaded['draft']->participants[0]->person->name === $draft['participants'][0]['person']['name'], 'texto restaurado integralmente');
    expect_draft($loaded['draft']->stage === 'participantes', 'etapa restaurada');
    expect_draft(draft_call('PUT', ['version' => 0, 'draft' => $draft])->get_status() === 409, 'versão antiga rejeitada');
    $draft['participants'][0]['directoryId'] = PHP_INT_MAX;
    expect_draft(draft_call('PUT', ['version' => 1, 'draft' => $draft])->get_status() === 403, 'vínculo alheio rejeitado');
    unset($draft['participants'][0]['directoryId']);
    $draft['stage'] = 'documentos';
    $saved = draft_call('PUT', ['version' => 1, 'draft' => $draft]);
    expect_draft($saved->get_status() === 200 && $saved->get_data()['version'] === 2, 'segunda gravação usa comparação da versão');
    draft_login($users[1]);
    expect_draft(draft_call('GET')->get_data() === ['version' => 0, 'draft' => null], 'outro titular não vê o rascunho');
    draft_login($users[0]);
    expect_draft(draft_call('GET')->get_data()['version'] === 2, 'nova sessão recupera o rascunho do titular');
} finally {
    wp_set_current_user(0);
    unset($_COOKIE[LOGGED_IN_COOKIE]);
    foreach ($users as $id) wp_delete_user($id);
}
