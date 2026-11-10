<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class RequestQueue {
    public static function paid($order): bool {
        return $order && $order->has_status(['processing', 'completed']) && $order->is_paid() &&
            $order->get_date_paid() && (float) $order->get_total_refunded() === 0.0;
    }

    public static function order(object $row) {
        return $row->order_id && function_exists('wc_get_order') ? wc_get_order((int) $row->order_id) : false;
    }

    public static function item(array $snapshot, array $line): array {
        foreach ($snapshot['draft']['participants'] ?? [] as $person) {
            if ((int) ($person['directoryId'] ?? 0) !== (int) $line['participantId']) continue;
            foreach ($person['items'] as $item) {
                if ((string) $item['raceId'] === (string) $line['raceId']) {
                    $item['documents'] = array_replace($item['documents'] ?? [], $line['replacementDocuments'] ?? []);
                    return [$person['person'] ?? [], $item];
                }
            }
        }
        return [[], []];
    }

    public static function documents(array $item, array $line = []): array {
        if (isset($line['documentRequirements']) && is_array($line['documentRequirements'])) {
            return array_column(array_filter($line['documentRequirements'], static fn($doc) => $doc['requiresUpload'] !== false), null, 'id');
        }
        $post = get_post((int) ($item['raceId'] ?? 0));
        $race = $post && $post->post_type === 'corrida' ? Rest::project($post) : [];
        $requirements = [];
        foreach ($race['modalities'] ?? [] as $mode) {
            if ($mode['id'] === ($item['modality'] ?? '') && is_array($mode['documents'])) {
                foreach ($mode['documents'] as $document) {
                    if ($document['requiresUpload'] !== false && $document['id'] !== PersonalDocuments::ID) $requirements[$document['id']] = $document;
                }
            }
        }
        return $requirements;
    }

    public static function filters(array $input): array {
        $result = [];
        foreach (['q', 'race', 'modality', 'documents', 'pickup'] as $key) {
            $result[$key] = is_string($input[$key] ?? null) ? sanitize_text_field(wp_unslash($input[$key])) : '';
        }
        return $result;
    }

    public static function matches(array $entry, array $filters): bool {
        $line = $entry['line'];
        foreach (['race' => 'raceId', 'modality' => 'modality', 'documents' => 'documentStatus', 'pickup' => 'pickupStatus'] as $filter => $field) {
            if ($filters[$filter] !== '' && $filters[$filter] !== (string) $line[$field]) return false;
        }
        $query = $filters['q'];
        if ($query === '') return true;
        $text = implode(' ', [$line['participant'], $entry['holder'], $entry['registration'], $entry['cpf'], $entry['item']['membership'] ?? '']);
        $digits = preg_replace('/\D/', '', $query);
        return str_contains(strtolower(remove_accents($text)), strtolower(remove_accents($query))) ||
            ($digits !== '' && preg_match('/^[\d.\s-]+$/D', $query) && str_contains($entry['cpf'], $digits));
    }

    public static function entries(array $filters, bool $exceptions = false): \Generator {
        if (!function_exists('wc_get_orders')) return;
        global $wpdb;
        $table = Accounts::table('requests');
        $before = PHP_INT_MAX;
        do {
            $rows = $wpdb->get_results($wpdb->prepare("SELECT * FROM $table WHERE id<%d AND order_id IS NOT NULL ORDER BY id DESC LIMIT 100", $before));
            if (!$rows) break;
            $before = (int) end($rows)->id;
            $orders = wc_get_orders(['include' => array_map('intval', array_column($rows, 'order_id')), 'limit' => count($rows)]);
            $orders = array_combine(array_map(static fn($order) => $order->get_id(), $orders), $orders);
            update_meta_cache('user', array_unique(array_map('intval', array_column($rows, 'owner_id'))));
            foreach ($rows as $row) {
                $order = $orders[(int) $row->order_id] ?? null;
                if (!$order || (int) $order->get_customer_id() !== (int) $row->owner_id) continue;
                $paid = self::paid($order);
                if (!$paid && (!$exceptions || (!$order->get_date_paid() && !$order->get_total_refunded()))) continue;
                if ($paid && $exceptions) continue;
                $snapshot = json_decode($row->snapshot, true) ?: [];
                $operations = RequestOperations::read($row);
                foreach ($snapshot['lines'] ?? [] as $index => $original) {
                    $line = array_replace($original, $operations['lines'][$index] ?? []);
                    [$person, $item] = self::item($snapshot, $line);
                    $holder = $snapshot['responsible']['name'] ?? '';
                    $registration = $item['registration'] ?? $line['registration'] ?? '';
                    $entry = ['row' => $row, 'index' => $index, 'line' => $line, 'holder' => $holder, 'item' => $item,
                        'cpf' => $person['cpf'] ?? '', 'registration' => $registration, 'version' => $operations['version'], 'order' => $order];
                    if (self::matches($entry, $filters)) yield $entry;
                }
            }
        } while (count($rows) === 100);
    }
}
