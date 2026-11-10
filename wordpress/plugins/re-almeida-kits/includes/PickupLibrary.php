<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class PickupLibrary {
    private const TYPE = 'rak_pickup';
    private const META = '_rak_pickup';

    public static function boot(): void {
        add_action('init', [self::class, 'register']);
        add_action('add_meta_boxes_' . self::TYPE, static function (): void {
            add_meta_box('rak-pickup-data', 'Endereço e disponibilidade', [self::class, 'render'], self::TYPE, 'normal', 'high');
        });
        add_action('save_post_' . self::TYPE, [self::class, 'save'], 10, 2);
        add_action('wp_ajax_rak_pickup_create', [self::class, 'create']);
        add_filter('use_block_editor_for_post_type', static fn($use, $type) => $type === self::TYPE ? false : $use, 10, 2);
    }

    public static function register(): void {
        $caps = array_fill_keys(['edit_post', 'read_post', 'delete_post', 'edit_posts', 'edit_others_posts', 'publish_posts',
            'read_private_posts', 'delete_posts', 'delete_private_posts', 'delete_published_posts', 'delete_others_posts',
            'edit_private_posts', 'edit_published_posts', 'create_posts'], CAPABILITY);
        register_post_type(self::TYPE, ['labels' => ['name' => 'Locais de retirada', 'singular_name' => 'Local de retirada',
            'add_new_item' => 'Adicionar local de retirada'], 'public' => false, 'show_ui' => true,
            'show_in_menu' => 'edit.php?post_type=corrida', 'show_in_rest' => false, 'supports' => ['title'],
            'capabilities' => $caps, 'map_meta_cap' => false, 'rewrite' => false]);
    }

    public static function available(): array {
        $result = [];
        foreach (get_posts(['post_type' => self::TYPE, 'post_status' => ['publish', 'draft', 'private'], 'numberposts' => -1,
            'orderby' => 'title', 'order' => 'ASC']) as $post) {
            $data = get_post_meta($post->ID, self::META, true);
            if (is_array($data) && !empty($data['active'])) $result[] = $data + ['libraryId' => $post->ID];
        }
        return $result;
    }

    private static function store(int $id, string $name, string $address, bool $active): array {
        $previous = get_post_meta($id, self::META, true);
        $previous = is_array($previous) ? $previous : [];
        $data = ['id' => 'pickup-' . $id, 'label' => $name, 'address' => $address, 'active' => $active];
        $version = (int) ($previous['version'] ?? 0);
        unset($previous['version']);
        $data['version'] = $previous === $data ? $version : $version + 1;
        update_post_meta($id, self::META, wp_slash($data));
        update_post_meta($id, self::META . '_' . $data['version'], wp_slash($data));
        return $data + ['libraryId' => $id];
    }

    private static function address(): string {
        return is_string($_POST['address'] ?? null) ? sanitize_text_field(wp_unslash($_POST['address'])) : '';
    }

    public static function create(): void {
        if (!current_user_can(CAPABILITY)) wp_send_json_error(['message' => 'Sem permissão.'], 403);
        check_ajax_referer('rak_library_inline', 'nonce');
        $name = is_string($_POST['label'] ?? null) ? sanitize_text_field(wp_unslash($_POST['label'])) : '';
        $address = self::address();
        if (!$name || !$address || strlen($name) > 200 || strlen($address) > 500) {
            wp_send_json_error(['message' => 'Informe nome e endereço válidos.'], 422);
        }
        $result = Accounts::locked('pickup_library', static function () use ($name, $address) {
            foreach (self::available() as $existing) {
                if (strcasecmp($existing['label'], $name) === 0 && strcasecmp($existing['address'], $address) === 0) return $existing;
            }
            $id = wp_insert_post(['post_type' => self::TYPE, 'post_status' => 'publish', 'post_title' => wp_slash($name)], true);
            return is_wp_error($id) ? $id : self::store($id, $name, $address, true);
        });
        if (is_wp_error($result)) wp_send_json_error(['message' => $result->get_error_message()], 422);
        wp_send_json_success($result);
    }

    public static function render(\WP_Post $post): void {
        $data = get_post_meta($post->ID, self::META, true);
        $data = is_array($data) ? $data : [];
        wp_nonce_field('rak_pickup_' . $post->ID, 'rak_pickup_nonce');
        printf('<p><label>Endereço completo <input class="large-text" name="address" maxlength="500" value="%s"></label></p><p><label><input type="checkbox" name="pickupActive" value="1" %s> Disponível para novas associações</label></p>',
            esc_attr($data['address'] ?? ''), checked($data['active'] ?? true, true, false));
        echo '<h3>Corridas que utilizam este local</h3><p>As corridas guardam o endereço da versão associada.</p><ul>';
        foreach (get_posts(['post_type' => 'corrida', 'post_status' => ['publish', 'draft', 'private', 'pending'], 'numberposts' => -1]) as $race) {
            foreach (Repository::get($race->ID)['pickups'] ?? [] as $location) {
                if ((int) ($location['libraryId'] ?? 0) === $post->ID) {
                    printf('<li><a href="%s">%s</a> · versão %d</li>', esc_url(get_edit_post_link($race->ID, 'raw')),
                        esc_html($race->post_title), (int) $location['libraryVersion']);
                }
            }
        }
        echo '</ul>';
    }

    public static function save(int $id, \WP_Post $post): void {
        if (!isset($_POST['rak_pickup_nonce']) || wp_is_post_revision($id) || wp_is_post_autosave($id)) return;
        if (!current_user_can(CAPABILITY)) wp_die('Acesso restrito.', '', ['response' => 403]);
        check_admin_referer('rak_pickup_' . $id, 'rak_pickup_nonce');
        $address = self::address();
        if (!$post->post_title || !$address || strlen($address) > 500) {
            wp_die('Informe nome e endereço válidos para o local.', '', ['response' => 422, 'back_link' => true]);
        }
        self::store($id, $post->post_title, $address, !empty($_POST['pickupActive']));
    }
}
