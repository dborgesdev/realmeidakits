<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
final class Duplicate {
    public static function boot(): void {
        add_filter('post_row_actions', static function ($actions, $post) {
            if ($post->post_type === 'corrida' && current_user_can(CAPABILITY)) $actions['rak_duplicate'] = '<a href="' . esc_url(wp_nonce_url(admin_url('admin-post.php?action=rak_duplicate&post=' . $post->ID), 'rak_duplicate_' . $post->ID)) . '">Duplicar como rascunho</a>';
            return $actions;
        }, 10, 2);
        add_action('admin_post_rak_duplicate', static function () {
            $id = absint($_GET['post'] ?? 0);
            if (!current_user_can(CAPABILITY)) wp_die('Sem permissão.', '', ['response' => 403]);
            check_admin_referer('rak_duplicate_' . $id);
            $copy = self::create($id);
            if (is_wp_error($copy)) wp_die(esc_html($copy->get_error_message()));
            wp_safe_redirect(admin_url('post.php?post=' . $copy . '&action=edit')); exit;
        });
    }
    public static function create(int $id) {
        if (!current_user_can(CAPABILITY) || get_post_type($id) !== 'corrida') return new \WP_Error('rak_forbidden', 'Corrida inválida ou sem permissão.');
        $d = Repository::get($id);
        if (!$d) return new \WP_Error('rak_duplicate', 'Salve a configuração antes de duplicar.');
        $copy = wp_insert_post(['post_type' => 'corrida', 'post_status' => 'draft', 'post_title' => 'Revisar nome — cópia de ' . get_the_title($id), 'post_author' => get_current_user_id()], true);
        if (is_wp_error($copy)) return $copy;
        foreach (['raceDate','raceTime','opensAt','closesAt','location','whatsappUrl'] as $key) $d[$key] = '';
        $d['status'] = 'unavailable';
        foreach (['officialPix','officialCard','shirtPix','shirtCard','numberPix','numberCard'] as $key) $d[$key] = null;
        foreach ($d['kits'] as &$kit) { $kit['pix'] = null; $kit['card'] = null; } unset($kit);
        foreach ($d['pickups'] as &$point) $point['at'] = ''; unset($point);
        Repository::save($copy, $d);
        update_post_meta($copy, '_rak_duplicate_review', 1);
        return $copy;
    }
}
