<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class KitOrderRepository {
    public static function install(): bool {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = Accounts::table('requests');
        $collate = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE $table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            owner_id bigint(20) unsigned NOT NULL,
            draft_key varchar(36) NOT NULL,
            order_id bigint(20) unsigned DEFAULT NULL,
            created_at datetime NOT NULL,
            snapshot longtext NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY owner_draft (owner_id,draft_key),
            UNIQUE KEY order_id (order_id)
        ) $collate;");
        return $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))) === $table;
    }

    public static function ready(): bool {
        return (int) get_option('rak_schema_version', 0) >= 4;
    }

    public static function find(int $owner, string $key) {
        global $wpdb;
        $table = Accounts::table('requests');
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE owner_id=%d AND draft_key=%s", $owner, $key));
    }

    public static function unresolved(int $owner): bool {
        global $wpdb;
        $table = Accounts::table('requests');
        return (bool) $wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE owner_id=%d AND order_id IS NULL LIMIT 1", $owner));
    }

    public static function reserve(int $owner, string $key, array $snapshot): int {
        global $wpdb;
        $data = wp_json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($data === false) return 0;
        $written = $wpdb->insert(Accounts::table('requests'), [
            'owner_id' => $owner, 'draft_key' => $key, 'created_at' => current_time('mysql', true), 'snapshot' => $data,
        ]);
        return $written ? (int) $wpdb->insert_id : 0;
    }

    public static function attach(int $requestId, int $orderId): bool {
        global $wpdb;
        return $wpdb->update(Accounts::table('requests'), ['order_id' => $orderId], ['id' => $requestId, 'order_id' => null]) === 1;
    }

    public static function rows(int $owner, int $before = 0): array {
        global $wpdb;
        $table = Accounts::table('requests');
        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE owner_id=%d AND id<%d ORDER BY id DESC LIMIT 20",
            $owner, $before ?: PHP_INT_MAX
        ));
    }

    public static function get(int $id) {
        global $wpdb;
        $table = Accounts::table('requests');
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id=%d", $id));
    }

    public static function search(string $query, int $before): array {
        global $wpdb;
        $table = Accounts::table('requests');
        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE id<%d AND (snapshot LIKE %s OR owner_id=%d) ORDER BY id DESC LIMIT 30",
            $before ?: PHP_INT_MAX, '%' . $wpdb->esc_like($query) . '%', ctype_digit($query) ? (int) $query : 0
        ));
    }

    public static function retains(int $owner, string $token): bool {
        if (!self::ready()) return false;
        global $wpdb;
        $table = Accounts::table('requests');
        return (bool) $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table WHERE owner_id=%d AND snapshot LIKE %s LIMIT 1",
            $owner, '%' . $wpdb->esc_like('"' . $token . '"') . '%'
        ));
    }
}
