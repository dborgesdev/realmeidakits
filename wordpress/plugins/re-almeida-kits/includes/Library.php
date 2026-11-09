<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
/** Native WordPress libraries. Races keep explicit versioned snapshots, never live joins. */
final class Library {
    public const TYPES = ['rak_document' => 'Biblioteca de documentos', 'rak_condition' => 'Biblioteca de condições'];
    public static function boot(): void {
        add_action('init', [self::class, 'register']);
        add_action('wp_ajax_rak_library_create', [self::class, 'inlineCreate']);
        add_action('add_meta_boxes', static function ($type) {
            if (isset(self::TYPES[$type])) add_meta_box('rak-library', 'Conteúdo reutilizável', [self::class, 'render'], $type, 'normal', 'high');
        });
        add_action('save_post', [self::class, 'saveForm'], 10, 2);
        add_action('admin_notices', [self::class, 'notice']);
        add_filter('use_block_editor_for_post_type', static fn($use, $type) => isset(self::TYPES[$type]) ? false : $use, 10, 2);
        add_filter('manage_rak_document_posts_columns', [self::class, 'columns']);
        add_filter('manage_rak_condition_posts_columns', [self::class, 'columns']);
        foreach (array_keys(self::TYPES) as $type) add_action('manage_' . $type . '_posts_custom_column', static function ($column, $id) {
            if ($column === 'rak_state') { $d = self::get($id); echo esc_html(($d['active'] ?? false) ? 'Ativo' : 'Inativo'); echo ' · v' . (int) ($d['version'] ?? 0); }
        }, 10, 2);
    }
    public static function inlineCreate(): void {
        if (!current_user_can(CAPABILITY)) wp_send_json_error(['message' => 'Sem permissão.'], 403);
        check_ajax_referer('rak_library_inline', 'nonce');
        $type = isset($_POST['kind']) && $_POST['kind'] === 'conditions' ? 'rak_condition' : 'rak_document';
        $raw = isset($_POST['item']) && is_string($_POST['item']) ? wp_unslash($_POST['item']) : '';
        $input = strlen($raw) < 50000 ? json_decode($raw, true) : null;
        if (!is_array($input)) wp_send_json_error(['message' => 'Conteúdo inválido.'], 422);
        $name = $input['label'] ?? ($type === 'rak_condition' ? 'Condição reutilizável' : '');
        if (!is_string($name) || !trim($name)) wp_send_json_error(['message' => 'Informe um nome para a biblioteca.'], 422);
        $id = wp_insert_post(['post_type' => $type, 'post_title' => sanitize_text_field($name), 'post_status' => 'draft'], true);
        if (is_wp_error($id)) wp_send_json_error(['message' => 'Não foi possível criar o item.'], 422);
        $input['label'] = $name; $input['active'] = true;
        $result = self::store($id, $input);
        if (is_wp_error($result)) { wp_trash_post($id); wp_send_json_error(['message' => $result->get_error_message()], 422); }
        wp_send_json_success($result + ['libraryId' => $id]);
    }
    public static function columns(array $columns): array { $columns['rak_state'] = 'Situação / versão'; return $columns; }
    public static function register(): void {
        $caps = array_fill_keys(['edit_post','read_post','delete_post','edit_posts','edit_others_posts','publish_posts','read_private_posts','delete_posts','delete_private_posts','delete_published_posts','delete_others_posts','edit_private_posts','edit_published_posts','create_posts'], CAPABILITY);
        foreach (self::TYPES as $type => $name) register_post_type($type, ['labels' => ['name' => $name, 'singular_name' => $type === 'rak_document' ? 'Documento reutilizável' : 'Condição reutilizável', 'add_new_item' => $type === 'rak_document' ? 'Adicionar documento' : 'Adicionar condição'], 'public' => false, 'show_ui' => true, 'show_in_menu' => 'edit.php?post_type=corrida', 'show_in_rest' => false, 'supports' => ['title'], 'capabilities' => $caps, 'map_meta_cap' => false, 'rewrite' => false]);
    }
    public static function get(int $id): array { $d = get_post_meta($id, '_rak_library', true); return is_array($d) ? $d : []; }
    public static function store(int $id, array $input, bool $migration = false) {
        if (!$migration && !current_user_can(CAPABILITY)) return new \WP_Error('rak_forbidden', 'Sem permissão para editar a biblioteca.');
        $type = get_post_type($id);
        if (!isset(self::TYPES[$type])) return new \WP_Error('rak_library', 'Item da biblioteca inválido.');
        $old = self::get($id);
        foreach (['label', 'guidance', 'text', 'purpose'] as $key) if (isset($input[$key]) && (!is_string($input[$key]) || strlen($input[$key]) > 15000)) return new \WP_Error('rak_library', 'Texto inválido ou longo demais.');
        $label = sanitize_text_field($input['label'] ?? get_the_title($id));
        if (!trim($label)) return new \WP_Error('rak_library', 'Informe o nome do item.');
        $d = ['id' => $old['id'] ?? ($type === 'rak_document' ? 'doc-' : 'condition-') . $id, 'label' => $label, 'active' => !empty($input['active'])];
        if ($type === 'rak_document') {
            $template = $input['templateId'] ?? 0;
            if (!is_int($template) || $template < 0) return new \WP_Error('rak_pdf', 'Modelo inválido.');
            if ($template) { $valid = PublicModels::approve($template, !empty($input['confirmPublicTemplate'])); if (is_wp_error($valid)) return $valid; }
            $d += ['guidance' => sanitize_textarea_field($input['guidance'] ?? ''), 'purpose' => sanitize_text_field($input['purpose'] ?? ''), 'requiresUpload' => !array_key_exists('requiresUpload', $input) || !empty($input['requiresUpload']), 'templateId' => $template];
        } else {
            $d['text'] = sanitize_textarea_field($input['text'] ?? '');
            if (!trim($d['text'])) return new \WP_Error('rak_library', 'Informe o texto da condição.');
        }
        $previous = $old; unset($previous['version']);
        $version = (int) ($old['version'] ?? 0);
        $d['version'] = $previous === $d ? max(1, $version) : $version + 1;
        $history = get_post_meta($id, '_rak_library_history', true); $history = is_array($history) ? $history : [];
        if ($old) $history[$old['version']] = $old;
        $history[$d['version']] = $d;
        update_post_meta($id, '_rak_library', wp_slash($d));
        update_post_meta($id, '_rak_library_history', wp_slash($history));
        return $d;
    }
    public static function available(string $type): array {
        $items = [];
        foreach (get_posts(['post_type' => $type, 'post_status' => ['publish','draft','private'], 'numberposts' => -1, 'orderby' => 'title', 'order' => 'ASC']) as $post) {
            $d = self::get($post->ID);
            if (!$d || !$d['active']) continue;
            $items[] = $d + ['libraryId' => $post->ID];
        }
        return $items;
    }
    /** The referenced version must exist. Labels/instructions may be overridden per race. */
    public static function validateSnapshot(array $row, string $type) {
        $id = $row['libraryId'] ?? 0;
        if (!is_int($id) || !is_int($row['libraryVersion'] ?? 0)) return new \WP_Error('rak_library', 'Referência inválida.');
        if (!$id) return true;
        $history = get_post_meta($id, '_rak_library_history', true);
        $snap = $history[$row['libraryVersion'] ?? 0] ?? null;
        if (get_post_type($id) !== $type || !$snap) return new \WP_Error('rak_library', 'Referência ou versão de biblioteca inválida.');
        if ($type === 'rak_condition' && $row['text'] !== $snap['text']) return new \WP_Error('rak_library', 'Para editar o texto de uma condição da biblioteca, desvincule-a como condição específica.');
        if ($type === 'rak_document' && (($row['templateId'] ?? 0) !== $snap['templateId'] || ($row['requiresUpload'] ?? true) !== $snap['requiresUpload'] || ($row['purpose'] ?? '') !== $snap['purpose'])) return new \WP_Error('rak_library', 'Modelo ou finalidade divergente da versão selecionada. Reaplique o item ou desvincule-o.');
        return true;
    }
    public static function associate(int $id, array $overrides = []): array {
        $d = self::get($id);
        $common = ['id' => $d['id'], 'libraryId' => $id, 'libraryVersion' => $d['version']];
        if (get_post_type($id) === 'rak_document') return array_replace($common + ['label' => $d['label'], 'guidance' => $d['guidance'], 'purpose' => $d['purpose'], 'requiresUpload' => $d['requiresUpload'], 'templateId' => $d['templateId'], 'required' => true, 'modality' => 'both', 'scope' => 'race'], $overrides);
        return $common + ['text' => $d['text'], 'active' => true, 'version' => 1];
    }
    public static function render(\WP_Post $post): void {
        wp_nonce_field('rak_library_' . $post->ID, 'rak_library_nonce');
        $pending = get_transient('rak_library_error_' . get_current_user_id() . '_' . $post->ID);
        $d = $pending['input'] ?? self::get($post->ID);
        $document = $post->post_type === 'rak_document';
        $field = static function ($key, $label, $type = 'text', $value = '') {
            echo '<p><label for="rak-lib-' . esc_attr($key) . '"><strong>' . esc_html($label) . '</strong></label><br>';
            if ($type === 'textarea') echo '<textarea rows="6" class="large-text" id="rak-lib-' . esc_attr($key) . '" name="rak_library[' . esc_attr($key) . ']">' . esc_textarea($value) . '</textarea>';
            else echo '<input class="regular-text" type="' . esc_attr($type) . '" id="rak-lib-' . esc_attr($key) . '" name="rak_library[' . esc_attr($key) . ']" value="' . esc_attr($value) . '">';
            echo '</p>';
        };
        echo '<p>Identificador estável: <code>' . esc_html($d['id'] ?? 'gerado ao salvar') . '</code> · versão ' . (int) ($d['version'] ?? 0) . '.</p>';
        echo '<p><label><input type="checkbox" name="rak_library[active]" value="1" ' . checked($d['active'] ?? true, true, false) . '> Ativo para novas associações</label></p>';
        if ($document) {
            $field('guidance', 'Descrição e instruções para o corredor', 'textarea', $d['guidance'] ?? '');
            $field('purpose', 'Tipo / finalidade', 'text', $d['purpose'] ?? '');
            echo '<p><label><input type="checkbox" name="rak_library[requiresUpload]" value="1" ' . checked($d['requiresUpload'] ?? true, true, false) . '> Exige envio de arquivo preenchido ou assinado (somente demonstração no React atual)</label></p>';
            echo '<div class="rak-model-picker"><input type="hidden" id="rak-library-template" name="rak_library[templateId]" value="' . (int) ($d['templateId'] ?? 0) . '"><button type="button" class="button rak-choose-pdf">Selecionar PDF modelo público</button> <button type="button" class="button rak-clear-pdf">Remover modelo desta versão</button><p class="rak-pdf-selection">' . esc_html(!empty($d['templateId']) ? 'PDF #' . $d['templateId'] : 'Nenhum modelo selecionado') . '</p></div>';
            echo '<p><label><input type="checkbox" name="rak_library[confirmPublicTemplate]" value="1"> Confirmo: PDF público em branco, sem dados pessoais. Não é uma autorização assinada.</label></p><p>Somente PDF estático, até 5 MB. Modelos aprovados são preservados na mídia para não quebrar o histórico. Substituições usam um novo anexo; nunca sobrescreva o arquivo antigo.</p>';
        } else $field('text', 'Texto da condição *', 'textarea', $d['text'] ?? '');
        echo '<p>As corridas guardam cópias da versão escolhida. Editar, desativar ou remover este item da biblioteca não muda essas cópias. Para aplicar uma versão nova, selecione-a novamente na corrida.</p>';
        $history = get_post_meta($post->ID, '_rak_library_history', true);
        if (is_array($history)) { echo '<details><summary>Histórico de versões</summary>'; foreach (array_reverse($history, true) as $version => $snap) echo '<section><h3>Versão ' . (int) $version . '</h3><p>' . nl2br(esc_html($snap['text'] ?? $snap['guidance'] ?? '')) . '</p><p>' . esc_html($snap['label']) . (!empty($snap['templateId']) ? ' · PDF #' . (int) $snap['templateId'] : '') . '</p></section>'; echo '</details>'; }
    }
    public static function saveForm(int $id, \WP_Post $post): void {
        if (!isset(self::TYPES[$post->post_type]) || !isset($_POST['rak_library_nonce']) || wp_is_post_autosave($id) || wp_is_post_revision($id)) return;
        if (!current_user_can(CAPABILITY) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['rak_library_nonce'])), 'rak_library_' . $id)) wp_die('Sessão expirada ou sem permissão.', '', ['response' => 403]);
        $input = isset($_POST['rak_library']) && is_array($_POST['rak_library']) ? wp_unslash($_POST['rak_library']) : [];
        $input['label'] = $post->post_title;
        $input['requiresUpload'] = !empty($input['requiresUpload']);
        if (isset($input['templateId']) && (!is_scalar($input['templateId']) || !ctype_digit((string) $input['templateId']))) $input['templateId'] = -1;
        else $input['templateId'] = (int) ($input['templateId'] ?? 0);
        $result = self::store($id, $input);
        $key = 'rak_library_error_' . get_current_user_id() . '_' . $id;
        if (is_wp_error($result)) set_transient($key, ['error' => $result->get_error_message(), 'input' => $input], 30 * MINUTE_IN_SECONDS);
        else delete_transient($key);
    }
    public static function notice(): void {
        $screen = get_current_screen();
        if (!isset(self::TYPES[$screen?->post_type ?? ''])) return;
        $id = absint($_GET['post'] ?? 0);
        $pending = get_transient('rak_library_error_' . get_current_user_id() . '_' . $id);
        if ($pending) echo '<div class="notice notice-error" role="alert"><p>Conteúdo da biblioteca não salvo: ' . esc_html($pending['error']) . '</p></div>';
        elseif (isset($_GET['message'])) echo '<div class="notice notice-success"><p>Item da biblioteca salvo. Versões já associadas às corridas foram preservadas.</p></div>';
    }
}
