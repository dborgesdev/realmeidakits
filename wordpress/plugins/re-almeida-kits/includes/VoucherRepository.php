<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class VoucherRepository {
    public static function code(object $voucher): string {
        return 'V-' . $voucher->id;
    }

    public static function byCode(string $code): ?object {
        if (!preg_match('/^V-([1-9][0-9]{0,18})$/iD', $code, $match)) return null;
        $id = filter_var($match[1], FILTER_VALIDATE_INT);
        if ($id === false) return null;
        global $wpdb;
        $table = Accounts::table('vouchers');
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id=%d", $id));
    }
    public static function install(): bool {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = Accounts::table('vouchers');
        $collate = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE $table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            request_id bigint(20) unsigned NOT NULL,
            line_index int unsigned NOT NULL,
            participant_id bigint(20) unsigned NOT NULL,
            race_id bigint(20) unsigned NOT NULL,
            order_id bigint(20) unsigned NOT NULL,
            token varchar(64) NOT NULL,
            state varchar(16) NOT NULL,
            reason varchar(255) NOT NULL,
            revision bigint(20) unsigned NOT NULL DEFAULT 0,
            audit longtext NOT NULL,
            released_at datetime DEFAULT NULL,
            collected_at datetime DEFAULT NULL,
            collected_by bigint(20) unsigned DEFAULT NULL,
            operation_id varchar(36) DEFAULT NULL,
            mail_state varchar(16) NOT NULL DEFAULT 'pending',
            mail_attempts int unsigned NOT NULL DEFAULT 0,
            mail_at datetime DEFAULT NULL,
            mail_result varchar(255) NOT NULL DEFAULT '',
            PRIMARY KEY  (id),
            UNIQUE KEY request_person_race (request_id,participant_id,race_id),
            UNIQUE KEY token (token),
            KEY request_line (request_id,line_index),
            KEY notification (mail_state,released_at)
        ) $collate;");
        return $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))) === $table;
    }

    public static function get(int $request, int $line): ?object {
        if ((int) get_option('rak_schema_version') < 5) return null;
        global $wpdb;
        $table = Accounts::table('vouchers');
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE request_id=%d AND line_index=%d", $request, $line));
    }

    public static function token(string $token): ?object {
        if ((int) get_option('rak_schema_version') < 5) return null;
        if (!preg_match('/^[a-f0-9]{64}$/D', $token)) return null;
        global $wpdb;
        $table = Accounts::table('vouchers');
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE token=%s", $token));
    }

    public static function create(object $row, array $line, int $index): ?object {
        global $wpdb;
        $table = Accounts::table('vouchers');
        $wpdb->query($wpdb->prepare("INSERT IGNORE INTO $table
            (request_id,line_index,participant_id,race_id,order_id,token,state,reason,audit)
            VALUES (%d,%d,%d,%d,%d,%s,'blocked','Aguardando requisitos.','[]')",
            $row->id, $index, $line['participantId'], $line['raceId'], $row->order_id, bin2hex(random_bytes(32))));
        return self::get((int) $row->id, $index);
    }

    // State and its entire audit event change in the SAME conditional database write.
    public static function transition(object $voucher, string $state, string $reason, bool $collect = false): bool {
        global $wpdb;
        $at = gmdate('Y-m-d H:i:s');
        $operation = wp_generate_uuid4();
        $audit = json_decode($voucher->audit, true) ?: [];
        $audit[] = ['at' => $at, 'actor' => get_current_user_id(), 'operation' => $operation,
            'from' => $voucher->state, 'to' => $state, 'reason' => $reason];
        $patch = ['state' => $state, 'reason' => $reason, 'revision' => (int) $voucher->revision + 1,
            'audit' => wp_json_encode($audit)];
        if ($state === 'released' && !$voucher->released_at) $patch['released_at'] = $at;
        if ($collect) $patch += ['collected_at' => $at, 'collected_by' => get_current_user_id(), 'operation_id' => $operation];
        return $wpdb->update(Accounts::table('vouchers'), $patch,
            ['id' => $voucher->id, 'revision' => $voucher->revision, 'state' => $voucher->state]) === 1;
    }
}
