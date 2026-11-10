<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class RequestDrafts {
    private const KEY = '_rak_request_draft_v1';

    public static function boot(): void {
        add_action('rest_api_init', static function (): void {
            register_rest_route('re-almeida/v1', '/account/draft', [
                ['methods' => 'GET', 'permission_callback' => [self::class, 'permission'],
                    'callback' => static fn($request) => self::load(NativeSession::user($request))],
                ['methods' => 'PUT', 'permission_callback' => [self::class, 'permission'],
                    'callback' => [self::class, 'save']],
            ]);
            register_rest_route('re-almeida/v1', '/account/draft/reset', [
                'methods' => 'POST', 'permission_callback' => [self::class, 'permission'],
                'callback' => static function ($request) {
                    $version = $request->get_json_params()['version'] ?? null;
                    if (!is_int($version)) return Identity::error('Informe a versão do rascunho.');
                    return self::mutate(NativeSession::user($request), $version, static fn() => null, true);
                },
            ]);
        });
    }

    public static function permission(\WP_REST_Request $request) {
        return NativeSession::user($request) ? true : Identity::error('Entre na sua conta para continuar.', 401);
    }

    public static function load(int $owner): array {
        $stored = get_user_meta($owner, self::KEY, true);
        $decoded = is_string($stored) ? json_decode($stored) : null;
        if (!is_object($decoded) || !isset($decoded->version)) return ['version' => 0, 'draft' => null];
        $result = (array) $decoded;
        if (KitOrderRepository::ready() && !empty($result['key'])) {
            $result['submitted'] = (bool) KitOrderRepository::find($owner, $result['key']);
        }
        return $result;
    }

    public static function save(\WP_REST_Request $request) {
        if (strlen($request->get_body()) > 196608) return Identity::error('Rascunho excede o limite permitido.', 413);
        $data = $request->get_json_params();
        if (!is_array($data) || !is_int($data['version'] ?? null) || !is_array($data['draft'] ?? null)) {
            return Identity::error('Envie um rascunho e sua versão.');
        }
        $owner = NativeSession::user($request);
        return self::mutate($owner, $data['version'], static fn() => DraftInput::clean($owner, $data['draft']));
    }

    private static function tokens(?array $draft): array {
        $tokens = [];
        foreach ($draft['participants'] ?? [] as $person) {
            foreach ($person['items'] as $item) {
                foreach ((array) $item['documents'] as $token) {
                    $tokens[] = $token;
                }
            }
        }
        return $tokens;
    }

    public static function mutate(int $owner, int $version, callable $change, bool $reset = false) {
        return Accounts::locked('draft_' . $owner, static function () use ($owner, $version, $change, $reset) {
            $raw = get_user_meta($owner, self::KEY, true);
            $current = self::load($owner);
            if ($current['version'] !== $version) {
                return Identity::error('O rascunho mudou em outra aba. Recarregue para ver a versão salva.', 409);
            }
            if (!$reset && !empty($current['submitted'])) return Identity::error('Este rascunho já foi enviado. Inicie uma nova solicitação.', 409);
            $previous = is_string($raw) ? (json_decode($raw, true)['draft'] ?? null) : null;
            $draft = $change($previous);
            if (is_wp_error($draft)) return $draft;
            $next = [
                'version' => $current['version'] + 1,
                'key' => $reset ? wp_generate_uuid4() : ($current['key'] ?? wp_generate_uuid4()),
                'draft' => $draft,
            ];
            $encoded = wp_json_encode($next);
            if ($encoded === false) return Identity::error('Não foi possível codificar o rascunho.', 500);
            $written = $current['version'] === 0
                ? add_user_meta($owner, self::KEY, wp_slash($encoded), true)
                : update_user_meta($owner, self::KEY, wp_slash($encoded), $raw);
            if (!$written) return Identity::error('Não foi possível gravar o rascunho. Recarregue antes de tentar novamente.', 409);
            foreach (array_diff(self::tokens($previous), self::tokens($draft)) as $token) {
                PersonalDocuments::forget($owner, $token);
                PrivateDocumentStore::remove($owner, $token);
            }
            return $next;
        });
    }
}
