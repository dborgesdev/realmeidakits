<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class RequestFinance {
    public static function boot(): void {
        add_action('admin_post_rak_external_payment', [self::class, 'submit']);
        add_action('woocommerce_before_pay_action', static function ($order): void {
            if (!$order instanceof \WC_Order || !$order->get_meta('_rak_request_id')) return;
            $row = KitOrderRepository::get((int) $order->get_meta('_rak_request_id'));
            if (!$row) return;
            if ((int)$row->owner_id !== (int)$order->get_customer_id()) throw new \Exception('Pedido aguardando conferência do titular. Procure atendimento.');
            if (!self::payable($row, $order)) throw new \Exception('Este pedido não pode ser retomado. Consulte Meus pedidos ou solicite atendimento.');
            $result = RaceRegistrations::locked(static function () use ($row) {
                $snapshot = json_decode($row->snapshot, true) ?: [];
                return RaceRegistrations::conflicts(self::registrationLines($snapshot), false) ? Identity::error('Já existe pagamento confirmado para este participante e corrida.', 409) : true;
            });
            if (is_wp_error($result)) throw new \Exception($result->get_error_message());
        });
        add_action('woocommerce_payment_complete', [self::class, 'reconcile'], 40);
        add_action('woocommerce_order_status_changed', [self::class, 'reconcile'], 40);
    }
    public static function open(array $line): bool {
        $post = get_post((int) $line['raceId']);
        return $post && $post->post_type === 'corrida' && $post->post_status === 'publish' && !$post->post_password && Rest::project($post)['status'] === 'open';
    }
    public static function payable(object $row, $order): bool {
        if (!$order || !$order->needs_payment() || $order->get_date_paid() || (float) $order->get_total_refunded() > 0) return false;
        foreach ((json_decode($row->snapshot, true)['lines'] ?? []) as $line) if (!self::open($line)) return false;
        return true;
    }
    public static function pending(int $owner, array $quote): ?object {
        $identity = static function (array $lines): string {
            $keys = array_map(static fn($line) => ($line['cpf'] ?? '') . ':' . $line['raceId'], $lines); sort($keys);
            return implode('|', $keys);
        };
        $normalized = static fn($value) => json_decode(wp_json_encode($value), true);
        // Reuse the SAME payable attempt for the same people/races. Its snapshot remains authoritative.
        $before = 0;
        do {
            $rows = KitOrderRepository::rows($owner, $before);
            foreach ($rows as $row) {
                $snapshot = json_decode($row->snapshot, true) ?: [];
                if ($identity($snapshot['lines'] ?? []) === $identity($quote['lines']) && $normalized($snapshot['lines']) === $normalized($quote['lines']) && $normalized($snapshot['draft']['participants'] ?? []) === $normalized($quote['draft']['participants'] ?? []) && $normalized($snapshot['draft']['acceptedConditions'] ?? []) === $normalized($quote['draft']['acceptedConditions'] ?? []) && self::payable($row, RequestQueue::order($row))) return $row;
            }
            $before = $rows ? (int) end($rows)->id : 0;
        } while (count($rows) === 20);
        return null;
    }
    private static function registrationLines(array $snapshot): array {
        return array_map(static function (array $line) use ($snapshot): array {
            [$person] = RequestQueue::item($snapshot, $line);
            $line['cpf'] = $line['cpf'] ?? $person['cpf'] ?? '';
            return $line;
        }, $snapshot['lines'] ?? []);
    }
    public static function reconcile(int $orderId): void {
        $order = wc_get_order($orderId);
        if (!$order || !$order->get_meta('_rak_request_id')) return;
        if ($order->has_status(['processing','completed']) && !$order->get_date_paid()) NotificationQueue::alert('payment-date:' . $orderId, 'Pedido ' . $order->get_order_number() . ' tem status financeiro sem data efetiva de pagamento. Conferir no WooCommerce.', (int) $order->get_meta('_rak_request_id'));
        if (!RequestQueue::paid($order)) return;
        $row = KitOrderRepository::get((int) $order->get_meta('_rak_request_id'));
        if (!$row) return;
        $snapshot = json_decode($row->snapshot, true) ?: [];
        $conflicts = RaceRegistrations::conflicts(self::registrationLines($snapshot), false, (int) $row->id);
        if ($conflicts && !$order->get_meta('_rak_payment_conflict')) {
            $order->update_meta_data('_rak_payment_conflict', gmdate('c')); $order->save();
            $order->add_order_note('Conflito com outro pagamento confirmado para participante/corrida. Não estornar automaticamente: conciliar com o gateway.');
            NotificationQueue::alert('payment-conflict:' . $orderId, 'Pedido ' . $order->get_order_number() . ' apresenta pagamento concorrente e exige conciliação.', (int) $row->id);
            Vouchers::sync($row);
        }
    }
    public static function resolved(object $row, $order): void {
        if (!$order || !$order->get_meta('_rak_payment_conflict') || !RequestQueue::paid($order)) return;
        $snapshot=json_decode($row->snapshot,true) ?: [];
        if (!RaceRegistrations::conflicts(self::registrationLines($snapshot),false,(int)$row->id)) {
            $order->delete_meta_data('_rak_payment_conflict');$order->save();
            $order->add_order_note('Conflito operacional encerrado após revalidar os pagamentos WooCommerce: não há outro pagamento válido para os mesmos participantes/corridas.');
        }
    }
    public static function regularize(int $request, string $amount, string $method, string $reference, bool $confirmed) {
        if (!current_user_can('manage_woocommerce') || !current_user_can(RequestOperations::CAPABILITY)) return Identity::error('Acesso financeiro restrito.', 403);
        if (!$confirmed || !preg_match('/^\d+(?:[.,]\d{1,2})?$/D', $amount) || trim($method) === '' || trim($reference) === '') return Identity::error('Confirme o recebimento e informe valor, método e referência/observação.');
        return RaceRegistrations::locked(static fn() => Accounts::locked('request_ops_' . $request, static function () use ($request, $amount, $method, $reference) {
            $row = KitOrderRepository::get($request); $order = $row ? RequestQueue::order($row) : null;
            if (!$order || (int)$order->get_customer_id() !== (int)$row->owner_id || $order->is_paid() || $order->get_date_paid() || (float) $order->get_total_refunded() > 0 || !$order->has_status(['pending', 'on-hold', 'failed'])) return Identity::error('Pedido não habilitado para regularização externa.', 409);
            if (wc_format_decimal(str_replace(',', '.', $amount), 2) !== wc_format_decimal($order->get_total(), 2)) return Identity::error('O valor recebido deve corresponder ao total integral do pedido.');
            $snapshot = json_decode($row->snapshot, true) ?: [];
            if (RaceRegistrations::conflicts(self::registrationLines($snapshot), false, $request)) return Identity::error('Já existe pagamento válido para participante/corrida. Concilie antes de regularizar.', 409);
            $event = ['id' => wp_generate_uuid4(), 'actor' => get_current_user_id(), 'at' => gmdate('c'), 'amount' => wc_format_decimal(str_replace(',', '.', $amount), 2), 'method' => sanitize_text_field($method), 'reference' => sanitize_text_field($reference)];
            $order->add_meta_data('_rak_external_receipt', $event);
            $order->set_payment_method('rak_external'); $order->set_payment_method_title($event['method']); $order->save();
            $order->add_order_note('Recebimento externo confirmado explicitamente: ' . wp_json_encode($event, JSON_UNESCAPED_UNICODE));
            $order->payment_complete(mb_substr($event['reference'], 0, 100));
            if (!RequestQueue::paid(wc_get_order($order->get_id()))) {
                NotificationQueue::alert('external:' . $request, 'A regularização externa do pedido ' . $order->get_order_number() . ' não confirmou o estado financeiro. Conferir a auditoria.', $request);
                return Identity::error('O WooCommerce não confirmou o recebimento. Confira o histórico antes de tentar novamente.', 409);
            }
            Vouchers::syncLocked($row);
            return true;
        }));
    }
    public static function submit(): void {
        $id = absint($_POST['request'] ?? 0); check_admin_referer('rak_external_payment_' . $id);
        $value = static fn($key) => is_string($_POST[$key] ?? null) ? mb_substr(sanitize_text_field(wp_unslash($_POST[$key])), 0, 500) : '';
        $result = self::regularize($id, $value('amount'), $value('method'), $value('reference'), ($_POST['received'] ?? '') === 'yes');
        if (is_wp_error($result)) wp_die(esc_html($result->get_error_message()), '', ['response' => $result->get_error_data()['status']]);
        wp_safe_redirect(admin_url('edit.php?post_type=corrida&page=rak-requests&view=exceptions')); exit;
    }
    public static function form(object $row, $order): void {
        if (!current_user_can('manage_woocommerce') || !current_user_can(RequestOperations::CAPABILITY) || !$order || $order->get_date_paid() || !$order->has_status(['pending', 'on-hold', 'failed'])) return;
        printf('<form method="post" action="%s" data-rak-confirm="Confirmar recebimento externo integral deste pedido? Confira o comprovante antes de prosseguir."><h3>Regularização financeira externa</h3><input type="hidden" name="action" value="rak_external_payment"><input type="hidden" name="request" value="%d">', esc_url(admin_url('admin-post.php')), $row->id);
        wp_nonce_field('rak_external_payment_' . $row->id);
        printf('<label>Valor recebido (BRL)<input name="amount" inputmode="decimal" required value="%s"></label>', esc_attr($order->get_total()));
        echo '<label>Método recebido<input name="method" required maxlength="80"></label><label>Referência ou observação<input name="reference" required maxlength="500"></label><label><input type="checkbox" name="received" value="yes" required> Confirmo que o recebimento integral foi conferido.</label><button class="button">Registrar recebimento no WooCommerce</button></form>';
    }
}
