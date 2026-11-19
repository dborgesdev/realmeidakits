<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class NotificationQueue {
    public static function install(): bool {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = Accounts::table('notifications'); $collate = $wpdb->get_charset_collate();
        dbDelta("CREATE TABLE $table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            event_key varchar(64) NOT NULL,
            request_id bigint(20) unsigned NOT NULL DEFAULT 0,
            actor bigint(20) unsigned NOT NULL DEFAULT 0,
            recipient varchar(254) NOT NULL,
            subject varchar(255) NOT NULL,
            body longtext NOT NULL,
            context longtext NOT NULL,
            status varchar(16) NOT NULL DEFAULT 'pending',
            attempts int unsigned NOT NULL DEFAULT 0,
            updated_at datetime NOT NULL,
            result varchar(255) NOT NULL DEFAULT '',
            PRIMARY KEY  (id),
            UNIQUE KEY event_key (event_key),
            KEY request_id (request_id)
        ) $collate;");
        return $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table))) === $table;
    }
    public static function boot(): void {
        add_action('rak_notification_send', [self::class, 'send']);
        add_action('rak_reconcile_vouchers', [self::class, 'recover'], 30);
        add_action('admin_post_rak_notification_retry', [self::class, 'retry']);
    }
    public static function retry(): void {
        if (!current_user_can(RequestOperations::CAPABILITY)) wp_die('Acesso restrito.', '', ['response' => 403]);
        $id = absint($_POST['notification'] ?? 0); check_admin_referer('rak_notification_retry_' . $id);
        if (($_POST['confirmed'] ?? '') !== 'yes') wp_die('Confirme a conferência do transporte.', '', ['response' => 400]);
        global $wpdb; $table = Accounts::table('notifications');
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id=%d", $id));
        if (!$row || !in_array($row->status, ['failed','uncertain'], true)) wp_die('Notificação não habilitada para recuperação.', '', ['response' => 409]);
        $context = json_decode($row->context, true) ?: [];
        $context['retries'][] = ['actor' => get_current_user_id(), 'at' => gmdate('c'), 'status' => $row->status, 'attempts' => $row->attempts, 'result' => $row->result];
        if ($wpdb->update($table, ['status' => 'pending', 'attempts' => 0, 'context' => wp_json_encode($context), 'result' => 'Nova série autorizada após conferência do transporte.'], ['id' => $id, 'status' => $row->status, 'attempts' => $row->attempts]) !== 1) wp_die('Notificação alterada. Recarregue.', '', ['response' => 409]);
        if (!wp_next_scheduled('rak_notification_send', [$id])) wp_schedule_single_event(time() + 5, 'rak_notification_send', [$id]);
        wp_safe_redirect(admin_url('edit.php?post_type=corrida&page=rak-requests&view=exceptions')); exit;
    }
    public static function renderIssues(): void {
        if ((int) get_option('rak_schema_version') < 6 || !current_user_can(RequestOperations::CAPABILITY)) return;
        global $wpdb; $table = Accounts::table('notifications');
        $rows = $wpdb->get_results("SELECT * FROM $table WHERE status IN ('failed','uncertain') ORDER BY id DESC LIMIT 30");
        if (!$rows) return;
        echo '<details><summary>Notificações que exigem intervenção</summary>';
        foreach ($rows as $row) {
            printf('<form method="post" action="%s"><p>%s · %s · %s · solicitação %d · %s</p><input type="hidden" name="action" value="rak_notification_retry"><input type="hidden" name="notification" value="%d">', esc_url(admin_url('admin-post.php')), esc_html($row->subject), esc_html($row->recipient), esc_html($row->status), $row->request_id, esc_html($row->result), $row->id);
            wp_nonce_field('rak_notification_retry_' . $row->id);
            echo '<label><input type="checkbox" name="confirmed" value="yes" required> Conferi que não houve entrega no transporte.</label><button class="button">Tentar envio novamente</button></form>';
        }
        echo '</details>';
    }
    public static function enqueue(string $event, int $request, string $to, string $subject, string $body, array $context = []): int {
        if ((int) get_option('rak_schema_version') < 6 || !is_email($to)) return 0;
        global $wpdb; $table = Accounts::table('notifications'); $key = hash('sha256', $event);
        $wpdb->query($wpdb->prepare("INSERT IGNORE INTO $table (event_key,request_id,actor,recipient,subject,body,context,updated_at) VALUES (%s,%d,%d,%s,%s,%s,%s,%s)",
            $key, $request, get_current_user_id(), $to, $subject, $body, wp_json_encode($context), gmdate('Y-m-d H:i:s')));
        $record = $wpdb->get_row($wpdb->prepare("SELECT id,status FROM $table WHERE event_key=%s", $key));
        $id = (int) ($record->id ?? 0);
        if ($id && $record->status === 'pending' && !wp_next_scheduled('rak_notification_send', [$id])) wp_schedule_single_event(time() + 5, 'rak_notification_send', [$id]);
        return $id;
    }
    public static function alert(string $key, string $message, int $request = 0): void {
        self::enqueue('alert:' . $key . ':' . gmdate('Y-m-d'), $request, get_option('admin_email'),
            'Intervenção necessária — Re Almeida Kits', '<p>' . esc_html($message) . '</p>' . TransactionalMail::button(admin_url('edit.php?post_type=corrida&page=rak-requests&view=exceptions'), 'Abrir Central Operacional'));
    }
    public static function send(int $id): void {
        global $wpdb; $table = Accounts::table('notifications');
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id=%d", $id));
        if (!$row || $row->status !== 'pending' || (int) $row->attempts >= 5) return;
        $context = json_decode($row->context, true) ?: [];
        if (isset($context['voucherLine'])) {
            $request = KitOrderRepository::get((int) $row->request_id);
            if (!$request || is_wp_error(Vouchers::sync($request))) return;
            $voucher = VoucherRepository::get((int) $row->request_id, (int) $context['voucherLine']);
            if (!$voucher || $voucher->state !== 'released') {
                $wpdb->update($table, ['status' => 'suppressed', 'result' => 'Voucher deixou de estar liberado antes do envio.'], ['id' => $id, 'status' => 'pending']); return;
            }
        }
        if ($wpdb->update($table, ['status' => 'sending', 'attempts' => (int) $row->attempts + 1, 'updated_at' => gmdate('Y-m-d H:i:s')], ['id' => $id, 'status' => 'pending', 'attempts' => $row->attempts]) !== 1) return;
        try {
            $sent = TransactionalMail::deliver($row->recipient, $row->subject, $row->body);
            $state = $sent ? 'sent' : ((int) $row->attempts >= 4 ? 'failed' : 'pending');
            $result = $sent ? 'Aceito pelo transporte.' : 'Envio recusado pelo transporte.';
        } catch (\Throwable) { $state = 'uncertain'; $result = 'Resultado incerto; conferir transporte antes de reenviar.'; }
        $wpdb->update($table, ['status' => $state, 'result' => $result, 'updated_at' => gmdate('Y-m-d H:i:s')], ['id' => $id, 'status' => 'sending']);
        if ($state === 'pending') wp_schedule_single_event(time() + 60 * (2 ** ((int) $row->attempts + 1)), 'rak_notification_send', [$id]);
        if (in_array($state, ['failed', 'uncertain'], true) && $row->recipient !== get_option('admin_email')) self::alert('mail:' . $id, 'Notificação ' . $id . ' exige conferência do transporte.', (int) $row->request_id);
    }
    public static function recover(): void {
        if ((int) get_option('rak_schema_version') < 6) return;
        global $wpdb; $table = Accounts::table('notifications');
        $wpdb->query($wpdb->prepare("UPDATE $table SET status='uncertain', result='Envio interrompido; conferir transporte.' WHERE status='sending' AND updated_at<%s", gmdate('Y-m-d H:i:s', time() - 900)));
        foreach ($wpdb->get_col("SELECT id FROM $table WHERE status='pending' AND attempts<5 LIMIT 100") as $id) {
            if (!wp_next_scheduled('rak_notification_send', [(int) $id])) wp_schedule_single_event(time() + 60, 'rak_notification_send', [(int) $id]);
        }
        foreach ($wpdb->get_results($wpdb->prepare("SELECT id,request_id FROM $table WHERE status IN ('failed','uncertain') AND recipient<>%s LIMIT 30", get_option('admin_email'))) as $issue) self::alert('mail:' . $issue->id, 'Notificação ' . $issue->id . ' exige conferência na Central.', (int) $issue->request_id);
        // Reconstruct missing outbox entries from the durable operational audit after a crash.
        $cursor = (int) get_option('rak_notification_cursor', 0); $requests = Accounts::table('requests');
        $rows = $wpdb->get_results($wpdb->prepare("SELECT * FROM $requests WHERE id>%d ORDER BY id LIMIT 50", $cursor));
        foreach ($rows as $request) {
            $snapshot = json_decode($request->snapshot, true) ?: []; $lines = $snapshot['lines'] ?? [];
            foreach (RequestOperations::read($request)['audit'] ?? [] as $version => $change) {
                $index = (int) $change['line']; if (!isset($lines[$index])) continue;
                $previous = $lines[$index]; $lines[$index] = array_replace($previous, $change['after']);
                if ($change['at'] < get_option('rak_notifications_since', gmdate('c'))) continue;
                if (isset($change['after']['replacement'])) self::replacement($request, $index, $change['after']['replacement'], $lines[$index], $version + 1);
                else self::operations($request, $index, $previous, $lines[$index], $version + 1);
            }
        }
        update_option('rak_notification_cursor', count($rows) === 50 ? (int) end($rows)->id : 0, false);
    }
    public static function operations(object $row, int $index, array $before, array $after, int $version): void {
        $order = RequestQueue::order($row); if (!$order) return;
        $intro = '<p>' . esc_html($after['participant'] . ' · ' . $after['race']) . '</p>';
        $key = 'ops:' . $row->id . ':' . $index . ':' . $version;
        if (($before['bib'] ?? '') !== ($after['bib'] ?? '') && !empty($after['bib'])) self::enqueue($key . ':bib', (int) $row->id, $order->get_billing_email(), 'Número de peito atualizado — Re Almeida Kits', $intro . '<p>Número de peito: <strong>' . esc_html($after['bib']) . '</strong></p>' . TransactionalMail::button(PublicPages::url('/conta') . '?pedido=' . $row->id . '#pedido-' . $row->id, 'Consultar meu pedido'));
        $snapshot = json_decode($row->snapshot, true); [, $item] = RequestQueue::item($snapshot, $after);
        $requirements = RequestQueue::documents($item, $after);
        $changes = [];
        foreach ($after['reviews'] ?? [] as $id => $review) {
            if (($review['status'] ?? '') === 'rejected' && $review !== ($before['reviews'][$id] ?? null)) $changes[] = ($requirements[$id]['label'] ?? $id) . ': ' . TransactionalMail::safeReason($review['reason'] ?? 'Envie um novo arquivo legível.');
        }
        if (!$changes && $after['documentStatus'] === 'pending_documents' && (($before['documentStatus'] ?? '') !== $after['documentStatus'] || ($before['documentReason'] ?? '') !== ($after['documentReason'] ?? ''))) $changes[] = TransactionalMail::safeReason($after['documentReason'] ?? 'Confira os documentos indicados no pedido e envie os arquivos necessários.');
        if ($changes) self::enqueue($key . ':documents', (int) $row->id, $order->get_billing_email(), 'Regularize os documentos — Re Almeida Kits', $intro . '<p>Situação: documentação pendente.</p><p>' . esc_html(implode(' · ', $changes)) . '</p><p>Entre na conta e envie a correção no pedido indicado. O reenvio será analisado pela equipe.</p>' . TransactionalMail::button(ActionLinks::documents((int) $row->id, $index), 'Corrigir documentos'));
    }
    public static function replacement(object $row, int $index, string $requirement, array $line, int $version): void {
        $snapshot = json_decode($row->snapshot, true); [, $item] = RequestQueue::item($snapshot, $line);
        $doc = RequestQueue::documents($item, $line)[$requirement]['label'] ?? $requirement;
        self::enqueue('replacement:' . $row->id . ':' . $index . ':' . $version, (int) $row->id, get_option('admin_email'), 'Documento reenviado para análise — Re Almeida Kits',
            '<p>' . esc_html($line['participant'] . ' · ' . $line['race']) . '</p><p>Solicitação ' . (int) $row->id . ' · ' . esc_html($doc) . ' · ' . esc_html(wp_date('d/m/Y H:i')) . '</p><p>Arquivo atualizado, aguardando análise. O reenvio não significa aprovação.</p>' . TransactionalMail::button(admin_url('edit.php?post_type=corrida&page=rak-requests&previous=1&request=' . $row->id), 'Analisar na Central Operacional'));
    }
}
