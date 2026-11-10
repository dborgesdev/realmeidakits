<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class RaceRegistrations {
    public static function locked(callable $action) {
        global $wpdb;
        if ($wpdb instanceof \WP_SQLite_DB) return Accounts::locked('race_registration_checkout', $action);
        $key = 'rak_checkout_' . substr(hash('sha256', DB_NAME . ':' . $wpdb->prefix), 0, 40);
        if ((int) $wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 3)', $key)) !== 1) {
            return Identity::error('Há outra finalização em andamento. Tente novamente em instantes.', 409);
        }
        try {
            return $action();
        } finally {
            $wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)', $key));
        }
    }

    public static function boot(): void {
        add_action('rest_api_init', static function (): void {
            register_rest_route('re-almeida/v1', '/account/draft/registration-conflicts', [
                'methods' => 'POST', 'permission_callback' => [RequestDrafts::class, 'permission'],
                'callback' => [self::class, 'availability'],
            ]);
        });
    }

    public static function availability(\WP_REST_Request $request) {
        $owner = NativeSession::user($request);
        if (!AccountAuth::throttle('race-availability-' . $owner, 45, 900)) {
            return Identity::error('Aguarde antes de consultar novamente.', 429);
        }
        $draft = RequestDrafts::load($owner);
        $directory = array_column(Accounts::participants($owner), null, 'id');
        $slots = [];
        foreach ($draft['draft']->participants ?? [] as $person) {
            $saved = $directory[$person->directoryId ?? 0] ?? null;
            if (!$saved || $saved['version'] !== ($person->directoryVersion ?? 0) ||
                $saved['person']['cpf'] !== ($person->person->cpf ?? '')) continue;
            foreach ($person->items as $item) $slots[] = ['cpf' => $saved['person']['cpf'], 'raceId' => $item->raceId, 'slot' => $person->id];
        }
        $blocked = self::conflicts($slots, false);
        return ['conflicts' => array_values(array_map(static fn($line) => ['slot' => $line['slot'], 'raceId' => $line['raceId']], $blocked))];
    }

    /** Caller holds the global reservation lock while expiring old unpaid orders and creating the next order. */
    public static function conflicts(array $lines, bool $expire): array {
        if (!$lines || !KitOrderRepository::ready() || !function_exists('wc_get_order')) return [];
        global $wpdb;
        $table = Accounts::table('requests');
        $pairs = [];
        foreach ($lines as $line) $pairs[$line['cpf'] . ':' . $line['raceId']] = $line;
        $cpfs = array_unique(array_column($lines, 'cpf'));
        $before = PHP_INT_MAX;
        $blocked = [];
        $expiry = max(1, (int) (get_option('woocommerce_hold_stock_minutes', 60) ?: 60)) * MINUTE_IN_SECONDS;
        $clauses = implode(' OR ', array_fill(0, count($cpfs), 'snapshot LIKE %s'));
        $values = array_map(static fn($cpf) => '%' . $wpdb->esc_like('"' . $cpf . '"') . '%', $cpfs);
        do {
            $rows = $wpdb->get_results($wpdb->prepare("SELECT * FROM $table WHERE id<%d AND ($clauses) ORDER BY id DESC LIMIT 100", $before, ...$values));
            foreach ($rows as $row) {
                $before = (int) $row->id;
                $snapshot = json_decode($row->snapshot, true) ?: [];
                $matches = [];
                foreach ($snapshot['lines'] ?? [] as $old) {
                    [$person] = RequestQueue::item($snapshot, $old);
                    $key = ($old['cpf'] ?? $person['cpf'] ?? '') . ':' . $old['raceId'];
                    if (isset($pairs[$key])) $matches[$key] = $pairs[$key];
                }
                if (!$matches) continue;
                $order = $row->order_id ? wc_get_order((int) $row->order_id) : null;
                if (!$order && !$row->order_id) {
                    // An interrupted WooCommerce write must be reconciled before these participants can be reserved again.
                    $blocked += $matches;
                    continue;
                }
                if (!$order || (int) $order->get_customer_id() !== (int) $row->owner_id) continue;
                if ($order->is_paid() || $order->get_date_paid() && !$order->has_status(['cancelled', 'failed', 'refunded']) ||
                    $order->has_status('on-hold')) {
                    $blocked += $matches;
                } elseif ($order->has_status('pending')) {
                    $created = $order->get_date_created();
                    if (!$created || $created->getTimestamp() + $expiry > time()) {
                        $blocked += $matches;
                    } elseif ($expire) {
                        try {
                            if (!$order->update_status('cancelled', 'Prazo de pagamento expirado.')) $blocked += $matches;
                        } catch (\Throwable) {
                            $blocked += $matches;
                        }
                    }
                }
            }
        } while (count($rows) === 100 && count($blocked) < count($pairs));
        return array_values($blocked);
    }
}
