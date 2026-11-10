<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class PersonalDocuments {
    public const ID = 'rak-personal-identity';
    private const PROFILE = '_rak_personal_identity';
    private const GRANT = '_rak_identity_grant_';

    public static function requirement(string $modality): array {
        return ['id' => self::ID, 'label' => 'RG ou CNH com foto', 'scope' => 'personal', 'modality' => $modality,
            'required' => true, 'guidance' => 'Envie apenas um documento de identificação com foto, em JPG ou PNG.',
            'requiresUpload' => true, 'purpose' => 'Identificação pessoal', 'version' => 1, 'template' => null];
    }

    public static function boot(): void {
        add_action('rest_api_init', static function (): void {
            $permission = [RequestDrafts::class, 'permission'];
            register_rest_route('re-almeida/v1', '/account/identity-document', [
                ['methods' => 'GET', 'permission_callback' => $permission, 'callback' => static function ($request) {
                    $owner = NativeSession::user($request);
                    $token = get_user_meta($owner, self::PROFILE, true);
                    $record = is_string($token) ? PrivateDocumentStore::record($owner, $token) : null;
                    return ['registered' => (bool) $record, 'status' => $record ? (self::rejected($owner, $token) ? 'rejected' : 'received') : null,
                        'maxBytes' => PrivateDocumentStore::limit()];
                }],
                ['methods' => 'POST', 'permission_callback' => $permission, 'callback' => [self::class, 'upload']],
            ]);
            register_rest_route('re-almeida/v1', '/account/draft/identity-availability', [
                'methods' => 'POST', 'permission_callback' => $permission, 'callback' => [self::class, 'availability'],
            ]);
        });
    }

    private static function ownerForCpf(string $cpf): int {
        if (!Identity::cpf($cpf)) return 0;
        global $wpdb;
        $table = Accounts::table('identities');
        return (int) $wpdb->get_var($wpdb->prepare("SELECT user_id FROM $table WHERE cpf=%s", $cpf));
    }

    public static function upload(\WP_REST_Request $request) {
        $owner = NativeSession::user($request);
        $cpf = Identity::digits(Accounts::profile($owner)['cpf']);
        if (Identity::cpf($cpf) && !self::ownerForCpf($cpf)) {
            Accounts::locked('identity', static fn() => Accounts::claim($cpf, $owner));
        }
        if (self::ownerForCpf($cpf) !== $owner) return Identity::error('Confirme o CPF no cadastro do titular antes de enviar.', 409);
        $file = $request->get_file_params()['file'] ?? null;
        if (!is_array($file) || !self::photo($file)) return Identity::error('Envie uma foto do RG ou da CNH em JPG ou PNG.', 415);
        return Accounts::locked('personal_document_' . $owner, static function () use ($owner, $file, $cpf) {
            $token = PrivateDocumentStore::put($owner, $file, ['kind' => self::ID, 'cpf' => $cpf]);
            if (is_wp_error($token)) return $token;
            if (!update_user_meta($owner, self::PROFILE, $token)) {
                PrivateDocumentStore::remove($owner, $token);
                return Identity::error('Não foi possível salvar o documento pessoal.', 503);
            }
            // Old identity files may be referenced by grants in other accounts.
            return ['registered' => true, 'status' => 'received', 'maxBytes' => PrivateDocumentStore::limit()];
        });
    }

    public static function photo(array $file): bool {
        return is_string($file['name'] ?? null) && preg_match('/\.(?:jpe?g|png)$/iD', $file['name']);
    }

    private static function rejected(int $owner, string $token): bool {
        return (bool) get_user_meta($owner, '_rak_identity_rejected_' . $token, true);
    }

    public static function rejectSource(int $owner, string $reference): void {
        $grant = self::grant($owner, $reference);
        if ($grant) {
            update_user_meta((int) $grant['owner'], '_rak_identity_rejected_' . $grant['token'], true);
        } elseif (PrivateDocumentStore::record($owner, $reference)) {
            update_user_meta($owner, '_rak_identity_rejected_' . $reference, true);
        }
    }

    private static function source(string $cpf, int $requester): ?array {
        $owner = self::ownerForCpf($cpf);
        if (!$owner && Identity::digits(Accounts::profile($requester)['cpf']) === $cpf) $owner = $requester;
        if (!$owner) return null;
        $token = get_user_meta($owner, self::PROFILE, true);
        if (is_string($token) && $token !== '') {
            // An explicit replacement in Minha conta is authoritative, including its rejection.
            return self::usable($owner, $token, $cpf) ? ['owner' => $owner, 'token' => $token] : null;
        }
        if (!KitOrderRepository::ready()) return null;
        $before = 0;
        do {
            $rows = KitOrderRepository::rows($owner, $before);
            foreach ($rows as $row) {
                $before = (int) $row->id;
                if (!$row->order_id) continue;
                $snapshot = json_decode($row->snapshot, true) ?: [];
                foreach (RequestOperations::lines($row, $snapshot) as $line) {
                    [$person, $item] = RequestQueue::item($snapshot, $line);
                    $candidate = $item['documents'][self::ID] ?? '';
                    if (($person['cpf'] ?? '') !== $cpf || !$candidate ||
                        ($line['reviews'][self::ID]['status'] ?? '') === 'rejected') continue;
                    if (self::usable($owner, $candidate, $cpf)) return ['owner' => $owner, 'token' => $candidate];
                }
            }
        } while (count($rows) === 20);
        return null;
    }

    private static function usable(int $owner, string $token, string $cpf): bool {
        $record = PrivateDocumentStore::record($owner, $token);
        if (!$record || ($record['context']['cpf'] ?? '') !== $cpf || self::rejected($owner, $token)) return false;
        $file = PrivateDocumentStore::open($owner, $token);
        if (!$file) return false;
        fclose($file['handle']);
        return true;
    }

    private static function participantCpf(int $owner, array $person): string {
        foreach (Accounts::participants($owner) as $entry) {
            if ($entry['id'] === ($person['directoryId'] ?? null) &&
                $entry['version'] === ($person['directoryVersion'] ?? null) &&
                $entry['person']['cpf'] === ($person['person']['cpf'] ?? null)) return $entry['person']['cpf'];
        }
        return '';
    }

    public static function availability(\WP_REST_Request $request) {
        $owner = NativeSession::user($request);
        if (!AccountAuth::throttle('identity-lookup-' . $owner, 30, 900)) {
            return Identity::error('Muitas verificações de identificação. Tente novamente em alguns minutos.', 429);
        }
        $draft = RequestDrafts::load($owner)['draft'] ?? null;
        $ids = [];
        foreach ($draft->participants ?? [] as $participant) {
            $person = json_decode(wp_json_encode($participant), true);
            if (empty($person['items'])) continue;
            $cpf = self::participantCpf($owner, $person);
            if ($cpf && self::source($cpf, $owner)) $ids[] = $person['id'];
        }
        return ['available' => $ids];
    }

    public static function confirm(int $owner, array $person, array $item) {
        if (!AccountAuth::throttle('identity-confirm-' . $owner, 100, 900)) {
            return Identity::error('Muitas confirmações de identificação. Aguarde antes de tentar novamente.', 429);
        }
        $cpf = self::participantCpf($owner, $person);
        $source = $cpf ? self::source($cpf, $owner) : null;
        if (!$source) return Identity::error('A identificação não está disponível para reutilização. Envie outro arquivo.', 409);
        $reference = 'reuse-' . bin2hex(random_bytes(16));
        $grant = $source + ['cpf' => $cpf, 'by' => $owner, 'at' => gmdate('c'),
            'draft' => RequestDrafts::load($owner)['key'] ?? '',
            'context' => DraftDocuments::context($person, $item, self::ID)];
        return add_user_meta($owner, self::GRANT . $reference, $grant, true)
            ? $reference : Identity::error('Não foi possível registrar a reutilização.', 503);
    }

    public static function grant(int $owner, string $reference): ?array {
        if (!preg_match('/^reuse-[a-f0-9]{32}$/D', $reference)) return null;
        $grant = get_user_meta($owner, self::GRANT . $reference, true);
        return is_array($grant) && (int) $grant['by'] === $owner ? $grant : null;
    }

    public static function forget(int $owner, string $reference): void {
        if (self::grant($owner, $reference) && !KitOrderRepository::retains($owner, $reference)) {
            delete_user_meta($owner, self::GRANT . $reference);
        }
    }

    public static function openForRequest(int $owner, string $reference, bool $historical = false) {
        $grant = self::grant($owner, $reference);
        if (!$grant) return PrivateDocumentStore::open($owner, $reference);
        if (!$historical && self::rejected((int) $grant['owner'], $grant['token'])) return null;
        return PrivateDocumentStore::open((int) $grant['owner'], $grant['token']);
    }
}
