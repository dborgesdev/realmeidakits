<?php
/** Run against a disposable WordPress with the plugin active. */
$root = realpath($argv[1]);
$_SERVER['DOCUMENT_ROOT'] = dirname($root);
$mode = $argv[2] ?? 'private';
$target = ($mode === 'public' ? $root : dirname($_SERVER['DOCUMENT_ROOT'])) . '/rak-test-' . bin2hex(random_bytes(8));
if ($mode !== 'missing') define('RAK_PRIVATE_DOCUMENT_ROOT', $target);
require $root . '/wp-load.php';
if (wp_parse_url(home_url(), PHP_URL_HOST) !== '127.0.0.1') exit(1);
$admin = get_users(['role' => 'administrator', 'number' => 1, 'fields' => 'ID'])[0] ?? 0;
$unauthorized = ReAlmeida\Kits\DraftDocuments::siteHealth();
if (isset(apply_filters('site_status_tests', [])['direct']['rak_private_documents']) ||
    !str_contains($unauthorized['description'], 'restrito')) {
    throw new RuntimeException('O diagnóstico exige autorização administrativa.');
}
wp_set_current_user((int) $admin);
if (in_array($mode, ['restricted', 'blocked'], true)) {
    if ($mode === 'restricted' && !mkdir($target, 0700)) throw new RuntimeException('Falha ao preparar o diretório privado.');
    $allowed = $_SERVER['DOCUMENT_ROOT'] . ($mode === 'restricted' ? PATH_SEPARATOR . $target : '');
    if (ini_set('open_basedir', $allowed) === false || @realpath(dirname($target)) !== false) {
        throw new RuntimeException('O teste precisa bloquear o diretório pai.');
    }
}
$path = ReAlmeida\Kits\PrivateDocumentStore::root($reason);
try {
    if ($mode === 'private') {
        if (!$path || $reason !== null || realpath($target) !== $path) throw new RuntimeException('Diretório privado não foi criado. ' . $reason);
        $tests = apply_filters('site_status_tests', []);
        $result = $tests['direct']['rak_private_documents']['test']();
        if ($result['status'] !== 'good') throw new RuntimeException($result['description']);
    } elseif ($mode === 'restricted') {
        if (!$path || $reason !== null || realpath($target) !== $path) {
            throw new RuntimeException('O diretório permitido deve funcionar mesmo com o pai bloqueado. ' . $reason);
        }
        $result = ReAlmeida\Kits\DraftDocuments::siteHealth();
        if (!str_contains($result['description'], 'Sim, confirmado pelo PHP') ||
            !str_contains($result['description'], 'Todas as operações passaram') ||
            str_contains($result['description'], basename($target)) ||
            count(scandir($path)) !== 2) {
            throw new RuntimeException('A prova administrativa deve passar sem revelar o caminho ou deixar arquivos.');
        }
    } elseif ($mode === 'blocked') {
        if ($path !== null || !str_contains($reason ?? '', 'open_basedir')) {
            throw new RuntimeException('O caminho bloqueado deve retornar diagnóstico de open_basedir.');
        }
        $before = glob(WP_CONTENT_DIR . '/rak-probe-*');
        $result = ReAlmeida\Kits\DraftDocuments::siteHealth();
        if (!str_contains($result['description'], 'bloqueio informado pelo PHP') ||
            !str_contains($result['description'], 'Não executado') ||
            !str_contains($result['description'], 'Controle em wp-content: criação, leitura e limpeza — Todas as operações passaram') ||
            str_contains($result['description'], WP_CONTENT_DIR) ||
            glob(WP_CONTENT_DIR . '/rak-probe-*') !== $before) {
            throw new RuntimeException('O diagnóstico deve distinguir o bloqueio do controle e limpar o diretório temporário.');
        }
    } elseif ($path !== null || $reason === null || file_exists($target)) {
        throw new RuntimeException('O caminho recusado não pode ser criado.');
    }
    echo 'OK armazenamento ' . $mode . PHP_EOL;
} finally {
    if (in_array($mode, ['private', 'restricted'], true) && is_dir($target)) rmdir($target);
}
