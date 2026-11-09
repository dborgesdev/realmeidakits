<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
final class Races {
    public static function register(): void {
        $caps = array_fill_keys(['edit_post', 'read_post', 'delete_post', 'edit_posts', 'edit_others_posts', 'publish_posts', 'read_private_posts', 'delete_posts', 'delete_private_posts', 'delete_published_posts', 'delete_others_posts', 'edit_private_posts', 'edit_published_posts', 'create_posts'], CAPABILITY);
        register_post_type('corrida', [
            'labels' => ['name' => 'Corridas', 'singular_name' => 'Corrida', 'add_new_item' => 'Adicionar corrida', 'edit_item' => 'Editar corrida', 'all_items' => 'Todas as corridas', 'menu_name' => 'Re Almeida Kits'],
            'public' => false, 'show_ui' => true, 'show_in_rest' => true,
            'menu_icon' => 'dashicons-awards', 'supports' => ['title', 'editor', 'thumbnail', 'revisions'],
            'capabilities' => $caps, 'map_meta_cap' => false, 'has_archive' => false, 'rewrite' => false,
        ]);
        register_post_meta('corrida', Repository::KEY, [
            'type' => 'object', 'single' => true, 'show_in_rest' => false,
            'auth_callback' => static fn() => current_user_can(CAPABILITY),
            'sanitize_callback' => static function ($value) {
                $clean = Schema::validate($value);
                return is_wp_error($clean) ? [] : $clean;
            },
        ]);
    }
}
