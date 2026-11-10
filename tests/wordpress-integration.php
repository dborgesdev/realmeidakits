<?php
/** Run only in an isolated local WordPress: php tests/wordpress-integration.php /absolute/path/to/wordpress */
$root = $argv[1] ?? '';
if (!$root || !is_file($root . '/wp-load.php')) throw new Exception('Informe a instalação WordPress LOCAL de teste.');
require $root . '/wp-load.php';
if (!in_array(wp_parse_url(home_url(), PHP_URL_HOST), ['127.0.0.1', 'localhost'], true)) throw new Exception('Este teste só pode executar em uma instalação local descartável.');
use ReAlmeida\Kits\Schema;
use ReAlmeida\Kits\Repository;
use ReAlmeida\Kits\Rest;
use ReAlmeida\Kits\Migrations;
$count = 0;
function check($condition, $label) {
    global $count;
    if (!$condition) throw new Exception('FALHOU: ' . $label);
    $count++;
    echo 'OK ' . $label . PHP_EOL;
}
function defaults($fields) {
    $out = [];
    foreach ($fields as $k => $f) {
        $out[$k] = match ($f['type']) {
            'checkbox' => false, 'money' => null, 'image' => 0, 'lines', 'rows' => [],
            'select' => array_key_first($f['options']), default => '',
        };
    }
    return $out;
}
$d = [];
foreach (Schema::sections() as $section) $d += defaults($section['fields']);
$d['officialEnabled'] = true;
$d['appaiEnabled'] = true;
$d['numberEnabled'] = true;
$d['status'] = 'open';
$d['distances'] = [['id' => 'distance-demo', 'label' => '5 km — DEMONSTRAÇÃO', 'modality' => 'both']];
$d['conditions'] = [['id' => 'condition-demo', 'text' => 'DEMONSTRAÇÃO — texto \\ preservado.', 'active' => true]];
$d['documents'] = [['id' => 'doc-demo', 'label' => 'Documento DEMONSTRAÇÃO', 'scope' => 'personal', 'modality' => 'both', 'required' => true, 'guidance' => 'Não envie documentos reais.']];
check(!is_wp_error(Schema::validate($d)), 'configuração válida, sem preços inventados');
foreach ([
    ['officialCents' => -1], ['shirtCents' => 1.2], ['numberCents' => '1200'], ['officialCents' => 100000000],
    ['raceDate' => '2026-02-30'], ['raceTime' => '25:10'], ['opensAt' => '2026-11-02T10:00', 'closesAt' => '2026-11-01T10:00'],
    ['whatsappUrl' => 'javascript:alert(1)'], ['whatsappUrl' => 'https://example.invalid/grupo'],
    ['shirtImageId' => 99999999], ['shirtImageId' => '1'], ['sizes' => ['M', ['bad']]], ['status' => 'fake'],
    ['officialEnabled' => false, 'appaiEnabled' => false], ['distances' => []], ['numberEnabled' => false],
    ['shirtEnabled' => true, 'sizes' => []], ['documents' => [['id' => 'bad id']]],
    ['conditions' => [$d['conditions'][0], $d['conditions'][0]]],
] as $index => $patch) check(is_wp_error(Schema::validate(array_replace($d, $patch))), 'rejeita entrada inválida #' . ($index + 1));
$legacy = $d;
unset($legacy['priceCents'], $legacy['officialCents'], $legacy['shirtCents'], $legacy['numberCents']);
$legacy['officialPix'] = $legacy['officialCard'] = 1234;
check(Schema::validate($legacy)['officialCents'] === 1234, 'valor legado comum preservado na modalidade');
$legacy['officialCard'] = 4567;
check(Schema::validate($legacy)['priceCents'] === null, 'divergência não escolhe um preço sem revisão');
$legacy['priceCents'] = 3333;
check(Schema::validate($legacy)['officialCents'] === 3333, 'preço anterior explicitamente confirmado é preservado');
$dates = Schema::validate(array_replace($d, ['opensAt' => '2026-11-01T09:00', 'closesAt' => '2026-11-01T10:00']));
check($dates['opensAt'] === '2026-11-01T09:00:00-03:00', 'converte prazos no fuso WordPress');
check(Repository::availability($dates, strtotime($dates['opensAt']) - 1) === 'unavailable', 'antes da abertura indisponível');
check(Repository::availability($dates, strtotime($dates['opensAt'])) === 'open', 'igualdade na abertura permite seleção');
check(Repository::availability($dates, strtotime($dates['closesAt'])) === 'closed', 'igualdade no encerramento bloqueia seleção');
wp_set_current_user(get_user_by('login', 'rak-local')->ID);
Migrations::upgrade();
check(current_user_can(ReAlmeida\Kits\CAPABILITY), 'administrador possui permissão');
$die_handler = static fn() => static function ($message) { throw new RuntimeException((string) $message); };
add_filter('wp_die_handler', $die_handler);
foreach (['nonce', 'permission'] as $scenario) {
    $_POST = ['rak_nonce' => $scenario === 'nonce' ? 'invalid' : wp_create_nonce('rak_save_0')];
    if ($scenario === 'permission') wp_set_current_user(0);
    $denied = false;
    try { ReAlmeida\Kits\Admin::beforeSave(['post_type' => 'corrida'], ['ID' => 0]); }
    catch (RuntimeException $error) { $denied = true; }
    check($denied, 'salvamento rejeita ' . $scenario . ' inválido');
    wp_set_current_user(get_user_by('login', 'rak-local')->ID);
}
$_POST = [];
remove_filter('wp_die_handler', $die_handler);
$ids = [];
try {
    $id = wp_insert_post(['post_type' => 'corrida', 'post_title' => 'DEMONSTRAÇÃO — teste automatizado', 'post_name' => 'demonstracao-teste-automatizado', 'post_status' => 'draft']);
    $ids[] = $id;
    Repository::save($id, Schema::validate($d));
    check(Repository::get($id)['conditions'][0]['version'] === 1, 'primeira versão da condição persistida');
    check(Repository::get($id)['conditions'][0]['text'] === $d['conditions'][0]['text'], 'persistência preserva barras e texto exato');
    $edited = $d; $edited['conditions'][0]['text'] = 'DEMONSTRAÇÃO — novo texto';
    Repository::save($id, Schema::validate($edited));
    check(Repository::get($id)['conditions'][0]['version'] === 2, 'edição cria versão 2');
    Repository::save($id, Schema::validate($edited));
    check(Repository::get($id)['conditions'][0]['version'] === 2, 'salvar sem mudança não altera versão');
    check(get_post_meta($id, '_rak_condition_history', true)['condition-demo'][1] === $d['conditions'][0]['text'], 'histórico preserva condição anterior');
    wp_update_post(['ID' => $id, 'post_status' => 'publish']);
    $draft = wp_insert_post(['post_type' => 'corrida', 'post_title' => 'DEMONSTRAÇÃO — rascunho secreto', 'post_status' => 'draft']); $ids[] = $draft;
    $private = wp_insert_post(['post_type' => 'corrida', 'post_title' => 'DEMONSTRAÇÃO — privado', 'post_status' => 'private']); $ids[] = $private;
    $password = wp_insert_post(['post_type' => 'corrida', 'post_title' => 'DEMONSTRAÇÃO — senha', 'post_status' => 'publish', 'post_password' => 'example-only']); $ids[] = $password;
    Repository::save($password, Schema::validate($d)); wp_update_post(['ID' => $password, 'post_status' => 'publish']);
    update_post_meta($id, '_private_test', 'NEVER_PUBLIC');
    wp_set_current_user(0);
    $response = rest_do_request(new WP_REST_Request('GET', '/re-almeida/v1/corridas'));
    check($response->get_status() === 200, 'listagem pública acessível');
    $body = $response->get_data();
    $listed = array_column($body['data'], 'id');
    check(in_array((string) $id, $listed, true) && !array_intersect([(string) $draft, (string) $private, (string) $password], $listed), 'API exclui rascunhos, privados e protegidos por senha');
    check(!str_contains(wp_json_encode($body), 'NEVER_PUBLIC') && !str_contains(wp_json_encode($body), '_rak_condition_history'), 'API não revela metadados privados nem histórico');
    $detail = rest_do_request(new WP_REST_Request('GET', '/re-almeida/v1/corridas/' . get_post($id)->post_name));
    check($detail->get_status() === 200 && count($detail->get_data()['data']['modalities']) === 2, 'detalhe contém ambas as modalidades configuradas');
    foreach ([$draft, $private, $password] as $hidden) {
        check(rest_do_request(new WP_REST_Request('GET', '/re-almeida/v1/corridas/' . get_post($hidden)->post_name))->get_status() === 404, 'detalhe privado/rascunho/senha retorna 404');
    }
    check(rest_do_request(new WP_REST_Request('POST', '/re-almeida/v1/corridas'))->get_status() === 404, 'nenhuma rota pública de escrita');
    check(rest_do_request(new WP_REST_Request('GET', '/wp/v2/corrida'))->get_status() === 403, 'rota core do CPT exige administração');
    $request = new WP_REST_Request('GET', '/re-almeida/v1/corridas'); $request['per_page'] = 101;
    check(rest_do_request($request)->get_status() === 400, 'paginação inválida rejeitada');
    $closed = $d; $closed['status'] = 'closed'; Repository::save($id, Schema::validate($closed));
    $detail = rest_do_request(new WP_REST_Request('GET', '/re-almeida/v1/corridas/' . get_post($id)->post_name));
    check($detail->get_status() === 200 && $detail->get_data()['data']['status'] === 'closed', 'corrida encerrada permanece consultável');
    $projected = Rest::project(get_post($id));
    file_put_contents(__DIR__ . '/../.local-tools/contract-race.json', wp_json_encode($projected, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    wp_set_current_user(get_user_by('login', 'rak-local')->ID);
    $_POST = ['rak_nonce' => wp_create_nonce('rak_save_' . $id), 'rak_payload' => wp_slash(wp_json_encode(array_replace($d, ['officialCents' => -1])))];
    wp_update_post(['ID' => $id, 'post_title' => 'DEMONSTRAÇÃO — teste automatizado', 'post_status' => 'publish']);
    check(Repository::get($id)['status'] === 'closed' && get_post($id)->post_status === 'publish', 'salvamento inválido mantém configuração e publicação anteriores');
    check((bool) get_transient('rak_edit_' . get_current_user_id() . '_' . $id), 'erro e tentativa inválida preservados para correção');
    $_POST = ['rak_nonce' => wp_create_nonce('rak_save_' . $id), 'rak_payload' => wp_slash(wp_json_encode($d))];
    wp_update_post(['ID' => $id, 'post_status' => 'publish']);
    check(Repository::get($id)['status'] === 'open' && !get_transient('rak_edit_' . get_current_user_id() . '_' . $id), 'cadastro corrigido salva e limpa erro');
    $_POST = [];
    $before = Repository::get($id); Migrations::upgrade();
    check(Repository::get($id) === $before, 'migração idempotente preserva corridas');
} finally {
    $_POST = [];
    foreach ($ids as $id) wp_delete_post($id, true);
}
echo "PASS: $count verificações com WordPress real." . PHP_EOL;
