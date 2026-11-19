<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class RequestAdmin {
    private const PAGE = 'rak-requests';
    private const NONCE = 'rak_operations';

    public static function boot(): void {
        add_action('admin_menu', static function (): void {
            $screen = add_submenu_page('edit.php?post_type=corrida', 'Solicitações', 'Solicitações', RequestOperations::CAPABILITY,
                self::PAGE, [self::class, 'render']);
            add_action('load-' . $screen, static function (): void {
                wp_enqueue_style('rak-operations', plugins_url('assets/requests.css', FILE), [], VERSION);
                wp_enqueue_script('rak-operations', plugins_url('assets/requests.js', FILE), [], VERSION, true);
            });
        });
        add_action('wp_ajax_rak_operations_save', [self::class, 'save']);
        add_action('wp_ajax_rak_operations_detail', [self::class, 'detail']);
        add_action('admin_post_rak_operations_export', [self::class, 'export']);
        add_action('admin_post_rak_request_document', [self::class, 'download']);
    }

    private static function authorize(): void {
        if (!current_user_can(RequestOperations::CAPABILITY)) wp_die('Acesso restrito.', '', ['response' => 403]);
        if (!KitOrderRepository::ready()) wp_die('A central está indisponível. Confira a instalação do plugin.', '', ['response' => 503]);
        nocache_headers();
        header('Cache-Control: private, no-store');
    }

    private static function url(array $args = []): string {
        return add_query_arg($args + ['post_type' => 'corrida', 'page' => self::PAGE], admin_url('edit.php'));
    }

    private static function text(array $source, string $key): string {
        return isset($source[$key]) && is_string($source[$key]) ? sanitize_text_field(wp_unslash($source[$key])) : '';
    }

    private static function select(string $name, string $label, array $options, string $value): void {
        printf('<label>%s<select name="%s">', esc_html($label), esc_attr($name));
        foreach ($options as $key => $text) {
            printf('<option value="%s"%s>%s</option>', esc_attr($key), selected($value, $key, false), esc_html($text));
        }
        echo '</select></label>';
    }

    public static function render(): void {
        self::authorize();
        $filters = RequestQueue::filters($_GET);
        $exceptions = self::text($_GET, 'view') === 'exceptions';
        $awaiting = self::text($_GET, 'view') === 'awaiting';
        $view = $exceptions ? 'exceptions' : ($awaiting ? 'awaiting' : '');
        $page = max(1, absint($_GET['paged'] ?? 1));
        $perPage = 30;
        $offset = ($page - 1) * $perPage;
        $entries = $races = $requests = [];
        $counts = ['Aguardando análise' => 0, 'Rejeitados' => 0, 'Retirada pendente' => 0, 'Retirados' => 0];
        $total = 0;
        $baseFilters = array_replace(RequestQueue::filters([]), array_intersect_key($filters, array_flip(['previous', 'finance_history', 'request'])));
        foreach (RequestQueue::entries($baseFilters, $exceptions, $awaiting) as $entry) {
            $line = $entry['line'];
            $races[$line['raceId']] = $line['race'] . (RequestQueue::past($line) ? ' (Anterior)' : ' (Atual/futura ou sem data)');
            if ($filters['race'] !== '' && $filters['race'] !== (string) $line['raceId']) continue;
            $requests[$entry['row']->id] = true;
            $counts['Aguardando análise'] += (int) ($line['documentStatus'] === 'pending_review');
            $counts['Rejeitados'] += (int) ($line['documentStatus'] === 'rejected');
            $counts['Retirada pendente'] += (int) ($line['pickupStatus'] !== 'collected');
            $counts['Retirados'] += (int) ($line['pickupStatus'] === 'collected');
            if (!RequestQueue::matches($entry, $filters)) continue;
            if ($total >= $offset && count($entries) < $perPage) $entries[] = $entry;
            $total++;
        }
        asort($races);
        printf('<div class="wrap rak-operations" data-ajax="%s" data-nonce="%s"><h1>Central de retirada de kits</h1>',
            esc_url(admin_url('admin-ajax.php')), esc_attr(wp_create_nonce(self::NONCE)));
        printf('<nav class="nav-tab-wrapper" aria-label="Visões"><a class="nav-tab%s" href="%s">Pagamentos confirmados</a><a class="nav-tab%s" href="%s">Exceções financeiras</a></nav>',
            $exceptions || $awaiting ? '' : ' nav-tab-active', esc_url(self::url()), $exceptions ? ' nav-tab-active' : '', esc_url(self::url(['view' => 'exceptions'])));
        printf('<p><a class="button" href="%s">Analisar documentos antes do pagamento</a> <a class="button" href="%s">Conferir vouchers e registrar retirada</a></p>', esc_url(self::url(['view' => 'awaiting'])), esc_url(admin_url('admin.php?page=rak-pickup')));
        NotificationQueue::renderIssues();
        if (!$exceptions) {
            echo '<div class="rak-metrics">';
            foreach ([$awaiting ? 'Solicitações aguardando pagamento' : 'Solicitações pagas' => count($requests)] + $counts as $label => $count) {
                printf('<div><strong>%d</strong><span>%s</span></div>', $count, esc_html($label));
            }
            echo '</div>';
        }
        printf('<form method="get" class="rak-controls"><input type="hidden" name="post_type" value="corrida"><input type="hidden" name="page" value="%s"><input type="hidden" name="view" value="%s">',
            esc_attr(self::PAGE), esc_attr($view));
        printf('<label>Nome, CPF, inscrição ou titular<input name="q" type="search" value="%s"></label>', esc_attr($filters['q']));
        self::select('race', 'Corrida', ['' => 'Todas'] + $races, $filters['race']);
        self::select('modality', 'Modalidade', ['' => 'Todas', 'oficial' => 'Kit Oficial', 'appai' => 'APPAI'], $filters['modality']);
        self::select('documents', 'Documentos', ['' => 'Todos'] + RequestOperations::DOCUMENTS, $filters['documents']);
        self::select('pickup', 'Retirada', ['' => 'Todas'] + RequestOperations::PICKUP, $filters['pickup']);
        self::select('voucher', 'Voucher', ['' => 'Todos'] + Vouchers::STATES, $filters['voucher']);
        printf('<label><input type="checkbox" name="previous" value="1"%s> Mostrar corridas anteriores</label>', checked($filters['previous'], '1', false));
        if ($exceptions || $awaiting) printf('<label><input type="checkbox" name="finance_history" value="1"%s> Incluir tentativas fora do período de solicitações</label>', checked($filters['finance_history'], '1', false));
        if ($filters['request'] !== '') printf('<input type="hidden" name="request" value="%d">', absint($filters['request']));
        echo '<button class="button">Filtrar</button></form>';
        if (!$exceptions) {
            printf('<form method="post" id="rak-export" action="%s" class="rak-controls"><input type="hidden" name="action" value="rak_operations_export">', esc_url(admin_url('admin-post.php')));
            wp_nonce_field(self::NONCE, '_wpnonce', false);
            printf('<input type="hidden" name="view" value="%s">', esc_attr($view));
            foreach ($filters as $key => $value) printf('<input type="hidden" name="%s" value="%s">', esc_attr($key), esc_attr($value));
            echo '<button class="button" name="format" value="all">Exportar filtros (.xlsx)</button><button class="button" name="format" value="selected">Exportar selecionados</button><button class="button" name="format" value="files">Baixar anexos selecionados (.zip)</button>';
            echo '<button type="button" class="button" data-batch="approve">Aprovar selecionados</button>';
            self::select('batchPickup', 'Preparação do kit em lote', array_diff_key(RequestOperations::PICKUP, ['collected' => true]), 'pending');
            echo '<button type="button" class="button" data-batch="pickup">Aplicar preparação</button></form>';
        }
        echo '<p role="status" id="rak-feedback"></p>';
        if (!$entries) echo '<p class="rak-empty">Nenhum participante encontrado nesta visão.</p>';
        else {
            echo '<div class="rak-table"><table class="widefat striped"><thead><tr>';
            if (!$exceptions) echo '<th><input type="checkbox" aria-label="Selecionar página" id="rak-select-all"></th>';
            foreach (['Participante e titular', 'Corrida e modalidade', 'Inscrição', 'Nº de peito', 'Documentos', 'Retirada', 'Voucher', 'Pagamento', 'Ações'] as $heading) printf('<th scope="col">%s</th>', esc_html($heading));
            echo '</tr></thead><tbody>';
            foreach ($entries as $entry) self::row($entry, $exceptions);
            echo '</tbody></table></div>';
        }
        $pages = max(1, (int) ceil($total / $perPage));
        printf('<p>%d participantes · Página %d de %d</p><nav aria-label="Paginação">', $total, $page, $pages);
        foreach (['Anterior' => $page - 1, 'Próxima' => $page + 1] as $label => $target) {
            if ($target >= 1 && $target <= $pages) printf('<a class="button" href="%s">%s</a> ', esc_url(self::url($filters + ['paged' => $target, 'view' => $view])), esc_html($label));
        }
        echo '</nav><dialog id="rak-detail" aria-label="Documentos e histórico"><button type="button" class="button" data-close>Fechar</button><div data-content></div></dialog></div>';
    }

    private static function row(array $entry, bool $exceptions): void {
        $line = $entry['line'];
        $id = (int) $entry['row']->id;
        $index = (int) $entry['index'];
        printf('<tr data-request="%d" data-line="%d" data-version="%d">', $id, $index, $entry['version']);
        if (!$exceptions) printf('<td><input type="checkbox" form="rak-export" name="selected[]" value="%d:%d" aria-label="%s"></td>', $id, $index, esc_attr('Selecionar ' . $line['participant']));
        printf('<td><strong>%s</strong>%s</td><td>%s<small>%s</small></td><td>%s</td>', esc_html($line['participant']),
            $entry['holder'] && $entry['holder'] !== $line['participant'] ? '<small>Titular: ' . esc_html($entry['holder']) . '</small>' : '',
            esc_html($line['race']), esc_html($line['modality'] === 'appai' ? 'APPAI' : 'Kit Oficial'), esc_html($entry['registration'] ?: '—'));
        if ($exceptions) {
            printf('<td>%s</td><td>%s</td><td>%s</td>', esc_html($line['bib'] ?? '—'), esc_html(RequestOperations::DOCUMENTS[$line['documentStatus']]), esc_html(RequestOperations::PICKUP[$line['pickupStatus']]));
        } else {
            printf('<td><input class="rak-bib" name="bib" aria-label="Número de peito" maxlength="32" value="%s"></td><td>', esc_attr($line['bib'] ?? ''));
            self::select('documentStatus', 'Situação documental', RequestOperations::DOCUMENTS, $line['documentStatus']);
            printf('<label>Motivo da pendência (será enviado ao titular)<input name="documentReason" maxlength="500" value="%s"></label>', esc_attr($line['documentReason'] ?? ''));
            echo '</td><td>';
            self::select('pickupStatus', 'Situação de retirada', $line['pickupStatus'] === 'collected' ? ['collected' => 'Retirado'] : array_diff_key(RequestOperations::PICKUP, ['collected' => true]), $line['pickupStatus']);
            echo '</td>';
        }
        $voucher = $entry['voucher'] ?? null;
        printf('<td>%s<small>%s</small>%s</td>', esc_html(Vouchers::STATES[$voucher->state ?? 'blocked']), esc_html($voucher->reason ?? 'Aguardando processamento.'),
            $voucher && $voucher->collected_at ? '<small>' . esc_html($voucher->collected_at . ' UTC · funcionário ' . $voucher->collected_by) . '</small>' : '');
        printf('<td>%s<small><a href="%s">Pedido %s</a>%s</small></td><td><button type="button" class="button" data-detail>Documentos e histórico</button>',
            esc_html($entry['order']->get_date_paid()?->date_i18n('d/m/Y H:i') ?? '—'),
            esc_url($entry['order']->get_edit_order_url()), esc_html($entry['order']->get_order_number()),
            $exceptions ? ' · ' . esc_html(wc_get_order_status_name($entry['order']->get_status())) : '');
        if (!$exceptions) echo ' <button type="button" class="button button-primary" data-save>Salvar</button>';
        printf('<p>Total do pedido: %s · Criado em %s</p>', wp_kses_post(wc_price($entry['order']->get_total())), esc_html($entry['order']->get_date_created()?->date_i18n('d/m/Y H:i') ?? '—'));
        if ($exceptions && RequestFinance::payable($entry['row'], $entry['order'])) printf('<p><a href="%s">Retomar pagamento</a></p>', esc_url($entry['order']->get_checkout_payment_url()));
        echo '</td></tr>';
    }

    private static function lookup(array $input): array {
        $row = KitOrderRepository::get(absint($input['request'] ?? 0));
        $index = filter_var($input['line'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
        $snapshot = $row ? json_decode($row->snapshot, true) : [];
        if ($index === false || !isset($snapshot['lines'][$index])) wp_send_json_error('Inscrição não encontrada.', 404);
        return [$row, $index, $snapshot];
    }

    public static function save(): void {
        self::authorize();
        check_ajax_referer(self::NONCE);
        [$row, $index, $snapshot] = self::lookup($_POST);
        $line = RequestOperations::lines($row, $snapshot)[$index];
        $mode = self::text($_POST, 'mode');
        $bib = self::text($_POST, 'bib');
        $patch = [
            'documentReason' => $mode === '' ? self::text($_POST, 'documentReason') : ($line['documentReason'] ?? ''),
            'bib' => $mode === '' ? ($bib === '' ? null : $bib) : ($line['bib'] ?? null),
            'documentStatus' => match ($mode) { 'approve' => 'approved', 'pickup', 'review' => $line['documentStatus'], default => self::text($_POST, 'documentStatus') },
            'pickupStatus' => in_array($mode, ['approve', 'review'], true) ? $line['pickupStatus'] : self::text($_POST, 'pickupStatus'),
        ];
        if ($mode === 'review') $patch['review'] = ['id' => self::text($_POST, 'document'), 'status' => self::text($_POST, 'decision'), 'reason' => self::text($_POST, 'reason')];
        if (strlen($patch['bib'] ?? '') > 32 || strlen($patch['review']['reason'] ?? '') > 500) wp_send_json_error('Texto acima do limite.', 400);
        $result = RequestOperations::update($row, $index, (int) ($_POST['version'] ?? -1), $patch);
        if (is_wp_error($result)) wp_send_json_error($result->get_error_message(), $result->get_error_data()['status']);
        $state = RequestOperations::read($row);
        $line = RequestOperations::lines($row, $snapshot)[$index];
        wp_send_json_success(['version' => $state['version'], 'documentStatus' => $line['documentStatus'], 'pickupStatus' => $line['pickupStatus']]);
    }

    public static function detail(): void {
        self::authorize();
        check_ajax_referer(self::NONCE);
        [$row, $index, $snapshot] = self::lookup($_POST);
        $state = RequestOperations::read($row);
        $line = array_replace($snapshot['lines'][$index], $state['lines'][$index] ?? []);
        [, $item] = RequestQueue::item($snapshot, $line);
        $order = RequestQueue::order($row);
        $paid = $order && !$order->has_status(['cancelled', 'refunded', 'failed']) && (float) $order->get_total_refunded() === 0.0;
        ob_start();
        printf('<h2>%s</h2><p>%s</p><h3>Documentos</h3>', esc_html($line['participant']), esc_html($line['race']));
        $requirements = RequestQueue::documents($item, $line);
        foreach ($requirements + array_fill_keys(array_keys($item['documents'] ?? []), []) as $id => $requirement) {
            $token = $item['documents'][$id] ?? '';
            $grant = PersonalDocuments::grant((int) $row->owner_id, $token);
            $record = $grant ? PrivateDocumentStore::record((int) $grant['owner'], $grant['token']) : PrivateDocumentStore::record((int) $row->owner_id, $token);
            $review = $line['reviews'][$id] ?? [];
            printf('<section class="rak-doc"><h4>%s</h4><p>%s</p>', esc_html($requirement['label'] ?? (string) $id),
                esc_html(!$record ? 'Sem arquivo disponível' : (RequestOperations::DOCUMENTS[$review['status'] ?? 'pending_review'] ?? 'Aguardando análise')));
            if ($record) {
                if ($grant) printf('<p>Identificação reutilizada · confirmação %s</p>', esc_html($grant['at']));
                $url = self::documentUrl((int) $row->id, $token);
                printf('<p>%s · %s</p><p><a href="%s" target="_blank" rel="noopener">Visualizar</a> · <a href="%s">Baixar</a></p>',
                    esc_html($record['name'] ?? 'Documento protegido'), esc_html($record['uploadedAt'] ?? 'Data de envio indisponível'),
                    esc_url(add_query_arg('inline', '1', $url)), esc_url($url));
                if ($paid) printf('<form data-review><input type="hidden" name="document" value="%s"><label>Justificativa da rejeição <input name="reason" maxlength="500" value="%s"></label> <button class="button" name="decision" value="approved">Aprovar</button> <button class="button" name="decision" value="rejected">Rejeitar</button></form>',
                    esc_attr($id), esc_attr($review['reason'] ?? ''));
            }
            echo '</section>';
        }
        if (!$requirements && empty($item['documents'])) echo '<p>Sem exigências ou anexos registrados.</p>';
        echo '<h3>Histórico</h3>';
        Vouchers::sync($row);
        $voucher = VoucherRepository::get((int) $row->id, $index);
        if ($voucher) {
            if ($voucher->state === 'released') {
                printf('<form method="post" action="%s" data-rak-confirm="Reenviar este voucher ao e-mail do titular?"><input type="hidden" name="action" value="rak_voucher_resend"><input type="hidden" name="request" value="%d"><input type="hidden" name="line" value="%d"><input type="hidden" name="operation" value="%s">', esc_url(admin_url('admin-post.php')), $row->id, $index, esc_attr(wp_generate_uuid4()));
                wp_nonce_field('rak_voucher_resend_' . $row->id . '_' . $index);
                echo '<label><input type="checkbox" name="confirmed" value="yes" required> Confirmo o reenvio ao titular.</label><button class="button">Reenviar voucher</button></form>';
            }
            printf('<h4>Voucher %d · %s</h4><p>%s</p><p>Notificação: %s · %d tentativa(s) · %s</p>', $voucher->id, esc_html(Vouchers::STATES[$voucher->state]), esc_html($voucher->reason), esc_html($voucher->mail_state), $voucher->mail_attempts, esc_html($voucher->mail_result));
            if (in_array($voucher->mail_state, ['failed', 'uncertain'], true)) {
                printf('<form method="post" action="%s"><input type="hidden" name="action" value="rak_voucher_retry"><input type="hidden" name="request" value="%d"><input type="hidden" name="line" value="%d">', esc_url(admin_url('admin-post.php')), $row->id, $index);
                wp_nonce_field('rak_voucher_retry_' . $row->id . '_' . $index);
                echo '<p>Confira primeiro no transporte se a mensagem foi entregue. Reenviar uma mensagem já aceita pode duplicar o e-mail.</p><button class="button">Conferi o transporte: tentar envio novamente</button></form>';
            }
            foreach (json_decode($voucher->audit, true) ?: [] as $event) printf('<p>%s UTC · funcionário %d · %s → %s · %s · operação %s</p>', esc_html($event['at']), $event['actor'], esc_html($event['from']), esc_html($event['to']), esc_html($event['reason']), esc_html($event['operation']));
        }
        if ($order) {
            RequestFinance::form($row, $order);
            printf('<p>WooCommerce · %s · confirmação %s</p>', esc_html(wc_get_order_status_name($order->get_status())), esc_html($order->get_date_paid()?->date_i18n('d/m/Y H:i') ?? '—'));
            foreach (wc_get_order_notes(['order_id' => $order->get_id(), 'type' => 'internal', 'limit' => 30]) as $note) {
                printf('<p>%s · %s · %s</p>', esc_html($note->date_created->date_i18n('d/m/Y H:i')), esc_html($note->added_by), esc_html(wp_strip_all_tags($note->content)));
            }
        }
        if ((int) get_option('rak_schema_version') >= 6) {
            global $wpdb; $mailTable = Accounts::table('notifications');
            foreach ($wpdb->get_results($wpdb->prepare("SELECT actor,recipient,subject,status,attempts,updated_at,result FROM $mailTable WHERE request_id=%d ORDER BY id DESC LIMIT 30", $row->id)) as $mail) printf('<p>Notificação: %s · %s · %s · %d tentativa(s) · %s UTC · operador %d · %s</p>', esc_html($mail->subject), esc_html($mail->recipient), esc_html($mail->status), $mail->attempts, esc_html($mail->updated_at), $mail->actor, esc_html($mail->result));
        }
        foreach (array_reverse($state['audit']) as $change) {
            if ((int) $change['line'] !== $index) continue;
            $after = $change['after'];
            $reasons = array_filter(array_column($after['reviews'] ?? [], 'reason'));
            printf('<p>%s UTC · operador %d · %s</p>', esc_html($change['at']), $change['actor'],
                esc_html(implode(' · ', array_filter([$after['bib'] ?? '', RequestOperations::DOCUMENTS[$after['documentStatus'] ?? ''] ?? '', RequestOperations::PICKUP[$after['pickupStatus'] ?? ''] ?? '', ...$reasons]))));
            if (!empty($after['replacement'])) {
                echo '<p>Substituição de documento registrada.</p>';
                $previous = $change['before']['reference'] ?? '';
                if ($previous) printf('<p><a href="%s">Baixar versão anterior</a></p>', esc_url(self::documentUrl((int) $row->id, $previous)));
            }
        }
        wp_send_json_success(['html' => ob_get_clean(), 'version' => $state['version']]);
    }

    public static function export(): void {
        self::authorize();
        check_admin_referer(self::NONCE);
        $format = self::text($_POST, 'format');
        if (!in_array($format, ['all', 'selected', 'files'], true)) wp_die('Formato inválido.', '', ['response' => 400]);
        $selected = [];
        foreach (array_slice((array) ($_POST['selected'] ?? []), 0, 30) as $value) {
            if (is_string($value) && preg_match('/^[1-9]\d*:\d+$/D', $value)) $selected[$value] = true;
        }
        if ($format !== 'all' && !$selected) wp_die('Selecione participantes.', '', ['response' => 400]);
        $entries = RequestQueue::entries(RequestQueue::filters($_POST), false, self::text($_POST, 'view') === 'awaiting');
        $matching = static function () use ($entries, $format, $selected): \Generator {
            foreach ($entries as $entry) {
                if ($format === 'all' || isset($selected[$entry['row']->id . ':' . $entry['index']])) yield $entry;
            }
        };
        RequestExport::send($matching(), $format === 'files');
    }

    public static function download(): void {
        self::authorize();
        $id = absint($_GET['request'] ?? 0);
        $token = self::text($_GET, 'token');
        check_admin_referer('rak_document_' . $id . '_' . $token);
        $row = KitOrderRepository::get($id);
        $snapshot = $row ? json_decode($row->snapshot, true) : null;
        $lines = $row ? RequestOperations::lines($row, $snapshot ?: []) : [];
        $referenced = false;
        foreach ($lines as $line) {
            [, $item] = RequestQueue::item($snapshot, $line);
            if (in_array($token, $item['documents'] ?? [], true)) $referenced = true;
        }
        if ($row && !$referenced) {
            foreach (RequestOperations::read($row)['audit'] as $change) {
                if (($change['before']['reference'] ?? null) === $token) $referenced = true;
            }
        }
        $file = $referenced ? PersonalDocuments::openForRequest((int) $row->owner_id, $token, true) : null;
        if ($file) {
            header('Content-Type: ' . $file['mime']);
            header('Content-Disposition: ' . (isset($_GET['inline']) ? 'inline' : 'attachment') . '; filename="documento.' . $file['extension'] . '"');
            header('X-Content-Type-Options: nosniff');
            header("Content-Security-Policy: sandbox; default-src 'none'");
            fpassthru($file['handle']);
            fclose($file['handle']);
            exit;
        }
        wp_die('Documento não encontrado.', '', ['response' => 404]);
    }

    private static function documentUrl(int $id, string $token): string {
        return wp_nonce_url(add_query_arg(['action' => 'rak_request_document', 'request' => $id, 'token' => $token],
            admin_url('admin-post.php')), 'rak_document_' . $id . '_' . $token);
    }
}
