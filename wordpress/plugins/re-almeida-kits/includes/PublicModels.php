<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
/** Public, blank forms only. Signed/personal documents never enter this component. */
final class PublicModels {
    public static function boot(): void {
        add_action('admin_post_rak_public_model', [self::class, 'download']);
        add_action('admin_post_nopriv_rak_public_model', [self::class, 'download']);
        add_filter('pre_delete_attachment', static function ($delete, $post) {
            if (get_post_meta($post->ID, '_rak_public_template', true)) return false;
            return $delete;
        }, 10, 2);
        add_filter('wp_handle_upload_prefilter', static function ($file) {
            if (in_array(get_post_type(absint($_REQUEST['post_id'] ?? 0)), ['corrida','rak_document'], true) && strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) === 'pdf') {
                $valid = self::checkFile($file['tmp_name']);
                if (is_wp_error($valid)) $file['error'] = $valid->get_error_message();
            }
            return $file;
        });
    }
    public static function checkFile(string $file) {
        if (!class_exists(\finfo::class)) return new \WP_Error('rak_pdf', 'A extensão PHP Fileinfo é necessária para validar os modelos PDF.');
        if (!is_file($file) || filesize($file) > 5 * MB_IN_BYTES || filesize($file) < 12) return new \WP_Error('rak_pdf', 'O modelo deve ser um PDF válido de até 5 MB.');
        $bytes = file_get_contents($file);
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($file);
        if ($mime !== 'application/pdf' || !preg_match('/^%PDF-(?:1\.[0-9]|2\.0)/', $bytes) || !str_contains(substr($bytes, -2048), '%%EOF') || preg_match('#/(?:JavaScript|JS|Launch|EmbeddedFile|OpenAction|AA)\b#i', $bytes)) {
            return new \WP_Error('rak_pdf', 'PDF inválido ou com ações/anexos não permitidos. Use um formulário PDF estático em branco.');
        }
        return true;
    }
    public static function validate(int $id) {
        $post = get_post($id);
        $file = get_attached_file($id);
        $uploads = wp_upload_dir();
        $base = realpath($uploads['basedir']);
        $real = $file ? realpath($file) : false;
        if (!$post || $post->post_type !== 'attachment' || $post->post_mime_type !== 'application/pdf' || !$base || !$real || !str_starts_with(wp_normalize_path($real), trailingslashit(wp_normalize_path($base))) || strtolower(pathinfo($real, PATHINFO_EXTENSION)) !== 'pdf') {
            return new \WP_Error('rak_pdf', 'Selecione um PDF local da biblioteca de mídia, sem URL externa.');
        }
        return self::checkFile($real);
    }
    public static function approve(int $id, bool $confirmed) {
        if (!current_user_can(CAPABILITY) || !current_user_can('upload_files')) return new \WP_Error('rak_forbidden', 'Sem permissão para disponibilizar modelos públicos.');
        if (!$confirmed && !get_post_meta($id, '_rak_public_template', true)) return new \WP_Error('rak_pdf', 'Confirme que o modelo é público, em branco e sem dados pessoais.');
        $valid = self::validate($id);
        if (is_wp_error($valid)) return $valid;
        update_post_meta($id, '_rak_public_template', 1);
        return true;
    }
    public static function describe(int $id): ?array {
        if (!$id || !get_post_meta($id, '_rak_public_template', true) || is_wp_error(self::validate($id))) return null;
        return ['url' => add_query_arg(['action' => 'rak_public_model', 'attachment' => $id], admin_url('admin-post.php')), 'name' => sanitize_file_name(basename(get_attached_file($id))), 'mime' => 'application/pdf'];
    }
    public static function download(): void {
        if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD'], true)) wp_die('Método não permitido.', '', ['response' => 405]);
        $id = isset($_GET['attachment']) ? absint($_GET['attachment']) : 0;
        if (!self::describe($id)) wp_die('Modelo público não encontrado.', '', ['response' => 404]);
        $file = get_attached_file($id);
        nocache_headers();
        header('Content-Type: application/pdf');
        header('X-Content-Type-Options: nosniff');
        header('Content-Disposition: attachment; filename="' . sanitize_file_name(basename($file)) . '"');
        header('Content-Length: ' . filesize($file));
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'HEAD') readfile($file);
        exit;
    }
}
