<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class VoucherPickup {
    public static function boot(): void {
        add_filter('woocommerce_prevent_admin_access', static function ($prevent) {
            return current_user_can(Vouchers::CAPABILITY) && ($_GET['page'] ?? '') === 'rak-pickup' ? false : $prevent;
        });
        add_action('admin_menu', static function (): void {
            $screen = add_menu_page('Conferência de retirada', 'Conferir retirada', Vouchers::CAPABILITY, 'rak-pickup', [self::class, 'render'], 'dashicons-yes-alt', 57);
            add_action('load-' . $screen, static function (): void {
                wp_enqueue_style('rak-pickup', plugins_url('assets/pickup.css', FILE), [], VERSION);
                wp_enqueue_script('rak-jsqr', plugins_url('assets/jsQR.js', FILE), [], '1.4.0', true);
                wp_enqueue_script('rak-pickup', plugins_url('assets/pickup.js', FILE), ['rak-jsqr'], VERSION, true);
            });
        });
        add_action('rest_api_init', static function (): void {
            foreach (['lookup', 'confirm', 'search'] as $action) register_rest_route('re-almeida/v1', '/pickup/' . $action, [
                'methods' => 'POST', 'permission_callback' => [self::class, 'permission'], 'callback' => [self::class, $action],
            ]);
        });
        add_action('admin_post_rak_voucher_pdf', [VoucherPdf::class, 'download']);
        add_action('admin_post_nopriv_rak_voucher_pdf', [VoucherPdf::class, 'download']);
        add_filter('rest_post_dispatch', static function ($response, $server, $request) {
            if (str_starts_with($request->get_route(), '/re-almeida/v1/pickup/') || str_starts_with($request->get_route(), '/re-almeida/v1/account/orders')) {
                $response->header('Cache-Control', 'private, no-store, max-age=0');
                $response->header('Referrer-Policy', 'no-referrer');
            }
            return $response;
        }, 20, 3);
    }

    public static function permission(\WP_REST_Request $request) {
        return is_user_logged_in() && current_user_can(Vouchers::CAPABILITY) && wp_verify_nonce($request->get_header('X-WP-Nonce'), 'wp_rest')
            ? true : Identity::error('Entre com uma conta autorizada à conferência.', 403);
    }

    private static function payload(object $voucher) {
        $row = KitOrderRepository::get((int) $voucher->request_id);
        if (!$row) return Identity::error('Código inexistente ou inválido.', 404);
        $synced = Vouchers::sync($row);
        if (is_wp_error($synced)) return $synced;
        $voucher = VoucherRepository::get((int) $row->id, (int) $voucher->line_index);
        $snapshot = json_decode($row->snapshot, true) ?: [];
        $line = $snapshot['lines'][$voucher->line_index] ?? [];
        return ['token' => $voucher->token, 'code' => VoucherRepository::code($voucher), 'request' => (int) $row->id, 'participant' => $line['participant'] ?? '',
            'race' => $line['race'] ?? '', 'modality' => ($line['modality'] ?? '') === 'appai' ? 'APPAI' : 'Kit Oficial',
            'state' => $voucher->state, 'label' => Vouchers::STATES[$voucher->state], 'reason' => $voucher->reason,
            'collectedAt' => $voucher->collected_at ? $voucher->collected_at . 'Z' : null,
            'actor' => $voucher->collected_by ? (int) $voucher->collected_by : null, 'operation' => $voucher->operation_id];
    }

    public static function lookup(\WP_REST_Request $request) {
        $params = $request->get_json_params();
        $token = $params['token'] ?? '';
        $code = $params['code'] ?? null;
        if (is_string($code) && !self::allowSearch()) return self::rateError();
        $voucher = is_string($code) ? VoucherRepository::byCode(trim($code))
            : (is_string($token) ? VoucherRepository::token($token) : null);
        return $voucher ? self::payload($voucher) : Identity::error('Código inexistente ou inválido.', 404);
    }

    public static function confirm(\WP_REST_Request $request) {
        $token = $request->get_json_params()['token'] ?? '';
        $voucher = is_string($token) ? VoucherRepository::token($token) : null;
        if (!$voucher) return Identity::error('Código inexistente ou inválido.', 404);
        $result = Vouchers::confirm($voucher);
        return is_wp_error($result) ? $result : self::payload($result);
    }

    public static function search(\WP_REST_Request $request) {
        $query = $request->get_json_params()['q'] ?? '';
        if (!is_string($query) || mb_strlen(trim($query)) < 2 || mb_strlen($query) > 100) return Identity::error('Informe ao menos dois caracteres (solicitação, participante ou corrida).');
        if (!self::allowSearch()) return self::rateError();
        $query = trim($query);
        if (preg_match('/^V-[0-9]+$/iD', $query)) {
            $voucher = VoucherRepository::byCode($query);
            if (!$voucher) return ['results' => []];
            $result = self::payload($voucher);
            return is_wp_error($result) ? $result : ['results' => [$result]];
        }
        $cpf = preg_match('/^(?:[0-9]{11}|[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2})$/D', $query) ? Identity::digits($query) : '';
        if ($cpf !== '' && !Identity::cpf($cpf)) return Identity::error('Informe um CPF válido.');
        global $wpdb;
        $table = Accounts::table('requests');
        $like = '%' . $wpdb->esc_like($cpf ?: $query) . '%';
        $rows = $wpdb->get_results($wpdb->prepare("SELECT * FROM $table WHERE order_id IS NOT NULL AND (id=%d OR snapshot LIKE %s) ORDER BY id DESC LIMIT 30", $cpf ? 0 : absint($query), $like));
        $results = [];
        foreach ($rows as $row) {
            $snapshot = json_decode($row->snapshot, true) ?: [];
            $synced = Vouchers::sync($row);
            if (is_wp_error($synced)) return $synced;
            foreach ($synced as $index => $voucher) {
                $line = $snapshot['lines'][$index];
                if ($cpf !== '') {
                    [$person] = RequestQueue::item($snapshot, $line);
                    if (Identity::digits($line['cpf'] ?? $person['cpf'] ?? '') !== $cpf) continue;
                } else {
                    $text = remove_accents($line['participant'] . ' ' . $line['race']);
                    if ((string) $row->id !== $query && !str_contains(mb_strtolower($text), mb_strtolower(remove_accents($query)))) continue;
                }
                $results[] = self::payload($voucher);
                if (count($results) >= 30) break 2;
            }
        }
        return ['results' => $results];
    }

    private static function allowSearch(): bool {
        return AccountAuth::throttle('pickup-search-' . get_current_user_id(), 60, 300);
    }

    private static function rateError(): \WP_Error {
        return Identity::error('Muitas consultas. Aguarde alguns minutos antes de tentar novamente.', 429);
    }

    public static function render(): void {
        if (!current_user_can(Vouchers::CAPABILITY)) wp_die('Acesso restrito.', '', ['response' => 403]);
        nocache_headers();
        header('Referrer-Policy: no-referrer');
        printf('<div class="wrap rak-pickup" data-api="%s" data-nonce="%s"><h1>Conferência de retirada</h1><p>A leitura consulta o voucher. Confirme a retirada somente após conferir os dados.</p>', esc_url(rest_url('re-almeida/v1/pickup/')), esc_attr(wp_create_nonce('wp_rest')));
        echo '<button class="button" type="button" id="rak-camera">Abrir câmera</button> <button class="button" type="button" id="rak-stop" hidden>Fechar câmera</button><video id="rak-video" playsinline muted hidden></video>';
        echo '<form id="rak-code"><label>Código do voucher ou URL do QR Code<input id="rak-token" autocomplete="off" required maxlength="2048"></label><button class="button">Consultar código</button></form>';
        echo '<form id="rak-search"><label>CPF, nome do participante, solicitação ou corrida<input id="rak-query" type="search" autocomplete="off" minlength="2" maxlength="100" required></label><button class="button">Pesquisar</button></form><p role="status" aria-live="polite" id="rak-status"></p><div id="rak-results"></div></div>';
    }
}
