<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
final class Admin {
    private static $validated = null;
    public static function boot(): void {
        add_filter('use_block_editor_for_post_type', static fn($use, $type) => $type === 'corrida' ? false : $use, 10, 2);
        add_action('add_meta_boxes_corrida', static function (): void {
            add_meta_box('rak-config', 'Configuração do serviço de retirada', [self::class, 'render'], 'corrida', 'normal', 'high');
        });
        add_action('admin_enqueue_scripts', [self::class, 'assets']);
        add_filter('wp_insert_post_data', [self::class, 'beforeSave'], 10, 2);
        add_action('save_post_corrida', [self::class, 'save'], 10, 2);
        add_action('admin_notices', [self::class, 'notice']);
    }
    public static function assets(): void {
        if (!in_array(get_current_screen()?->post_type, ['corrida','rak_document','rak_condition'], true) && ( $_GET['page'] ?? '') !== 'rak-document-library') return;
        wp_enqueue_media();
        wp_enqueue_style('rak-admin', plugins_url('assets/admin.css', FILE), [], VERSION);
        wp_enqueue_script('rak-admin', plugins_url('assets/admin.js', FILE), [], VERSION, true);
    }
    private static function transient(int $id): string {
        return 'rak_edit_' . get_current_user_id() . '_' . $id;
    }
    public static function render(\WP_Post $post): void {
        wp_nonce_field('rak_save_' . $post->ID, 'rak_nonce');
        $pending = get_transient(self::transient($post->ID));
        $raw = Repository::get($post->ID);
        $data = RacePrices::canonical($pending['input'] ?? $raw);
        $legacy = RacePrices::legacy($raw) ?: get_post_meta($post->ID, '_rak_legacy_prices', true);
        if (empty($data['priceCents']) && ($data['priceCents'] ?? null) !== 0 && is_array($legacy) && count(array_unique($legacy)) > 1) {
            $values = array_map(static fn($cents) => 'R$ ' . number_format($cents / 100, 2, ',', '.'), array_unique($legacy));
            echo '<div class="notice notice-warning inline"><p>Defina os valores das modalidades oferecidas. Os valores anteriores divergem (' . esc_html(implode(', ', $values)) . ') e foram mantidos como referência.</p></div>';
        }
        echo '<p>Nome, descrição, slug, imagem destacada e publicação utilizam os campos nativos do WordPress. Os prazos abaixo usam o fuso <strong>' . esc_html(wp_timezone_string()) . '</strong>. Configure-o em Configurações → Geral.</p>';
        echo '<p>Todos os campos sem * são opcionais. Habilite ao menos uma modalidade e uma distância correspondente. Preços vazios significam “a confirmar”. Nenhuma cobrança é criada.</p>';
        if (get_post_meta($post->ID, '_rak_duplicate_review', true)) echo '<div class="notice notice-warning inline"><p>Cópia em rascunho: revise nome, data/horário, prazos, imagem, local, valores e WhatsApp antes de publicar.</p><label><input type="checkbox" id="rak-copy-reviewed" name="rak_copy_reviewed" value="1"> Revisei os dados específicos desta nova corrida.</label></div>';
        echo '<div id="rak-editor"></div><noscript>Ative JavaScript para editar as opções estruturadas desta corrida. O salvamento está bloqueado sem o formulário completo.</noscript>';
        echo '<input type="hidden" name="rak_payload" id="rak-payload" disabled>';
        echo '<script type="application/json" id="rak-schema">' . wp_json_encode(['raceId' => (int) $post->ID, 'ajaxUrl' => admin_url('admin-ajax.php'), 'inlineNonce' => wp_create_nonce('rak_library_inline'), 'sections' => Schema::sections(), 'libraries' => ['documents' => Library::available('rak_document'), 'conditions' => Library::available('rak_condition'), 'pickups' => PickupLibrary::available()], 'errorFields' => $pending['fields'] ?? [], 'errorMessage' => $pending['error'] ?? '', 'data' => $data, 'image' => !empty($data['shirtImageId']) ? wp_get_attachment_image_url((int) $data['shirtImageId'], 'medium') : ''], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) . '</script>';
    }
    public static function beforeSave(array $data, array $postarr): array {
        if (($data['post_type'] ?? '') !== 'corrida' || !isset($_POST['rak_nonce']) || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)) return $data;
        $id = (int) ($postarr['ID'] ?? 0);
        if (!current_user_can(CAPABILITY) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['rak_nonce'])), 'rak_save_' . $id)) {
            wp_die('Você não tem permissão ou a sessão expirou. Reabra o cadastro.', '', ['response' => 403]);
        }
        $raw = isset($_POST['rak_payload']) && is_string($_POST['rak_payload']) ? wp_unslash($_POST['rak_payload']) : '';
        $input = strlen($raw) <= 250000 ? json_decode($raw, true) : null;
        $oldConfig = Repository::get($id);
        $associationError = null;
        if (is_array($input)) foreach (['documents' => 'rak_document', 'conditions' => 'rak_condition'] as $key => $type) {
            if (!is_array($input[$key] ?? null)) continue;
            foreach ($input[$key] as $row) {
                if (!is_array($row) || empty($row['libraryId'])) continue;
                $oldRow = current(array_filter($oldConfig[$key] ?? [], static fn($old) => $old['id'] === ($row['id'] ?? '')));
                $unchanged = $oldRow && ($oldRow['libraryId'] ?? 0) === $row['libraryId'] && ($oldRow['libraryVersion'] ?? 0) === ($row['libraryVersion'] ?? 0);
                if ($unchanged && ($key === 'conditions' ? $oldRow['text'] === ($row['text'] ?? '') : (($oldRow['templateId'] ?? 0) === ($row['templateId'] ?? 0) && ($oldRow['requiresUpload'] ?? true) === ($row['requiresUpload'] ?? true) && ($oldRow['purpose'] ?? '') === ($row['purpose'] ?? '')))) continue;
                $validation = Library::validateSnapshot($row, $type);
                if (is_wp_error($validation)) $associationError = new \WP_Error('rak_invalid', $validation->get_error_message(), ['fields' => [$key]]);
            }
        }
        $clean = $associationError ?? Schema::validate($input);
        if (get_post_meta($id, '_rak_duplicate_review', true) && ($data['post_status'] ?? '') === 'publish' && (empty($_POST['rak_copy_reviewed']) || str_starts_with($data['post_title'] ?? '', 'Revisar nome —'))) $clean = new \WP_Error('rak_invalid', 'Revise o nome e confirme a revisão dos dados da cópia antes de publicar.', ['fields' => ['duplicateReview']]);
        if (!trim(wp_strip_all_tags($data['post_title'] ?? ''))) $clean = new \WP_Error('rak_invalid', 'Informe o nome da corrida.');
        if (is_wp_error($clean)) {
            self::$validated = false;
            set_transient(self::transient($id), ['error' => $clean->get_error_message(), 'fields' => $clean->get_error_data()['fields'] ?? [], 'input' => is_array($input) ? $input : Repository::get($id)], 30 * MINUTE_IN_SECONDS);
            $old = get_post($id);
            $data['post_status'] = $old && Repository::get($id) ? $old->post_status : 'draft';
        } else {
            self::$validated = $clean;
            delete_transient(self::transient($id));
        }
        return $data;
    }
    public static function save(int $id, \WP_Post $post): void {
        if (wp_is_post_revision($id) || wp_is_post_autosave($id) || !current_user_can(CAPABILITY)) return;
        if (is_array(self::$validated)) {
            Repository::save($id, self::$validated);
            if (!empty($_POST['rak_copy_reviewed']) && !str_starts_with($post->post_title, 'Revisar nome —')) delete_post_meta($id, '_rak_duplicate_review');
            self::$validated = null;
        }
        // Duplicates stay drafts until explicitly reviewed through the editor.
        if ($post->post_status === 'publish' && get_post_meta($id, '_rak_duplicate_review', true)) {
            remove_action('save_post_corrida', [self::class, 'save'], 10);
            wp_update_post(['ID' => $id, 'post_status' => 'draft']);
            add_action('save_post_corrida', [self::class, 'save'], 10, 2);
        }
        // A post created through the core API cannot publish without a validated configuration.
        if ($post->post_status === 'publish' && !Repository::get($id)) {
            remove_action('save_post_corrida', [self::class, 'save'], 10);
            wp_update_post(['ID' => $id, 'post_status' => 'draft']);
            add_action('save_post_corrida', [self::class, 'save'], 10, 2);
        }
    }
    public static function notice(): void {
        if (get_current_screen()?->post_type !== 'corrida') return;
        $id = isset($_GET['post']) ? absint($_GET['post']) : 0;
        $pending = get_transient(self::transient($id));
        if ($pending) {
            echo '<div class="notice notice-error" role="alert"><p><strong>Configuração não salva.</strong> ' . esc_html($pending['error']) . ' Os campos abaixo preservam sua tentativa por 30 minutos. Corrija e salve novamente. A configuração pública anterior foi mantida.</p></div>';
        } elseif (isset($_GET['message']) && in_array((int) $_GET['message'], [1, 6], true) && Repository::get($id)) {
            echo '<div class="notice notice-success"><p>Configuração da corrida salva. Confira a disponibilidade e os dados na API pública.</p></div>';
        }
    }
}
