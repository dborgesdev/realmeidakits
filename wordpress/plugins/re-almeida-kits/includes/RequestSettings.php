<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class RequestSettings {
    private const OPTION = 'rak_participant_limit';

    public static function limit(): int {
        return max(1, min(100, (int) get_option(self::OPTION, 20)));
    }

    public static function boot(): void {
        add_action('admin_init', static function (): void {
            register_setting('rak_request_settings', self::OPTION, ['type' => 'integer', 'default' => 20,
                'sanitize_callback' => static fn($value) => max(1, min(100, (int) $value))]);
        });
        add_action('admin_menu', static function (): void {
            add_submenu_page('edit.php?post_type=corrida', 'Configuração de solicitações', 'Configuração de solicitações',
                'manage_options', 'rak-request-settings', [self::class, 'render']);
        });
    }

    public static function render(): void {
        if (!current_user_can('manage_options')) wp_die('Acesso restrito.', '', ['response' => 403]);
        echo '<div class="wrap"><h1>Configuração de solicitações</h1><form action="options.php" method="post">';
        settings_fields('rak_request_settings');
        printf('<p><label>Limite de participantes por solicitação <input name="%s" type="number" min="1" max="100" required value="%d"></label></p>',
            esc_attr(self::OPTION), self::limit());
        submit_button();
        echo '</form></div>';
    }
}
