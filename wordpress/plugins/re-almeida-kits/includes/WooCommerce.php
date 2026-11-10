<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class WooCommerce {
    private static ?array $registration = null;

    public static function boot(): void {
        add_action('before_woocommerce_init', static function (): void {
            if (class_exists('Automattic\WooCommerce\Utilities\FeaturesUtil')) {
                \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', FILE, true);
            }
        });
        add_filter('woocommerce_process_login_errors', static function (\WP_Error $errors): \WP_Error {
            if (!AccountAuth::throttle('login-ip', 60, 900)) {
                $errors->add('rak_rate_limit', 'Muitas tentativas. Aguarde alguns minutos.');
            }
            return $errors;
        });
        add_filter('woocommerce_coming_soon_exclude', static fn($excluded) => $excluded || is_account_page());
        add_action('template_redirect', [self::class, 'privatePages'], 0);
        add_filter('woocommerce_login_redirect', [self::class, 'returnAfterAuth']);
        add_filter('woocommerce_registration_redirect', [self::class, 'returnAfterAuth']);
        add_action('woocommerce_login_form_start', [self::class, 'returnField']);
        add_action('woocommerce_register_form_start', [self::class, 'returnField']);
        add_action('woocommerce_register_form', [self::class, 'registrationFields']);
        add_filter('woocommerce_process_registration_errors', [self::class, 'validateRegistration'], PHP_INT_MAX, 4);
        add_action('woocommerce_created_customer', [self::class, 'saveRegistration'], 1);
        add_action('woocommerce_edit_account_form', [self::class, 'editFields']);
        add_action('woocommerce_save_account_details_errors', [self::class, 'validateEdit'], 10, 2);
        add_action('woocommerce_save_account_details', [self::class, 'saveEdit']);
        add_action('woocommerce_after_save_address_validation', [self::class, 'validateBilling'], 10, 2);
        add_action('woocommerce_customer_save_address', [self::class, 'syncBilling'], 10, 2);
        add_action('woocommerce_account_dashboard', static function (): void {
            echo '<p><a href="/conta">Voltar à Re Almeida Kits e gerenciar participantes</a></p>';
        });
    }

    private static function input(string $key, array $source): string {
        return isset($source[$key]) && is_string($source[$key]) ? wp_unslash($source[$key]) : '';
    }

    private static function returnTarget(): string {
        $target = self::input('rak_return', $_POST) ?: self::input('rak_return', $_GET);
        return preg_match('#^/(?:conta|solicitacao/(?:pedido|responsavel|participantes|documentos|condicoes|revisao|pagamento|configuracao|identificacao|dados|confirmacao)|corridas(?:/[a-z0-9-]{1,200})?)$#D', $target) ? $target : '';
    }

    public static function privatePages(): void {
        if (!function_exists('is_account_page') || (!is_account_page() && !is_cart() && !is_checkout())) return;
        if (!defined('DONOTCACHEPAGE')) define('DONOTCACHEPAGE', true);
        nocache_headers();
        header('Cache-Control: private, no-store, max-age=0');
        // WooCommerce can replace the storefront template and set a later cache header.
        header_register_callback(static function (): void {
            header('Cache-Control: private, no-store, max-age=0');
        });
        $target = self::returnTarget();
        if ($target && is_account_page() && !is_wc_endpoint_url() &&
            ($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && AccountAuth::customer(get_current_user_id())) {
            wp_safe_redirect($target, 302);
            exit;
        }
    }

    public static function returnAfterAuth(string $redirect): string {
        return self::returnTarget() ?: $redirect;
    }

    public static function returnField(): void {
        $target = self::returnTarget();
        if ($target) {
            printf('<input type="hidden" name="rak_return" value="%1$s"><input type="hidden" name="redirect" value="%1$s">', esc_attr($target));
        }
    }

    private static function field(string $key, string $label, string $type, string $value = ''): void {
        printf(
            '<p class="woocommerce-form-row form-row form-row-wide"><label for="rak_%1$s">%2$s</label><input class="woocommerce-Input input-text" name="rak_%1$s" id="rak_%1$s" type="%3$s" value="%4$s" required></p>',
            esc_attr($key), esc_html($label), esc_attr($type), esc_attr($value)
        );
    }

    public static function registrationFields(): void {
        foreach (['name' => ['Nome completo', 'text'], 'cpf' => ['CPF', 'text'], 'birth' => ['Data de nascimento', 'date'], 'phone' => ['Telefone', 'tel']] as $key => [$label, $type]) {
            self::field($key, $label, $type, self::input('rak_' . $key, $_POST));
        }
    }

    public static function validateRegistration(\WP_Error $errors, $username, $password, $email): \WP_Error {
        if ($errors->has_errors()) return $errors;
        if (!AccountAuth::throttle('register', 8, 3600)) {
            $errors->add('rak_rate_limit', 'Muitas tentativas. Tente mais tarde.');
            return $errors;
        }
        $person = Identity::person([
            'name' => self::input('rak_name', $_POST),
            'cpf' => self::input('rak_cpf', $_POST),
            'birthDate' => self::input('rak_birth', $_POST),
            'phone' => self::input('rak_phone', $_POST),
            'email' => $email,
        ], true);
        if (!is_wp_error($person)) {
            $claim = Accounts::locked('identity', static fn() => Accounts::claim($person['cpf']));
            if (!is_wp_error($claim)) {
                self::$registration = $person;
                register_shutdown_function([self::class, 'releaseRegistration']);
                return $errors;
            }
            $person = $claim;
        }
        $errors->add($person->get_error_code(), $person->get_error_message());
        return $errors;
    }

    public static function releaseRegistration(): void {
        if (self::$registration === null) return;
        global $wpdb;
        $wpdb->delete(Accounts::table('identities'), ['cpf' => self::$registration['cpf'], 'user_id' => null]);
    }

    public static function saveRegistration(int $id): void {
        $person = self::$registration;
        if (!$person || strcasecmp(get_userdata($id)->user_email, $person['email']) !== 0) return;
        global $wpdb;
        if ($wpdb->update(Accounts::table('identities'), ['user_id' => $id], ['cpf' => $person['cpf'], 'user_id' => null]) !== 1) {
            throw new \RuntimeException('Não foi possível vincular o CPF. Solicite atendimento.');
        }
        self::$registration = null;
        wp_update_user(['ID' => $id, 'display_name' => $person['name']]);
        Accounts::writeProfile($id, $person);
        do_action('rak_customer_created', $id);
    }

    public static function editFields(): void {
        $profile = Accounts::profile(get_current_user_id());
        if ($profile['cpf'] !== '') {
            printf('<p>CPF do titular: <strong>%s</strong></p>', esc_html($profile['cpf']));
        }
        self::field('birth', 'Data de nascimento', 'date', $profile['birthDate']);
        self::field('phone', 'Telefone', 'tel', $profile['phone']);
    }

    public static function validateEdit(\WP_Error $errors, $user): void {
        // Legacy customers without CPF can complete their identity in the React account.
        $input = self::edited($user->ID, $user);
        $validated = Identity::person($input, true, false);
        if (is_wp_error($validated)) $errors->add($validated->get_error_code(), $validated->get_error_message());
    }

    private static function edited(int $id, $user): array {
        $data = Accounts::profile($id);
        unset($data['id']);
        $data['name'] = trim($user->first_name . ' ' . $user->last_name);
        $data['birthDate'] = self::input('rak_birth', $_POST);
        $data['phone'] = Identity::digits(self::input('rak_phone', $_POST));
        $data['email'] = $user->user_email;
        return $data;
    }

    public static function saveEdit(int $id): void {
        $user = get_userdata($id);
        $data = Identity::person(self::edited($id, $user), true, false);
        if (is_wp_error($data)) return;
        Accounts::writeProfile($id, $data, $user->first_name, $user->last_name);
    }

    public static function validateBilling(int $id, string $type): void {
        if ($type !== 'billing' || !isset($_POST['billing_cpf'])) return;
        $current = Identity::digits(Accounts::profile($id)['cpf']);
        if (Identity::digits(self::input('billing_cpf', $_POST)) !== $current) {
            wc_add_notice('Atualize o CPF pela área do titular ou solicite atendimento.', 'error');
        }
    }

    public static function syncBilling(int $id, string $type): void {
        if ($type !== 'billing') return;
        $data = Accounts::profile($id);
        unset($data['id']);
        $data['phone'] = Identity::digits(get_user_meta($id, 'billing_phone', true));
        update_user_meta($id, '_rak_profile', $data);
        update_user_meta($id, 'billing_cpf', $data['cpf']);
        update_user_meta($id, 'billing_birthdate', $data['birthDate']);
    }
}
