<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class VoucherMail {
    public static function boot(): void {
        add_action('rak_voucher_mail', [self::class, 'send']);
        add_action('rak_reconcile_vouchers_batch', [Vouchers::class, 'reconcile']);
        add_action('rak_reconcile_vouchers', [self::class, 'recover'], 20);
        add_action('admin_post_rak_voucher_retry', [self::class, 'retry']);
        add_action('admin_post_rak_voucher_resend', [self::class, 'resend']);
    }

    public static function message(object $voucher, array $line, $order): string {
        $intro = '<p>Olá, ' . esc_html($order->get_formatted_billing_full_name()) . '!</p><p>O voucher de retirada de <strong>' . esc_html($line['participant']) . '</strong>, referente à corrida ' . esc_html($line['race']) . ', está disponível.</p><p>Apresente o voucher com QR Code à equipe na retirada.</p>';
        if ($voucher->state === 'used') return '<p>A retirada de ' . esc_html($line['participant'] . ' · ' . $line['race']) . ' já foi registrada.</p>' . TransactionalMail::button(PublicPages::url('/conta') . '?pedido=' . $voucher->request_id . '#pedido-' . $voucher->request_id, 'Consultar retirada');
        return $intro . TransactionalMail::button(ActionLinks::voucher((int) $voucher->request_id, (int) $voucher->line_index), 'Visualizar meu voucher') . '<p>Se necessário, entre com sua conta para abrir o PDF.</p><p>Para acessar depois, entre em Minha conta, abra Pedidos recentes e escolha Baixar voucher PDF.</p>';
    }

    public static function manual(int $request, int $line, string $operation, bool $confirmed) {
        if (!current_user_can(RequestOperations::CAPABILITY)) return Identity::error('Acesso restrito.', 403);
        if (!$confirmed || !wp_is_uuid($operation)) return Identity::error('Confirme o reenvio do voucher.');
        return Accounts::locked('request_ops_' . $request, static function () use ($request, $line, $operation) {
            $row = KitOrderRepository::get($request);
            if (!$row) return Identity::error('Voucher não encontrado.', 404);
            Vouchers::syncLocked($row);
            $voucher = VoucherRepository::get($request, $line); $order = RequestQueue::order($row);
            if (!$voucher || $voucher->state !== 'released' || !$order) return Identity::error('Apenas vouchers liberados podem ser reenviados.', 409);
            $snapshot = json_decode($row->snapshot, true);
            $id = NotificationQueue::enqueue('manual-voucher:' . $voucher->id . ':' . $operation, $request, $order->get_billing_email(), 'Seu voucher de retirada — Re Almeida Kits', self::message($voucher, $snapshot['lines'][$line], $order), ['voucherLine' => $line]);
            if (!$id) return Identity::error('Não foi possível registrar o reenvio.', 503);
            return $id;
        });
    }
    public static function resend(): void {
        $request = absint($_POST['request'] ?? 0); $line = absint($_POST['line'] ?? 0);
        check_admin_referer('rak_voucher_resend_' . $request . '_' . $line);
        $result = self::manual($request, $line, is_string($_POST['operation'] ?? null) ? $_POST['operation'] : '', ($_POST['confirmed'] ?? '') === 'yes');
        if (is_wp_error($result)) wp_die(esc_html($result->get_error_message()), '', ['response' => $result->get_error_data()['status']]);
        wp_safe_redirect(admin_url('edit.php?post_type=corrida&page=rak-requests&request=' . $request . '&previous=1')); exit;
    }

    public static function retry(): void {
        if (!current_user_can(RequestOperations::CAPABILITY)) wp_die('Acesso restrito.', '', ['response' => 403]);
        $id = absint($_POST['request'] ?? 0);
        $index = absint($_POST['line'] ?? 0);
        check_admin_referer('rak_voucher_retry_' . $id . '_' . $index);
        $result = Accounts::locked('request_ops_' . $id, static function () use ($id, $index) {
            global $wpdb;
            $voucher = VoucherRepository::get($id, $index);
            if (!$voucher || !in_array($voucher->mail_state, ['failed', 'uncertain'], true)) return Identity::error('Esta notificação não exige reenvio manual.', 409);
            $audit = json_decode($voucher->audit, true) ?: [];
            $audit[] = ['at' => gmdate('Y-m-d H:i:s'), 'actor' => get_current_user_id(), 'operation' => wp_generate_uuid4(),
                'from' => $voucher->state, 'to' => $voucher->state,
                'reason' => 'Nova série de envio solicitada após conferência do transporte. Anterior: ' . $voucher->mail_state . ' / ' . $voucher->mail_attempts . ' / ' . $voucher->mail_result];
            $saved = $wpdb->update(Accounts::table('vouchers'), ['mail_state' => 'pending', 'mail_attempts' => 0,
                'mail_result' => 'Nova série autorizada após conferência administrativa.', 'audit' => wp_json_encode($audit), 'revision' => (int) $voucher->revision + 1],
                ['id' => $voucher->id, 'mail_state' => $voucher->mail_state, 'revision' => $voucher->revision]);
            if ($saved !== 1) return Identity::error('Notificação alterada. Recarregue.', 409);
            self::schedule((int) $voucher->id);
            return true;
        });
        if (is_wp_error($result)) wp_die(esc_html($result->get_error_message()), '', ['response' => $result->get_error_data()['status']]);
        wp_safe_redirect(admin_url('edit.php?post_type=corrida&page=rak-requests'));
        exit;
    }

    public static function schedule(int $id, int $delay = 5): void {
        if (!wp_next_scheduled('rak_voucher_mail', [$id])) wp_schedule_single_event(time() + $delay, 'rak_voucher_mail', [$id]);
    }

    public static function recover(): void {
        if ((int) get_option('rak_schema_version') < 5) return;
        global $wpdb;
        $table = Accounts::table('vouchers');
        // An interrupted transport has an uncertain outcome: do not resend automatically.
        $wpdb->query($wpdb->prepare("UPDATE $table SET mail_state='uncertain', mail_result='Envio interrompido; conferir transporte antes de reenviar.' WHERE mail_state='sending' AND mail_at < %s", gmdate('Y-m-d H:i:s', time() - 900)));
        foreach ($wpdb->get_results("SELECT id,request_id FROM $table WHERE mail_state IN ('failed','uncertain') LIMIT 30") as $issue) NotificationQueue::alert('voucher-mail:' . $issue->id, 'Notificação automática de voucher exige conferência do transporte.', (int) $issue->request_id);
        foreach ($wpdb->get_col("SELECT id FROM $table WHERE released_at IS NOT NULL AND mail_state='pending' AND mail_attempts<5 LIMIT 100") as $id) self::schedule((int) $id, 300);
    }

    public static function send(int $id): void {
        global $wpdb;
        $table = Accounts::table('vouchers');
        $voucher = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id=%d", $id));
        if (!$voucher || !$voucher->released_at || $voucher->mail_state !== 'pending' || (int) $voucher->mail_attempts >= 5) return;
        $row = KitOrderRepository::get((int) $voucher->request_id);
        if (!$row || is_wp_error(Vouchers::sync($row))) { self::schedule($id, 60); return; }
        $voucher = VoucherRepository::get((int) $row->id, (int) $voucher->line_index);
        if (!in_array($voucher->state, ['released', 'used'], true)) return;
        $order = RequestQueue::order($row);
        $snapshot = json_decode($row->snapshot, true) ?: [];
        $line = $snapshot['lines'][$voucher->line_index] ?? null;
        if (!$order || !$line) return;
        $claimed = $wpdb->query($wpdb->prepare("UPDATE $table SET mail_state='sending',mail_attempts=mail_attempts+1,mail_at=%s WHERE id=%d AND mail_state='pending' AND mail_attempts<5", gmdate('Y-m-d H:i:s'), $id));
        if ($claimed !== 1) return;
        $subject = 'Seu voucher de retirada está disponível — Re Almeida Kits';
        $message = self::message($voucher, $line, $order);
        $sent = false;
        try {
            $sent = TransactionalMail::deliver($order->get_billing_email(), $subject, $message);
        } catch (\Throwable) {
            // A transport exception can occur after acceptance; require operator verification.
            $wpdb->update($table, ['mail_state' => 'uncertain', 'mail_result' => 'Exceção no transporte; conferir entrega antes de reenviar.'], ['id' => $id, 'mail_state' => 'sending']);
            return;
        }
        $attempts = (int) $voucher->mail_attempts + 1;
        $wpdb->update($table, ['mail_state' => $sent ? 'sent' : ($attempts >= 5 ? 'failed' : 'pending'),
            'mail_result' => $sent ? 'Aceito pelo transporte WordPress/WooCommerce.' : 'Transporte recusou o envio.'], ['id' => $id, 'mail_state' => 'sending']);
        if (!$sent && $attempts >= 5) NotificationQueue::alert('voucher-mail:' . $id, 'Notificação automática de voucher exige conferência do transporte.', (int) $row->id);
        if (!$sent && $attempts < 5) self::schedule($id, 60 * (2 ** $attempts));
    }
}
