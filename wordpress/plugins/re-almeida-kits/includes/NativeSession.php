<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class NativeSession {
    public static function legacy(): bool {
        return !defined('RAK_LEGACY_PKCE') || RAK_LEGACY_PKCE;
    }

    public static function boot(): void {
        add_action('wp_ajax_rak_session', [self::class, 'bootstrap']);
        add_action('wp_ajax_nopriv_rak_session', [self::class, 'bootstrap']);
    }

    public static function bootstrap(): void {
        // wp_send_json ends through the Ajax handler, which sends these headers again.
        add_filter('nocache_headers', static function (array $headers): array {
            $headers['Cache-Control'] = 'private, no-store, max-age=0';
            return $headers;
        }, PHP_INT_MAX);
        nocache_headers();
        header_remove('Access-Control-Allow-Origin');
        header_remove('Access-Control-Allow-Credentials');
        $origin = get_http_origin();
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET' ||
            ($origin && $origin !== PublicPages::url('')) ||
            ($_SERVER['HTTP_X_RAK_SESSION'] ?? '') !== '1' ||
            (isset($_SERVER['HTTP_SEC_FETCH_SITE']) && $_SERVER['HTTP_SEC_FETCH_SITE'] !== 'same-origin')) {
            wp_send_json(['message' => 'Origem não autorizada.'], 403);
        }
        if (!function_exists('wc_get_page_permalink') || wc_get_page_id('myaccount') <= 0) {
            wp_send_json(['message' => 'A página Minha conta do WooCommerce está indisponível.'], 503);
        }
        wp_send_json([
            'signedIn' => is_user_logged_in(),
            'registrationEnabled' => get_option('woocommerce_enable_myaccount_registration') === 'yes',
            'nonce' => AccountAuth::customer(get_current_user_id()) ? wp_create_nonce('wp_rest') : null,
            'accountUrl' => wc_get_page_permalink('myaccount'),
            'participantLimit' => RequestSettings::limit(),
            'recoveryUrl' => wc_get_account_endpoint_url('lost-password'),
            'editUrl' => wc_get_account_endpoint_url('edit-account'),
            'checkoutUrl' => wc_get_page_id('checkout') > 0 ? wc_get_checkout_url() : '',
        ]);
    }

    public static function user(\WP_REST_Request $request): int {
        $id = get_current_user_id();
        // WordPress already validated the cookie and wp_rest nonce before dispatch.
        return wp_get_session_token() && wp_verify_nonce($request->get_header('X-WP-Nonce'), 'wp_rest') && AccountAuth::customer($id) ? $id : 0;
    }

    public static function logout(\WP_REST_Request $request) {
        if (!self::user($request)) return Identity::error('Entre na sua conta para continuar.', 401);
        wp_logout();
        return ['loggedOut' => true];
    }
}
