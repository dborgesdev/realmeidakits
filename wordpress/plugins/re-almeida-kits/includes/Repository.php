<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
final class Repository {
    public const KEY = '_rak_race';
    public static function get(int $id): array {
        $data = get_post_meta($id, self::KEY, true);
        return is_array($data) ? $data : [];
    }
    public static function save(int $id, array $data): void {
        $old = self::get($id);
        $history = get_post_meta($id, '_rak_condition_history', true);
        $history = is_array($history) ? $history : [];
        foreach ($old['conditions'] ?? [] as $condition) {
            $history[$condition['id']][$condition['version']] = $condition['text'];
        }
        foreach ($data['conditions'] as &$condition) {
            $versions = $history[$condition['id']] ?? [];
            $last = $versions ? max(array_keys($versions)) : 0;
            $condition['version'] = $last && $versions[$last] === $condition['text'] ? $last : $last + 1;
            $history[$condition['id']][$condition['version']] = $condition['text'];
        }
        unset($condition);
        update_post_meta($id, self::KEY, wp_slash($data));
        update_post_meta($id, '_rak_condition_history', wp_slash($history));
    }
    public static function availability(array $data, ?int $now = null): string {
        $now ??= time();
        if (($data['status'] ?? 'unavailable') !== 'open') {
            return $data['status'] ?? 'unavailable';
        }
        if (!empty($data['closesAt']) && strtotime($data['closesAt']) <= $now) {
            return 'closed';
        }
        if (!empty($data['opensAt']) && strtotime($data['opensAt']) > $now) {
            return 'unavailable';
        }
        return 'open';
    }
}
