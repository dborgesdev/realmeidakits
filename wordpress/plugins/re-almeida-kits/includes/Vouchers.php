<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class Vouchers {
    public const CAPABILITY = 'confirm_rak_pickups';
    public const STATES = ['blocked' => 'Bloqueado', 'released' => 'Liberado', 'used' => 'Utilizado', 'invalidated' => 'Invalidado'];

    public static function boot(): void {
        add_action('woocommerce_order_status_changed', [self::class, 'orderChanged'], 30, 1);
        add_action('woocommerce_payment_complete', [self::class, 'orderChanged'], 30, 1);
        add_action('woocommerce_order_refunded', [self::class, 'orderChanged'], 30, 1);
        add_action('rak_reconcile_vouchers', [self::class, 'reconcile']);
        add_action('init', static function (): void {
            if (!wp_next_scheduled('rak_reconcile_vouchers')) wp_schedule_event(time() + 60, 'hourly', 'rak_reconcile_vouchers');
        }, 30);
    }

    public static function orderChanged(int $id): void {
        global $wpdb;
        if ((int) get_option('rak_schema_version') < 5) return;
        $table = Accounts::table('requests');
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE order_id=%d", $id));
        if ($row) self::sync($row);
    }

    public static function reconcile(): void {
        global $wpdb;
        if ((int) get_option('rak_schema_version') < 5) return;
        $cursor = (int) get_option('rak_voucher_cursor', 0);
        $table = Accounts::table('requests');
        $rows = $wpdb->get_results($wpdb->prepare("SELECT * FROM $table WHERE id>%d AND order_id IS NOT NULL ORDER BY id LIMIT 50", $cursor));
        foreach ($rows as $row) self::sync($row);
        update_option('rak_voucher_cursor', count($rows) === 50 ? (int) end($rows)->id : 0, false);
        if (count($rows) === 50 && !wp_next_scheduled('rak_reconcile_vouchers_batch')) {
            wp_schedule_single_event(time() + 30, 'rak_reconcile_vouchers_batch');
        }
    }

    public static function documentsApproved(array $snapshot, array $line): bool {
        [, $item] = RequestQueue::item($snapshot, $line);
        if (!$item) return false;
        $required = array_filter(RequestQueue::documents($item, $line), static fn($doc) => $doc['required']);
        if (!$required && empty($item['documents'])) return in_array($line['documentStatus'] ?? '', ['not_required', 'approved'], true);
        if (($line['documentStatus'] ?? '') !== 'approved') return false;
        foreach (array_unique(array_merge(array_keys($required), array_keys($item['documents'] ?? []))) as $id) {
            $token = $item['documents'][$id] ?? '';
            $review = $line['reviews'][$id] ?? [];
            if (!$token || ($review['status'] ?? '') !== 'approved' || ($review['token'] ?? '') !== $token) return false;
        }
        return true;
    }

    public static function decision($order, array $snapshot, array $line, string $previous): array {
        $paid = RequestQueue::paid($order);
        $invalid = !$order || $order->has_status(['cancelled', 'refunded', 'failed', 'trash']) || (float) $order->get_total_refunded() > 0 || $order->get_meta('_rak_payment_conflict');
        $documents = self::documentsApproved($snapshot, $line);
        if ($previous === 'used') return ['used', (!$paid || !$documents || $invalid) ? 'Retirada concluída; alteração posterior exige conferência administrativa.' : 'Retirada concluída.'];
        if ($order && $order->get_meta('_rak_payment_conflict')) return ['invalidated','Pagamento concorrente exige conciliação administrativa no WooCommerce.'];
        if ($invalid) return ['invalidated', 'Pedido cancelado, estornado ou indisponível.'];
        if (!$paid) return [$previous === 'released' || $previous === 'invalidated' ? 'invalidated' : 'blocked', 'Aguardando confirmação efetiva do pagamento.'];
        if (!$documents) return ['blocked', 'Aguardando aprovação de todos os documentos obrigatórios.'];
        return ['released', 'Pagamento e documentação regulares.'];
    }

    // Call within the existing request lock when modifying documentation.
    public static function syncLocked(object $row): array {
        if ((int) get_option('rak_schema_version') < 5) return [];
        $snapshot = json_decode($row->snapshot, true) ?: [];
        $order = RequestQueue::order($row);
        if ($order && (int) $order->get_customer_id() !== (int) $row->owner_id) $order = false;
        RequestFinance::resolved($row,$order);
        $result = [];
        foreach (RequestOperations::lines($row, $snapshot) as $index => $line) {
            $voucher = VoucherRepository::get((int) $row->id, $index) ?? VoucherRepository::create($row, $line, $index);
            if (!$voucher) { NotificationQueue::alert('voucher:' . $row->id . ':' . $index, 'Falha na emissão de voucher. Conferir banco e migração.', (int) $row->id); continue; }
            if (!$voucher->released_at && $voucher->state === 'blocked' && ($line['pickupStatus'] ?? '') === 'collected') {
                VoucherRepository::transition($voucher, 'used', 'Retirada registrada antes da implantação dos vouchers; consulte o histórico operacional.');
                $voucher = VoucherRepository::get((int) $row->id, $index);
            }
            [$state, $reason] = self::decision($order, $snapshot, $line, $voucher->state);
            if ($state !== $voucher->state || $reason !== $voucher->reason) {
                if (!VoucherRepository::transition($voucher, $state, $reason)) continue;
                $voucher = VoucherRepository::get((int) $row->id, $index);
            }
            if ($voucher->released_at && $voucher->mail_state === 'pending') VoucherMail::schedule((int) $voucher->id);
            $result[$index] = $voucher;
        }
        return $result;
    }

    public static function sync(object $row) {
        return Accounts::locked('request_ops_' . $row->id, static fn() => self::syncLocked($row));
    }

    public static function describe(?object $voucher): array {
        return $voucher ? ['state' => $voucher->state, 'label' => self::STATES[$voucher->state], 'reason' => $voucher->reason,
            'collectedAt' => $voucher->collected_at ? $voucher->collected_at . 'Z' : null,
            'pdfUrl' => $voucher->state === 'released' ? html_entity_decode(wp_nonce_url(add_query_arg([
                'action' => 'rak_voucher_pdf', 'request' => $voucher->request_id, 'line' => $voucher->line_index,
            ], admin_url('admin-post.php')), 'rak_voucher_pdf_' . $voucher->request_id . '_' . $voucher->line_index), ENT_QUOTES, 'UTF-8') : null]
            : ['state' => 'blocked', 'label' => 'Bloqueado', 'reason' => 'Voucher aguardando processamento.', 'pdfUrl' => null];
    }

    public static function confirm(object $voucher) {
        if (!current_user_can(self::CAPABILITY)) return Identity::error('Acesso restrito à conferência.', 403);
        return Accounts::locked('request_ops_' . $voucher->request_id, static function () use ($voucher) {
            $row = KitOrderRepository::get((int) $voucher->request_id);
            if (!$row) return Identity::error('Voucher não encontrado.', 404);
            self::syncLocked($row);
            $current = VoucherRepository::get((int) $row->id, (int) $voucher->line_index);
            if (!$current || $current->state !== 'released') return Identity::error('Retirada não autorizada. Consulte novamente a situação.', 409);
            if (!VoucherRepository::transition($current, 'used', 'Retirada concluída.', true)) return Identity::error('Outra operação alterou este voucher. Consulte novamente.', 409);
            return VoucherRepository::get((int) $row->id, (int) $voucher->line_index);
        });
    }
}
