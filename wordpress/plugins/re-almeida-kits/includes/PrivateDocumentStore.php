<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class PrivateDocumentStore {
    private const TYPES = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png'];
    private const PREFIX = '_rak_private_document_';
    private const PROTECTION = "Require all denied\nOptions -Indexes -ExecCGI\nSetHandler none\n";
    private const ROOT_RULE = 'RewriteRule ^app/wp-content/rak-private-documents(?:/|$) - [F,NC]';

    public static function mode(): string {
        return defined('RAK_PRIVATE_DOCUMENT_STORAGE') && is_string(RAK_PRIVATE_DOCUMENT_STORAGE)
            ? RAK_PRIVATE_DOCUMENT_STORAGE : (defined('RAK_PRIVATE_DOCUMENT_STORAGE') ? 'invalid' : 'external');
    }

    public static function prepareProtected(): void {
        if (self::mode() === 'protected' && current_user_can('manage_options')) {
            self::protectedRoot($reason, true);
        }
    }

    private static function protectedRoot(?string &$reason, bool $prepare = false, ?array &$checks = null): ?string {
        $content = @realpath(WP_CONTENT_DIR);
        $public = !empty($_SERVER['DOCUMENT_ROOT']) ? @realpath($_SERVER['DOCUMENT_ROOT']) : false;
        $reason = 'confirme o layout /app/wp-content e o DOCUMENT_ROOT no PHP web';
        if (!$content || !$public || @realpath($public . '/app/wp-content') !== $content) return null;
        $path = $content . DIRECTORY_SEPARATOR . 'rak-private-documents';
        $reason = 'a pasta protegida precisa existir, ser gravável pelo PHP e não pode ser um link simbólico';
        if (is_link($path)) return null;
        if ($prepare && !is_dir($path)) @mkdir($path, 0700);
        if ($checks !== null) {
            $checks['Diretório reconhecido pelo PHP'] = is_dir($path) ? 'Sim' : 'Não';
            $checks['Escrita permitida pelo PHP'] = is_writable($path) ? 'Sim' : 'Não';
        }
        if (@realpath($path) !== $path || !is_dir($path) || !is_readable($path) || !is_writable($path) ||
            (PHP_OS_FAMILY !== 'Windows' && !is_executable($path))) return null;

        $reason = 'instale a proteção Apache na pasta privada';
        $local = $path . '/.htaccess';
        if ($prepare && !file_exists($local) && !is_link($local)) {
            $file = @fopen($local, 'xb');
            if ($file) {
                @fwrite($file, self::PROTECTION);
                fclose($file);
            }
        }
        if (is_link($local) || !is_file($local) ||
            str_replace("\r\n", "\n", (string) @file_get_contents($local)) !== self::PROTECTION) return null;
        if ($checks !== null) $checks['Proteção Apache da pasta'] = 'Instalada';
        $reason = 'instale a regra de bloqueio como primeira RewriteRule no .htaccess da raiz do domínio';
        $main = @file_get_contents($public . '/.htaccess');
        if (!is_string($main) || !preg_match('/^\h*(RewriteRule\h+[^\r\n]+)$/mi', $main, $rule) ||
            trim($rule[1]) !== self::ROOT_RULE) return null;
        if ($checks !== null) $checks['Proteção Apache da raiz'] = 'Instalada';
        $reason = 'confirme o bloqueio HTTP direto com um arquivo sintético antes de habilitar o armazenamento';
        if (!defined('RAK_PRIVATE_DOCUMENT_HTTP_VERIFIED') || RAK_PRIVATE_DOCUMENT_HTTP_VERIFIED !== true) return null;
        if ($checks !== null) $checks['Bloqueio HTTP direto'] = 'Confirmação administrativa registrada';
        $reason = null;
        return $path;
    }

    private static function configuredPath(): string {
        return defined('RAK_PRIVATE_DOCUMENT_ROOT') && is_string(RAK_PRIVATE_DOCUMENT_ROOT)
            ? rtrim(RAK_PRIVATE_DOCUMENT_ROOT, '/\\') : '';
    }

    private static function absolutePath(string $path): bool {
        return preg_match('~^(?:/|[a-zA-Z]:[\\\\/])~', $path) === 1 &&
            !str_contains($path, "\0") && !in_array(basename($path), ['.', '..'], true);
    }

    public static function root(?string &$reason = null, bool $allowCreate = true): ?string {
        if (self::mode() === 'protected') return self::protectedRoot($reason);
        if (self::mode() !== 'external') {
            $reason = 'configure o modo de armazenamento como external ou protected';
            return null;
        }
        return self::externalRoot($reason, $allowCreate);
    }

    private static function externalRoot(?string &$reason, bool $allowCreate = false): ?string {
        $path = self::configuredPath();
        $reason = 'configure RAK_PRIVATE_DOCUMENT_ROOT com um caminho absoluto';
        if (!self::absolutePath($path)) return null;
        $reason = 'confira DOCUMENT_ROOT e o caminho da instalação WordPress';
        $documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
        $public = $documentRoot !== '' ? @realpath($documentRoot) : false;
        $wordpress = @realpath(ABSPATH);
        if (!$public || !$wordpress) return null;
        $resolved = self::resolve($path, 'diretório privado', $reason);
        if (!$resolved && $reason !== null) return null;
        if (!$resolved && !$allowCreate) {
            $reason = 'realpath() não conseguiu resolver a pasta privada. O PHP pode não enxergar o caminho ou não ter acesso a um diretório da hierarquia';
            return null;
        }
        $candidate = $resolved;
        if (!$resolved) {
            $parent = self::resolve(dirname($path), 'diretório pai', $reason);
            if (!$parent || !is_dir($parent)) {
                $reason ??= 'o diretório pai não existe ou o PHP não consegue atravessá-lo';
                return null;
            }
            $candidate = $parent . DIRECTORY_SEPARATOR . basename($path);
        }
        $normalize = static function (string $value): string {
            $value = rtrim(str_replace('\\', '/', $value), '/') . '/';
            return PHP_OS_FAMILY === 'Windows' ? strtolower($value) : $value;
        };
        $private = $normalize($candidate);
        foreach ([$public, $wordpress] as $root) {
            $root = $normalize($root);
            if (str_starts_with($private, $root) || str_starts_with($root, $private)) {
                $reason = 'o diretório privado precisa ficar fora das árvores públicas';
                return null;
            }
        }
        if (!$resolved && !@mkdir($candidate, 0700) && !is_dir($candidate)) {
            $reason = 'o PHP não conseguiu criar o diretório privado. Confira permissões no diretório pai';
            return null;
        }
        clearstatcache(true, $path);
        $actual = self::resolve($path, 'diretório privado', $reason);
        if (!$actual || $normalize($actual) !== $private || !is_dir($actual)) {
            $reason ??= 'o caminho configurado não corresponde a um diretório privado válido';
            return null;
        }
        if (!is_readable($actual) || !is_writable($actual) || (PHP_OS_FAMILY !== 'Windows' && !is_executable($actual))) {
            $reason = 'o PHP precisa de permissão de leitura, escrita e travessia no diretório privado';
            return null;
        }
        $reason = null;
        return $actual;
    }

    public static function diagnostic(): array {
        if (self::mode() === 'protected') {
            $checks = [
                'Modo de armazenamento' => 'Protegido em wp-content',
                'Diretório reconhecido pelo PHP' => 'Não verificado',
                'Escrita permitida pelo PHP' => 'Não verificada',
                'Proteção Apache da pasta' => 'Não confirmada',
                'Proteção Apache da raiz' => 'Não confirmada',
                'Bloqueio HTTP direto' => 'Confirmação pendente',
            ];
            $root = self::protectedRoot($issue, false, $checks);
            return [$root, $issue, $checks];
        }
        $path = self::configuredPath();
        $valid = self::absolutePath($path);
        $restricted = (string) ini_get('open_basedir') !== '';
        $resolved = $valid ? self::resolve($path, 'diretório privado', $resolutionIssue) : false;
        $blocked = str_starts_with($resolutionIssue ?? '', 'open_basedir');
        set_error_handler(static function (int $severity, string $message) use (&$blocked): bool {
            $blocked = $blocked || str_contains($message, 'open_basedir restriction in effect');
            return true;
        }, E_WARNING);
        try {
            $directory = $valid && is_dir($path);
            $writable = $valid && is_writable($path);
        } finally {
            restore_error_handler();
        }
        $issue = null;
        $root = self::root($issue, false);
        if (!$root && $blocked) $issue = 'open_basedir impede o acesso do PHP ao diretório privado';
        $checks = [
            'open_basedir configurado' => $restricted ? 'Sim' : 'Não',
            'Pasta permitida pelo open_basedir' => !$restricted ? 'Sem restrição' :
                ($resolved || $directory || $writable ? 'Sim, confirmado pelo PHP' :
                    ($blocked ? 'Não, bloqueio informado pelo PHP' : 'Indeterminado')),
            'realpath() resolveu a pasta' => $resolved ? 'Sim' : ($valid ? 'Não' : 'Não testado'),
            'Caminho canônico da pasta privada' => !$resolved ? 'Não disponível' :
                (str_replace('\\', '/', $resolved) === str_replace('\\', '/', $path) ? 'Coincide com o configurado' : 'Difere do configurado'),
            'is_dir() reconheceu a pasta' => $valid ? ($directory ? 'Sim' : 'Não') : 'Não testado',
            'is_writable() reconheceu acesso de escrita' => $valid ? ($writable ? 'Sim' : 'Não') : 'Não testado',
            'Permissões da pasta privada' => $resolved && $directory ? self::directoryAccess($resolved) : 'Não disponíveis',
        ];
        return [$root, $issue, $checks];
    }

    public static function directoryAccess(string $path): string {
        $mode = @fileperms($path);
        return ($mode === false ? 'Modo não disponível' : sprintf('Modo %04o', $mode & 0777)) .
            ' · leitura ' . (@is_readable($path) ? 'sim' : 'não') .
            ' · escrita ' . (@is_writable($path) ? 'sim' : 'não') .
            (PHP_OS_FAMILY === 'Windows' ? '' : ' · travessia ' . (@is_executable($path) ? 'sim' : 'não'));
    }

    private static function resolve(string $path, string $label, ?string &$reason): string|false {
        $reason = null;
        set_error_handler(static function (int $severity, string $message) use ($label, &$reason): bool {
            $reason = str_contains($message, 'open_basedir restriction in effect')
                ? 'open_basedir impede o acesso do PHP ao ' . $label
                : 'o PHP não conseguiu resolver o caminho do ' . $label . '. Confira o caminho e as permissões';
            return true;
        }, E_WARNING);
        try {
            return realpath($path);
        } finally {
            restore_error_handler();
        }
    }

    public static function limit(): int {
        $limit = defined('RAK_PRIVATE_DOCUMENT_MAX_BYTES') && is_int(RAK_PRIVATE_DOCUMENT_MAX_BYTES)
            ? max(1, min(20 * 1024 * 1024, RAK_PRIVATE_DOCUMENT_MAX_BYTES)) : 5 * 1024 * 1024;
        $file = wp_convert_hr_to_bytes(ini_get('upload_max_filesize'));
        $post = wp_convert_hr_to_bytes(ini_get('post_max_size'));
        if ($file > 0) $limit = min($limit, $file);
        if ($post > 0) $limit = min($limit, max(0, $post - 8192));
        return $limit;
    }

    public static function uploadIssue(): ?string {
        if (!ini_get('file_uploads')) return 'habilite file_uploads no PHP';
        if (!class_exists(\finfo::class)) return 'habilite a extensão Fileinfo no PHP';
        if (self::limit() < 1) return 'aumente post_max_size no PHP';
        $tmp = ini_get('upload_tmp_dir') ?: sys_get_temp_dir();
        if (!@is_dir($tmp) || !@is_writable($tmp)) return 'confira upload_tmp_dir, permissões e open_basedir';
        self::root($reason);
        return $reason;
    }

    public static function record(int $owner, string $token): ?array {
        if (!preg_match('/^[a-f0-9]{32}$/D', $token)) return null;
        $record = get_user_meta($owner, self::PREFIX . $token, true);
        return is_array($record) && isset(self::TYPES[$record['mime'] ?? '']) ? $record : null;
    }

    public static function put(int $owner, array $file, array $context) {
        $root = self::root();
        if (!$root || self::uploadIssue()) return Identity::error('Não foi possível acessar o serviço de envio. Tente novamente ou fale com o atendimento.', 503);
        if (in_array($file['error'] ?? null, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
            return Identity::error('O arquivo excede o tamanho permitido.', 413);
        }
        $tmp = $file['tmp_name'] ?? null;
        if (($file['error'] ?? null) !== UPLOAD_ERR_OK || !is_string($tmp) || !is_uploaded_file($tmp)) {
            return Identity::error('Não foi possível receber o arquivo.');
        }
        $size = filesize($tmp);
        if (!$size || $size > self::limit()) return Identity::error('O arquivo excede o tamanho permitido.', 413);
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($tmp);
        $extension = is_string($file['name'] ?? null) ? strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) : '';
        if ($extension === 'jpeg') $extension = 'jpg';
        if (!is_string($mime) || (self::TYPES[$mime] ?? null) !== $extension || !self::validContent($tmp, $mime, $size)) {
            return Identity::error('Envie um PDF, JPG ou PNG válido.', 415);
        }
        $token = bin2hex(random_bytes(16));
        $path = $root . DIRECTORY_SEPARATOR . $token;
        if (!move_uploaded_file($tmp, $path)) return Identity::error('Não foi possível guardar o arquivo privado.', 503);
        @chmod($path, 0600);
        if (!add_user_meta($owner, self::PREFIX . $token, [
            'mime' => $mime, 'context' => $context, 'storage' => self::mode(),
            'name' => sanitize_file_name(wp_basename($file['name'])), 'uploadedAt' => gmdate('Y-m-d H:i') . ' UTC',
        ], true)) {
            @unlink($path);
            return Identity::error('Não foi possível registrar o documento.', 503);
        }
        return $token;
    }

    private static function validContent(string $path, string $mime, int $size): bool {
        if ($mime !== 'application/pdf') return (@getimagesize($path)['mime'] ?? '') === $mime;
        $prefix = file_get_contents($path, false, null, 0, 8);
        $tail = file_get_contents($path, false, null, max(0, $size - 1024));
        return is_string($prefix) && str_starts_with($prefix, '%PDF-') && is_string($tail) && str_contains($tail, '%%EOF');
    }

    public static function open(int $owner, string $token) {
        $record = self::record($owner, $token);
        $root = $record ? self::recordRoot($record) : null;
        if (!$root || !$record) return null;
        $path = $root . DIRECTORY_SEPARATOR . $token;
        if (!is_file($path) || is_link($path)) return null;
        $handle = @fopen($path, 'rb');
        if (!$handle) return null;
        return ['handle' => $handle, 'mime' => $record['mime'], 'extension' => self::TYPES[$record['mime']]];
    }

    public static function remove(int $owner, string $token): void {
        $record = self::record($owner, $token);
        if (!$record || KitOrderRepository::retains($owner, $token)) return;
        $root = self::recordRoot($record);
        if (!$root) return;
        $path = $root . DIRECTORY_SEPARATOR . $token;
        if ((is_file($path) || is_link($path)) && !@unlink($path)) return;
        delete_user_meta($owner, self::PREFIX . $token);
    }

    private static function recordRoot(array $record): ?string {
        return match ($record['storage'] ?? 'external') {
            'external' => self::externalRoot($reason),
            'protected' => self::protectedRoot($reason),
            default => null,
        };
    }
}
