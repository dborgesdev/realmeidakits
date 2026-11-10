<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
final class Migrations {
    public static function upgrade(): void {
        $version = (int) get_option('rak_schema_version', 0);
        if ($version < 1) {
            get_role('administrator')?->add_cap(CAPABILITY);
            update_option('rak_schema_version', 1, false);
            $version = 1;
        }
        if ($version < 2) {
            if (!add_option('rak_migration_2_lock', time(), '', false)) {
                if ((int) get_option('rak_migration_2_lock') < time() - 300) delete_option('rak_migration_2_lock');
                return;
            }
            try {
            Library::register();
            $offset = (int) get_option('rak_migration_2_offset', 0);
            $posts = get_posts(['post_type' => 'corrida', 'post_status' => array_keys(get_post_stati()), 'numberposts' => 25, 'offset' => $offset, 'orderby' => 'ID', 'order' => 'ASC']);
            foreach ($posts as $post) {
                $data = Repository::get($post->ID);
                if (!$data) continue;
                foreach (['documents' => 'rak_document', 'conditions' => 'rak_condition'] as $key => $type) {
                    foreach ($data[$key] ?? [] as $index => $row) {
                        if (!empty($row['libraryId'])) continue;
                        $input = $key === 'documents'
                            ? ['label' => $row['label'], 'guidance' => $row['guidance'] ?? '', 'purpose' => '', 'requiresUpload' => true, 'templateId' => 0, 'active' => true]
                            : ['label' => 'Condição importada — ' . mb_substr($row['text'], 0, 65), 'text' => $row['text'], 'active' => true];
                        $hash = hash('sha256', wp_json_encode($input));
                        $existing = get_posts(['post_type' => $type, 'post_status' => ['draft','publish','private'], 'numberposts' => 1, 'meta_key' => '_rak_migration_key', 'meta_value' => $hash]);
                        $id = $existing ? $existing[0]->ID : wp_insert_post(['post_type' => $type, 'post_title' => $input['label'], 'post_status' => 'publish'], true);
                        if (is_wp_error($id)) return;
                        update_post_meta($id, '_rak_migration_key', $hash);
                        if (!Library::get($id)) {
                            $saved = Library::store($id, $input, true);
                            if (is_wp_error($saved)) return;
                            update_post_meta($id, '_rak_migration_key', $hash);
                        }
                        // Keep legacy row identifiers, text, condition versions, scopes and modality overrides.
                        $data[$key][$index] = array_replace($row, ['libraryId' => $id, 'libraryVersion' => 1]);
                        if ($key === 'documents') $data[$key][$index] += ['templateId' => 0, 'requiresUpload' => true, 'purpose' => ''];
                    }
                }
                update_post_meta($post->ID, Repository::KEY, wp_slash($data));
            }
            if (count($posts) === 25) { update_option('rak_migration_2_offset', $offset + 25, false); return; }
            update_option('rak_schema_version', 2, false);
            delete_option('rak_migration_2_offset');
            } finally { delete_option('rak_migration_2_lock'); }
        }
        if ((int)get_option('rak_schema_version') === 2) {
            Accounts::install();
            if ((int)get_option('rak_accounts_schema') === 1) update_option('rak_schema_version', 3, false);
        }
        if ((int) get_option('rak_schema_version') === 3 && KitOrderRepository::install()) {
            update_option('rak_schema_version', 4, false);
        }
        if ((int) get_option('rak_schema_version') >= 4 && !get_option('rak_requests_capability')) {
            $role = get_role('administrator');
            if ($role) {
                $role->add_cap(RequestOperations::CAPABILITY);
                update_option('rak_requests_capability', 1, false);
            }
        }
        if (get_option('rak_plugin_version') !== VERSION) update_option('rak_plugin_version', VERSION, false);
    }
}
