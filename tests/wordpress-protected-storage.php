<?php
/** Standalone filesystem regression checks for protected mode. */
$base = realpath($argv[1]) . DIRECTORY_SEPARATOR . 'rak-protected-test-' . bin2hex(random_bytes(8));
if (!mkdir($base . '/app/wp-content', 0700, true)) throw new RuntimeException('Falha ao preparar teste.');
define('ABSPATH', $base . '/app/');
define('WP_CONTENT_DIR', $base . '/app/wp-content');
define('RAK_PRIVATE_DOCUMENT_STORAGE', 'protected');
define('RAK_PRIVATE_DOCUMENT_HTTP_VERIFIED', ($argv[2] ?? '') === 'verified');
$_SERVER['DOCUMENT_ROOT'] = $base;
function current_user_can(string $capability): bool { return $capability === 'manage_options'; }
function get_user_meta(int $owner, string $key, bool $single): array|string {
    return $owner === 11 && $key === '_rak_private_document_' . str_repeat('a', 32)
        ? ['mime' => 'application/pdf', 'storage' => 'protected'] : '';
}
require __DIR__ . '/../wordpress/plugins/re-almeida-kits/includes/PrivateDocumentStore.php';
use ReAlmeida\Kits\PrivateDocumentStore;
$path = WP_CONTENT_DIR . '/rak-private-documents';
try {
    PrivateDocumentStore::prepareProtected();
    if (!is_file($path . '/.htaccess') || !str_contains(file_get_contents($path . '/.htaccess'), 'Require all denied')) {
        throw new RuntimeException('Proteção local não instalada.');
    }
    if (PrivateDocumentStore::root($issue) !== null || !str_contains($issue, 'primeira RewriteRule')) {
        throw new RuntimeException('A regra principal precisa existir.');
    }
    file_put_contents($base . '/.htaccess', "RewriteEngine On\nRewriteRule ^app/wp-content/rak-private-documents(?:/|$) - [F,NC]\n");
    $root = PrivateDocumentStore::root($issue);
    if (RAK_PRIVATE_DOCUMENT_HTTP_VERIFIED ? $root !== realpath($path) : ($root !== null || !str_contains($issue, 'bloqueio HTTP'))) {
        throw new RuntimeException('A autorização deve depender da prova HTTP.');
    }
    $token = str_repeat('a', 32);
    file_put_contents($path . '/' . $token, 'synthetic');
    $document = PrivateDocumentStore::open(11, $token);
    if (RAK_PRIVATE_DOCUMENT_HTTP_VERIFIED) {
        if (!$document || stream_get_contents($document['handle']) !== 'synthetic') throw new RuntimeException('Titular não conseguiu ler o arquivo.');
        fclose($document['handle']);
    } elseif ($document !== null) {
        throw new RuntimeException('A leitura deve aguardar a confirmação HTTP.');
    }
    if (PrivateDocumentStore::open(12, $token) !== null) throw new RuntimeException('Outro titular acessou o arquivo.');
    file_put_contents($path . '/.htaccess', 'Require all granted');
    PrivateDocumentStore::prepareProtected();
    if (PrivateDocumentStore::root($issue) !== null || file_get_contents($path . '/.htaccess') !== 'Require all granted') {
        throw new RuntimeException('Proteção alterada deve bloquear acesso sem sobrescrever arquivo existente.');
    }
    echo 'OK modo protegido, verificação manual ' . (RAK_PRIVATE_DOCUMENT_HTTP_VERIFIED ? 'confirmada' : 'pendente') . PHP_EOL;
} finally {
    foreach ([$path . '/.htaccess', $base . '/.htaccess', $path . '/' . str_repeat('a', 32)] as $file) if (is_file($file)) unlink($file);
    foreach ([$path, WP_CONTENT_DIR, ABSPATH, $base] as $directory) if (is_dir($directory)) rmdir($directory);
}
