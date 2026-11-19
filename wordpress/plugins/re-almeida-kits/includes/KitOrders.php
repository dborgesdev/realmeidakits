<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class KitOrders {
    public static function boot(): void {
        add_filter('site_status_tests', static function (array $tests): array {
            if (current_user_can('manage_options') && current_user_can('view_site_health_checks')) {
                $tests['direct']['rak_checkout'] = [
                    'label' => 'Checkout Re Almeida Kits',
                    'test' => [self::class, 'siteHealth'],
                ];
            }
            return $tests;
        });
        add_action('woocommerce_thankyou', static function (int $id): void {
            $order = wc_get_order($id);
            $request = $order ? (int) $order->get_meta('_rak_request_id') : 0;
            if (!$request || !is_user_logged_in() || (int) $order->get_customer_id() !== get_current_user_id()) return;
            $row = KitOrderRepository::get($request);
            if (!$row || (int) $row->order_id !== $id || (int) $row->owner_id !== get_current_user_id()) return;
            $snapshot = json_decode($row->snapshot, true) ?: [];
            echo '<section class="rak-order-next"><h2>Sua solicitação de retirada</h2><ul>';
            foreach ($snapshot['lines'] ?? [] as $line) {
                printf('<li><strong>%s</strong> · %s</li>', esc_html($line['race']), esc_html($line['participant']));
            }
            echo '</ul>';
            echo RequestQueue::paid($order)
                ? '<p>Consulte a situação dos documentos e a liberação do voucher em Meus pedidos.</p>'
                : '<p>Consulte a situação do pagamento e as opções disponíveis em Meus pedidos.</p>';
            printf('<a class="button" href="%s">Acompanhar pedido</a></section>',
                esc_url(PublicPages::url('/acompanhamento?pedido=' . $request)));
        });
        add_action('rest_api_init', static function (): void {
            $permission = [RequestDrafts::class, 'permission'];
            register_rest_route('re-almeida/v1', '/account/orders', [
                ['methods' => 'GET', 'permission_callback' => $permission, 'callback' => [self::class, 'history']],
                ['methods' => 'POST', 'permission_callback' => $permission, 'callback' => [self::class, 'submit']],
            ]);
        });
    }

    private static function product(?string &$issue = null): ?\WC_Product {
        $issue = 'Defina RAK_ENABLE_WOOCOMMERCE_REQUESTS como true após configurar o produto e o checkout.';
        if (!defined('RAK_ENABLE_WOOCOMMERCE_REQUESTS') || RAK_ENABLE_WOOCOMMERCE_REQUESTS !== true) return null;
        $issue = 'Ative o WooCommerce.';
        if (!function_exists('wc_get_product')) return null;
        $issue = 'A tabela de solicitações não está disponível. Confira a migração do plugin e as permissões do banco.';
        if (!KitOrderRepository::ready()) return null;
        $issue = 'Configure a moeda do WooCommerce como BRL.';
        if (get_woocommerce_currency() !== 'BRL') return null;
        $issue = 'Selecione uma página pública e publicada para o checkout e configure o endpoint de pagamento do pedido no WooCommerce.';
        $checkout = wc_get_page_id('checkout');
        $page = $checkout > 0 ? get_post($checkout) : null;
        if (!$page || $page->post_type !== 'page' || $page->post_status !== 'publish' || $page->post_password ||
            get_option('woocommerce_checkout_pay_endpoint', 'order-pay') === '') return null;
        $issue = 'Desative o modo Em breve da loja para permitir acesso dos clientes ao checkout.';
        if (get_option('woocommerce_coming_soon') === 'yes') return null;
        $issue = 'Defina RAK_WOOCOMMERCE_SERVICE_PRODUCT_ID com o ID de um produto simples, virtual, publicado e sem gestão de estoque.';
        $id = defined('RAK_WOOCOMMERCE_SERVICE_PRODUCT_ID') ? absint(RAK_WOOCOMMERCE_SERVICE_PRODUCT_ID) : 0;
        $product = $id > 0 ? wc_get_product($id) : false;
        if (!$product || !$product->is_type('simple') || !$product->is_virtual() ||
            $product->managing_stock() || $product->get_status() !== 'publish') return null;
        $issue = null;
        return $product;
    }

    public static function siteHealth(): array {
        $issue = 'Diagnóstico restrito à administração.';
        if (current_user_can('manage_options') && current_user_can('view_site_health_checks')) self::product($issue);
        return [
            'label' => $issue ? 'Checkout Re Almeida Kits precisa de configuração' : 'Checkout Re Almeida Kits pronto para criar pedidos',
            'status' => $issue ? 'critical' : 'good',
            'badge' => ['label' => 'Re Almeida Kits', 'color' => 'blue'],
            'description' => '<p>' . esc_html($issue ?? 'Homologue o pagamento nativo com os meios configurados em ambiente de teste.') . '</p>',
            'actions' => '',
            'test' => 'rak_checkout',
        ];
    }

    public static function submit(\WP_REST_Request $request) {
        if (strlen($request->get_body()) > 2048) return Identity::error('Dados excedem o limite permitido.', 413);
        $version = $request->get_json_params()['version'] ?? null;
        $expected = $request->get_json_params()['expectedCents'] ?? null;
        if (!is_int($version) || !is_int($expected)) return Identity::error('Informe a versão salva e o valor exibido.');
        $owner = NativeSession::user($request);
        return Accounts::locked('draft_' . $owner, static function () use ($version, $expected, $owner) {
            $current = RequestDrafts::load($owner);
            if (empty($current['key'])) return Identity::error('Salve o rascunho antes de finalizar.', 409);
            if (!KitOrderRepository::ready() || !function_exists('wc_get_order')) {
                return Identity::error('O checkout do serviço ainda não foi habilitado neste ambiente.', 503);
            }
            $existing = KitOrderRepository::find($owner, $current['key']);
            if (!$existing) $existing = KitOrderRepository::get((int) get_user_meta($owner, '_rak_draft_order_' . $current['key'], true));
            if ($existing) return self::resume($owner, $existing);
            if ($current['version'] !== $version || !$current['draft']) return Identity::error('O rascunho mudou. Confira a versão salva.', 409);
            $product = self::product();
            if (!$product) return Identity::error('O checkout do serviço ainda não foi habilitado neste ambiente.', 503);

            $quote = CheckoutInput::validate($owner, json_decode(wp_json_encode($current['draft']), true));
            if (is_wp_error($quote)) return $quote;
            if ($quote['total'] !== $expected) return Identity::error('O preço mudou. Recarregue para conferir o valor atualizado.', 409);
            return RaceRegistrations::locked(static function () use ($quote, $owner, $current, $product) {
                $conflicts = RaceRegistrations::conflicts($quote['lines'], true);
                if ($conflicts) return Identity::error(sprintf('%s já possui pagamento confirmado e válido para %s.',
                    $conflicts[0]['participant'], $conflicts[0]['race']), 409);
                $pending = RequestFinance::pending($owner, $quote);
                if ($pending) {
                    update_user_meta($owner, '_rak_draft_order_' . $current['key'], (int) $pending->id);
                    return self::resume($owner, $pending);
                }
                return self::create($owner, $current['key'], $product, $quote);
            });
        });
    }

    private static function create(int $owner, string $key, \WC_Product $product, array $quote) {
        $quote['acceptedAt'] = gmdate('c');
        $id = KitOrderRepository::reserve($owner, $key, $quote);
        if (!$id) return Identity::error('Não foi possível reservar a solicitação.', 503);
        try {
            $order = new \WC_Order();
            $order->set_created_via('re-almeida-kits');
            $order->set_customer_id($owner);
            $order->set_currency('BRL');
            $customer = new \WC_Customer($owner);
            $order->set_address($customer->get_billing(), 'billing');
            $names = preg_split('/\s+/', $quote['responsible']['name'], 2);
            $order->set_billing_first_name($names[0]);
            $order->set_billing_last_name($names[1] ?? '');
            $order->set_billing_email($quote['responsible']['email']);
            $order->set_billing_phone($quote['responsible']['phone']);
            $order->add_meta_data('_rak_request_id', $id, true);
            foreach ($quote['lines'] as $line) {
                $amount = sprintf('%d.%02d', intdiv($line['cents'], 100), $line['cents'] % 100);
                $item = new \WC_Order_Item_Product();
                $item->set_product($product);
                $item->set_name($line['race'] . ' · serviço de retirada');
                $item->set_quantity(1);
                $item->set_subtotal($amount);
                $item->set_total($amount);
                $item->add_meta_data('_rak_participant_id', $line['participantId'], true);
                $item->add_meta_data('_rak_race_id', $line['raceId'], true);
                $item->add_meta_data('_rak_modality', $line['modality'], true);
                if ($line['registration'] !== '') $item->add_meta_data('_rak_registration', $line['registration'], true);
                foreach (['kitType', 'size', 'pickup', 'baseCents', 'additionalCents'] as $field) {
                    if (($line[$field] ?? null) !== null && $line[$field] !== '') $item->add_meta_data('_rak_' . $field, $line[$field], true);
                }
                $order->add_item($item);
            }
            $order->calculate_totals();
            $total = (string) $order->get_subtotal();
            $actual = preg_match('/^(\d+)(?:\.(\d{1,2}))?$/D', $total, $parts)
                ? (int) $parts[1] * 100 + (int) str_pad($parts[2] ?? '', 2, '0') : null;
            if ($actual !== $quote['total'] || !$order->get_id() || !KitOrderRepository::attach($id, $order->get_id())) {
                NotificationQueue::alert('order-create:' . $id, 'Solicitação ' . $id . ' exige conciliação do vínculo WooCommerce. Não recriar ou cobrar sem conferir.', $id);
                return Identity::error('O pedido aguarda conferência. Nenhum novo pedido será criado em outra tentativa.', 409);
            }
            return self::result($order, $id);
        } catch (\Throwable) {
            NotificationQueue::alert('order-create:' . $id, 'Solicitação ' . $id . ' interrompida durante a criação do pedido. Conferir o WooCommerce antes de nova cobrança.', $id);
            // A reserved request is never retried blindly after an uncertain WooCommerce write.
            return Identity::error('O pedido aguarda conferência. Nenhum novo pedido será criado em outra tentativa.', 409);
        }
    }

    private static function resume(int $owner, object $row) {
        $order = $row->order_id ? wc_get_order((int) $row->order_id) : null;
        if (!$order || $order->get_customer_id() !== $owner) {
            return Identity::error('O pedido aguarda conferência. Consulte o atendimento.', 409);
        }
        return self::result($order, (int) $row->id);
    }

    private static function result(\WC_Order $order, int $requestId): array {
        $row = KitOrderRepository::get($requestId);
        $payable = $row && RequestFinance::payable($row, $order);
        return [
            'id' => $requestId,
            'number' => $order->get_order_number(),
            'checkoutUrl' => $payable ? $order->get_checkout_payment_url() : null,
            'paymentNotice' => !$payable && !RequestQueue::paid($order) ? 'Este pedido não está disponível para retomar pagamento. O histórico foi preservado. Para corridas abertas, inicie uma nova solicitação; se houve pagamento, procure atendimento para conferência.' : null,
        ];
    }

    public static function history(\WP_REST_Request $request): array {
        $owner = NativeSession::user($request);
        if (!KitOrderRepository::ready() || !function_exists('wc_get_order')) return ['enabled' => false, 'orders' => []];
        $orders = [];
        foreach (KitOrderRepository::rows($owner, absint($request['before'])) as $row) {
            $snapshot = json_decode($row->snapshot, true);
            $order = $row->order_id ? wc_get_order((int) $row->order_id) : null;
            if (!$order || $order->get_customer_id() !== $owner) {
                $orders[] = [
                    'id' => (int) $row->id, 'number' => null, 'checkoutUrl' => null,
                    'createdAt' => $row->created_at, 'total' => ($snapshot['total'] ?? 0) / 100,
                    'currency' => 'BRL', 'paymentStatus' => 'unavailable', 'paid' => false,
                    'refunded' => 0, 'lines' => self::historyLines($row, $snapshot ?: [], false),
                ];
                continue;
            }
            $orders[] = self::result($order, (int) $row->id) + [
                'createdAt' => $row->created_at,
                'total' => $order->get_total(),
                'currency' => $order->get_currency(),
                'paymentStatus' => $order->get_status(),
                'paid' => RequestQueue::paid($order),
                'refunded' => $order->get_total_refunded(),
                'lines' => self::historyLines($row, $snapshot ?: [], RequestQueue::paid($order)),
            ];
        }
        return ['enabled' => self::product() !== null, 'orders' => $orders];
    }

    private static function historyLines(object $row, array $snapshot, bool $editable): array {
        Vouchers::sync($row);
        $lines = RequestOperations::lines($row, $snapshot);
        return array_map(static fn(array $line, int $index) =>
            OrderDocuments::describe((int) $row->owner_id, $snapshot, $line, $index, $editable) +
                ['voucher' => Vouchers::describe(VoucherRepository::get((int) $row->id, $index))],
            $lines, array_keys($lines));
    }
}
