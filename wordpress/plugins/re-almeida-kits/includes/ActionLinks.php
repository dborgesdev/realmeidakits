<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class ActionLinks {
    public static function boot(): void {
        add_action('admin_post_rak_open_voucher', [self::class, 'openVoucher']);
        add_action('admin_post_nopriv_rak_open_voucher', [self::class, 'openVoucher']);
    }

    public static function voucher(int $request, int $line): string {
        return add_query_arg(['action' => 'rak_open_voucher', 'request' => $request, 'line' => $line], admin_url('admin-post.php'));
    }

    public static function documents(int $request, int $line): string {
        return PublicPages::url('/conta') . '?pedido=' . $request . '&documentos=' . $line . '#pedido-' . $request;
    }

    public static function allowed(string $target): bool {
        $adminPath = wp_parse_url(admin_url('admin-post.php'), PHP_URL_PATH);
        return (bool) preg_match('#^' . preg_quote($adminPath, '#') . '\?action=rak_open_voucher&request=[1-9][0-9]*&line=[0-9]+$#D', $target) ||
            (bool) preg_match('#^/conta\?pedido=[1-9][0-9]*(?:&documentos=[0-9]+)?(?:\#pedido-[1-9][0-9]*)?$#D', $target);
    }

    public static function openVoucher(): void {
        $id = absint($_GET['request'] ?? 0);
        $line = filter_var($_GET['line'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
        if (!$id || $line === false) wp_die('Voucher não encontrado.', '', ['response' => 404]);
        nocache_headers(); header('Cache-Control: private, no-store, max-age=0'); header('Referrer-Policy: no-referrer');
        if (!is_user_logged_in()) {
            $target = wp_parse_url(self::voucher($id, $line), PHP_URL_PATH) . '?' . wp_parse_url(self::voucher($id, $line), PHP_URL_QUERY);
            wp_safe_redirect(add_query_arg('rak_return', rawurlencode($target), wc_get_page_permalink('myaccount')));
            exit;
        }
        $pdf = VoucherPdf::content($id, $line);
        if (is_wp_error($pdf)) wp_die(esc_html($pdf->get_error_message()), '', ['response' => $pdf->get_error_data()['status']]);
        header('Content-Type: application/pdf'); header('X-Content-Type-Options: nosniff');
        header('Content-Disposition: inline; filename="voucher-' . $id . '-' . $line . '.pdf"');
        echo $pdf; exit;
    }
}
