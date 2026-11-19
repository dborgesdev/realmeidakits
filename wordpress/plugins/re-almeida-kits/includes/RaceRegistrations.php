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

    /** Caller holds the checkout lock. Unpaid attempts are never cancelled by this lookup. */
    public static function conflicts(array $lines, bool $expire, int $exclude = 0): array {
        if (!$lines || !KitOrderRepository::ready() || !function_exists('wc_get_order')) return [];
        global $wpdb;
        $table = Accounts::table('requests');
        $lines = array_values(array_filter($lines, static fn($line) => !empty($line['cpf']) && !empty($line['raceId'])));
        if (!$lines) return [];
        $pairs = [];
        foreach ($lines as $line) $pairs[$line['cpf'] . ':' . $line['raceId']] = $line;
        $cpfs = array_unique(array_column($lines, 'cpf'));
        $before = PHP_INT_MAX;
        $blocked = [];
        $clauses = implode(' OR ', array_fill(0, count($cpfs), 'snapshot LIKE %s'));
        $values = array_map(static fn($cpf) => '%' . $wpdb->esc_like('"' . $cpf . '"') . '%', $cpfs);
        do {
            $rows = $wpdb->get_results($wpdb->prepare("SELECT * FROM $table WHERE id<%d AND ($clauses) ORDER BY id DESC LIMIT 100", $before, ...$values));
            foreach ($rows as $row) {
                $before = (int) $row->id;
                if ((int) $row->id === $exclude) continue;
                $snapshot = json_decode($row->snapshot, true) ?: [];
                $matches = [];
                foreach ($snapshot['lines'] ?? [] as $old) {
                    [$person] = RequestQueue::item($snapshot, $old);
                    $key = ($old['cpf'] ?? $person['cpf'] ?? '') . ':' . $old['raceId'];
                    if (isset($pairs[$key])) $matches[$key] = $pairs[$key];
                }
                if (!$matches) continue;
                $order = $row->order_id ? wc_get_order((int) $row->order_id) : null;
                if (!$order || (int) $order->get_customer_id() !== (int) $row->owner_id) continue;
                if (RequestQueue::paid($order)) $blocked += $matches;
            }
        } while (count($rows) === 100 && count($blocked) < count($pairs));
        return array_values($blocked);
    }
}
