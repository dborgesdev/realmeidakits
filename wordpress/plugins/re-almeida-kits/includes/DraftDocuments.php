<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class DraftDocuments {
    private static $download = null;

    public static function boot(): void {
        add_action('admin_init', [PrivateDocumentStore::class, 'prepareProtected']);
        add_action('rest_api_init', static function (): void {
            $permission = [RequestDrafts::class, 'permission'];
            register_rest_route('re-almeida/v1', '/account/draft/documents', [
                ['methods' => 'GET', 'permission_callback' => $permission, 'callback' => static fn() => [
                    'enabled' => PrivateDocumentStore::uploadIssue() === null,
                    'maxBytes' => PrivateDocumentStore::limit(),
                ]],
                ['methods' => 'POST', 'permission_callback' => $permission, 'callback' => [self::class, 'upload']],
            ]);
            register_rest_route('re-almeida/v1', '/account/draft/documents/(?P<token>(?:reuse-)?[a-f0-9]{32})', [
                ['methods' => 'GET', 'permission_callback' => $permission, 'callback' => [self::class, 'download']],
                ['methods' => 'DELETE', 'permission_callback' => $permission, 'callback' => [self::class, 'remove']],
            ]);
        });
        add_filter('site_status_tests', static function (array $tests): array {
            if (self::canDiagnose()) {
                $tests['direct']['rak_private_documents'] = [
                    'label' => 'Documentos privados da Re Almeida Kits',
                    'test' => [self::class, 'siteHealth'],
                ];
            }
            return $tests;
        });
        add_filter('rest_pre_serve_request', [self::class, 'serve'], 40, 3);
    }

    private static function canDiagnose(): bool {
        return current_user_can('manage_options') && current_user_can('view_site_health_checks');
    }

    public static function siteHealth(): array {
        $result = [
            'label' => 'Envio de documentos privados precisa de ajuste',
            'status' => 'critical',
            'badge' => ['label' => 'Re Almeida Kits', 'color' => 'blue'],
            'description' => '<p>Diagnóstico restrito à administração.</p>',
            'actions' => '',
            'test' => 'rak_private_documents',
        ];
        if (!self::canDiagnose()) return $result;

        [$root, $issue, $checks] = PrivateDocumentStore::diagnostic();
        $probeIssue = null;
        $checks['Criar, gravar, ler e excluir arquivo de prova'] = 'Não executado';
        if ($root) {
            $probeIssue = self::probeStorage($root);
            $checks['Criar, gravar, ler e excluir arquivo de prova'] = $probeIssue ?? 'Todas as operações passaram';
            $issue = $probeIssue ?? PrivateDocumentStore::uploadIssue();
        }
        if (PrivateDocumentStore::mode() === 'external' && (!$root || $probeIssue !== null)) {
            [$controlIssue, $controlChecks] = self::probeContentDirectory();
            $checks += $controlChecks;
            if ($controlIssue !== null) {
                $checks['Resultado da comparação'] = 'O controle também falhou. Confira a condição indicada para wp-content';
            } else {
                $checks['Resultado da comparação'] = 'O PHP realizou operações em wp-content. A falha está no acesso ou na validação da pasta privada configurada';
            }
        }
        if ($issue === null) {
            $result['label'] = PrivateDocumentStore::mode() === 'protected'
                ? 'Armazenamento privado de documentos operacional e protegido.'
                : 'PHP pode gravar documentos privados';
            $result['status'] = 'good';
        }
        $result['description'] = '<p>' . esc_html($issue ?? 'Confira também o envio autenticado e o bloqueio HTTP na hospedagem.') . '</p><ul>';
        foreach ($checks as $label => $value) {
            $result['description'] .= '<li>' . esc_html($label . ' — ' . $value) . '</li>';
        }
        $result['description'] .= '</ul>';
        return $result;
    }

    private static function probeContentDirectory(): array {
        $content = @realpath(WP_CONTENT_DIR);
        $available = $content && @is_dir($content);
        $checks = [
            'Controle em wp-content: caminho canônico' => $available ? 'Resolvido' : 'Não resolvido como diretório',
            'Controle em wp-content: permissões' => $available ? PrivateDocumentStore::directoryAccess($content) : 'Não disponíveis',
        ];
        if (!$available) {
            $issue = 'O PHP não conseguiu resolver wp-content';
        } else {
            $directory = $content . DIRECTORY_SEPARATOR . 'rak-probe-' . bin2hex(random_bytes(16));
            if (!@mkdir($directory, 0700)) {
                $issue = 'O PHP não conseguiu criar a pasta temporária em wp-content';
            } else {
                try {
                    $actual = @realpath($directory);
                    $checks['Pasta de controle temporária: caminho canônico'] = $actual === $directory ? 'Confirmado dentro de wp-content' : 'Não confirmado';
                    $checks['Pasta de controle temporária: permissões'] = $actual === $directory
                        ? PrivateDocumentStore::directoryAccess($actual) : 'Não verificadas';
                    $issue = $actual === $directory ? self::probeStorage($actual) : 'O caminho canônico da pasta de controle não foi confirmado';
                } finally {
                    if (!@rmdir($directory)) $issue = 'O PHP não conseguiu remover a pasta de controle';
                }
            }
        }
        $checks['Controle em wp-content: criação, leitura e limpeza'] = $issue ?? 'Todas as operações passaram';
        return [$issue, $checks];
    }

    private static function probeStorage(string $root): ?string {
        $path = $root . DIRECTORY_SEPARATOR . bin2hex(random_bytes(16));
        $handle = @fopen($path, 'x+b');
        if (!$handle) return 'O PHP não conseguiu criar o arquivo de prova';
        $issue = null;
        try {
            if (@fwrite($handle, 'RAK') !== 3 || !@fflush($handle)) {
                $issue = 'O PHP criou o arquivo de prova, mas não conseguiu gravá-lo';
            } elseif (@file_get_contents($path, false, null, 0, 3) !== 'RAK') {
                $issue = 'O PHP gravou o arquivo de prova, mas não conseguiu lê-lo';
            }
        } finally {
            fclose($handle);
            if (!@unlink($path)) $issue = 'O PHP não conseguiu excluir o arquivo de prova';
        }
        return $issue;
    }

    public static function upload(\WP_REST_Request $request) {
        if ((int) $request->get_header('content-length') > 0 && !$request->get_body_params() && !$request->get_file_params()) {
            $postLimit = wp_convert_hr_to_bytes(ini_get('post_max_size'));
            if ($postLimit > 0 && (int) $request->get_header('content-length') > $postLimit) {
                return Identity::error('O arquivo excede o tamanho permitido.', 413);
            }
        }
        $version = $request->get_body_params()['version'] ?? '';
        $slot = $request->get_body_params()['slot'] ?? null;
        $raceId = $request->get_body_params()['race'] ?? null;
        $requirement = $request->get_body_params()['requirement'] ?? null;
        $file = $request->get_file_params()['file'] ?? null;
        $reuse = ($request->get_body_params()['reuse'] ?? '') === '1';
        if (!is_string($version) || !preg_match('/^[1-9][0-9]{0,17}$/D', $version) ||
            !is_string($slot) || !is_string($raceId) || !is_string($requirement) ||
            ($reuse ? $requirement !== PersonalDocuments::ID || $file !== null : !is_array($file))) {
            return Identity::error('Informe a versão, o participante, a corrida e o documento.');
        }
        $owner = NativeSession::user($request);
        $created = null;
        $result = RequestDrafts::mutate($owner, (int) $version, static function ($draft) use ($owner, $slot, $raceId, $requirement, $file, $reuse, &$created) {
            if (!is_array($draft)) return Identity::error('Salve o rascunho antes de anexar documentos.', 409);
            foreach ($draft['participants'] as &$person) {
                if ($person['id'] !== $slot) continue;
                if (empty($person['directoryId'])) return Identity::error('Salve o cadastro do participante antes de anexar documentos.');
                foreach ($person['items'] as &$item) {
                    if ($item['raceId'] !== $raceId) continue;
                    $context = self::context($person, $item, $requirement);
                    // Validate that the entire request is still editable before writing to disk.
                    $valid = DraftInput::clean($owner, $draft);
                    if (is_wp_error($valid)) return $valid;
                    if (!self::required($item, $requirement)) return Identity::error('A exigência não está disponível.');
                    if (!$reuse && $requirement === PersonalDocuments::ID && !PersonalDocuments::photo($file)) {
                        return Identity::error('Envie uma foto do RG ou da CNH em JPG ou PNG.', 415);
                    }
                    $token = $reuse ? PersonalDocuments::confirm($owner, $person, $item) : PrivateDocumentStore::put($owner, $file, $context);
                    if (is_wp_error($token)) return $token;
                    $created = $token;
                    if ($requirement === PersonalDocuments::ID) {
                        foreach ($person['items'] as &$assignment) $assignment['documents'][$requirement] = $token;
                        unset($assignment);
                    } else {
                        $item['documents'][$requirement] = $token;
                    }
                    return DraftInput::clean($owner, $draft);
                }
            }
            return Identity::error('Inscrição não encontrada.', 404);
        });
        if (is_wp_error($result) && $created) {
            PersonalDocuments::forget($owner, $created);
            PrivateDocumentStore::remove($owner, $created);
        }
        return $result;
    }

    private static function required(array $item, string $requirement): bool {
        $post = get_post((int) $item['raceId']);
        if (!$post || $post->post_type !== 'corrida' || $post->post_status !== 'publish' || $post->post_password) return false;
        $race = Rest::project($post);
        foreach ($race['modalities'] ?? [] as $mode) {
            if ($mode['id'] !== $item['modality']) continue;
            foreach ($mode['documents'] as $document) {
                if ($document['id'] === $requirement && $document['requiresUpload'] !== false) return true;
            }
        }
        return false;
    }

    public static function context(array $person, array $item, string $requirement): array {
        if ($requirement === PersonalDocuments::ID) {
            return ['participant' => $person['directoryId'] ?? null, 'requirement' => $requirement,
                'cpf' => $person['person']['cpf'] ?? ''];
        }
        return [
            'participant' => $person['directoryId'] ?? null,
            'race' => $item['raceId'],
            'modality' => $item['modality'],
            'requirement' => $requirement,
        ];
    }

    public static function remove(\WP_REST_Request $request) {
        $version = $request->get_json_params()['version'] ?? null;
        if (!is_int($version)) return Identity::error('Informe a versão do rascunho.');
        $owner = NativeSession::user($request);
        $token = $request['token'];
        $result = RequestDrafts::mutate($owner, $version, static function ($draft) use ($owner, $token) {
            if (!is_array($draft) || (!PrivateDocumentStore::record($owner, $token) && !PersonalDocuments::grant($owner, $token))) {
                return Identity::error('Documento não encontrado.', 404);
            }
            $found = false;
            foreach ($draft['participants'] as &$person) {
                foreach ($person['items'] as &$item) {
                    foreach ($item['documents'] as $requirement => $id) {
                        if ($id !== $token) continue;
                        $found = true;
                        unset($item['documents'][$requirement]);
                    }
                }
                unset($item);
            }
            unset($person);
            return $found ? DraftInput::clean($owner, $draft) : Identity::error('Documento não encontrado.', 404);
        });
        return $result;
    }

    public static function download(\WP_REST_Request $request) {
        $owner = NativeSession::user($request);
        $token = $request['token'];
        $draft = RequestDrafts::load($owner)['draft'];
        $referenced = false;
        foreach ($draft->participants ?? [] as $person) {
            foreach ($person->items as $item) {
                if (in_array($token, (array) $item->documents, true)) $referenced = true;
            }
        }
        $file = ($referenced || KitOrderRepository::retains($owner, $token)) ? PrivateDocumentStore::open($owner, $token) : null;
        if (!$file) return Identity::error('Documento não encontrado.', 404);
        self::$download = $file['handle'];
        return new \WP_REST_Response(null, 200, [
            'Content-Type' => $file['mime'],
            'Content-Disposition' => 'attachment; filename="documento.' . $file['extension'] . '"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public static function serve(bool $served, $response, \WP_REST_Request $request): bool {
        if (!$served && is_resource(self::$download) &&
            str_starts_with($request->get_route(), '/re-almeida/v1/account/draft/documents/') &&
            $response->get_status() === 200) {
            if ($request->get_method() !== 'HEAD') fpassthru(self::$download);
            fclose(self::$download);
            self::$download = null;
            return true;
        }
        return $served;
    }
}
