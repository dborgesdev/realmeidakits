<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class DraftInput {
    private const STAGES = ['pedido', 'responsavel', 'participantes', 'documentos', 'condicoes', 'revisao', 'pagamento'];

    public static function clean(int $owner, array $input) {
        $ids = $input['selectedRaceIds'] ?? null;
        $people = $input['participants'] ?? null;
        if (!is_array($ids) || !array_is_list($ids) || count($ids) > 100 ||
            !is_array($people) || !array_is_list($people) || count($people) < 1 || count($people) > RequestSettings::limit()) {
            return Identity::error('Seleção ou quantidade de participantes inválida.');
        }

        $races = [];
        foreach ($ids as $id) {
            if (!is_string($id) || !preg_match('/^[1-9][0-9]{0,18}$/D', $id) || isset($races[$id])) {
                return Identity::error('Identificador de corrida inválido.');
            }
            $post = get_post((int) $id);
            if (!$post || $post->post_type !== 'corrida' || $post->post_status !== 'publish' || $post->post_password) {
                return Identity::error('Uma corrida saiu do catálogo. Retire-a da seleção para continuar.');
            }
            $races[$id] = Rest::project($post);
        }

        $directory = array_column(Accounts::participants($owner), null, 'id');
        $participants = [];
        $used = [];
        $participantIds = [];
        foreach ($people as $row) {
            $clean = self::participant($owner, $row, $races, $directory);
            if (is_wp_error($clean)) return $clean;
            $linked = $clean['directoryId'] ?? null;
            if (isset($participantIds[$clean['id']]) || ($linked && isset($used[$linked]))) {
                return Identity::error('Participante repetido na solicitação.');
            }
            $participantIds[$clean['id']] = true;
            if ($linked) $used[$linked] = true;
            $participants[] = $clean;
        }

        $accepted = [];
        $raw = $input['acceptedConditions'] ?? [];
        if (!is_array($raw)) return Identity::error('Aceites inválidos.');
        foreach ($races as $id => $race) {
            $versions = array_map(static fn($c) => wp_json_encode(
                [$c['id'], $c['version'], $c['text']], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_LINE_TERMINATORS
            ), $race['conditions'] ?? []);
            $claims = $raw[$id] ?? [];
            if (!is_array($claims) || count($claims) > 100 || array_filter($claims, static fn($v) => !is_string($v))) {
                return Identity::error('Aceites inválidos.');
            }
            $matches = array_values(array_intersect($versions, $claims));
            if ($matches) $accepted[$id] = $matches;
        }
        $stage = $input['stage'] ?? 'pedido';
        if (!in_array($stage, self::STAGES, true)) return Identity::error('Etapa inválida.');
        $next = max(array_map(static fn($p) => (int) substr($p['id'], 1), $participants)) + 1;
        $preferred = $input['preferredModality'] ?? null;
        return [
            'selectedRaceIds' => $ids,
            'participants' => $participants,
            'acceptedConditions' => (object) $accepted,
            'preferredModality' => in_array($preferred, ['appai', 'oficial'], true) ? $preferred : null,
            'prepared' => ($input['prepared'] ?? false) === true,
            'nextParticipantNumber' => $next,
            'stage' => $stage,
        ];
    }

    private static function participant(int $owner, mixed $row, array $races, array $directory) {
        if (!is_array($row) || !is_string($row['id'] ?? null) || !preg_match('/^p[1-9][0-9]{0,8}$/D', $row['id']) ||
            !is_array($row['items'] ?? null) || !array_is_list($row['items']) || count($row['items']) > count($races)) {
            return Identity::error('Participante ou atribuições inválidas.');
        }
        $result = ['id' => $row['id'], 'items' => [], 'documents' => (object) [],
            'existingDocumentIds' => [], 'reuseAuthorized' => false];
        $linked = $row['directoryId'] ?? null;
        if ($linked !== null && (!is_int($linked) || !isset($directory[$linked]))) {
            return Identity::error('Participante não pertence ao titular.', 403);
        }
        $person = $row['person'] ?? [];
        if (!is_array($person)) return Identity::error('Dados pessoais inválidos.');
        $limits = ['name' => 80, 'cpf' => 14, 'birthDate' => 10, 'phone' => 16, 'email' => 120];
        foreach ($limits as $key => $limit) {
            $value = $person[$key] ?? '';
            if (!is_string($value) || mb_strlen($value) > $limit) return Identity::error('Dados pessoais inválidos.');
            $result['person'][$key] = in_array($key, ['cpf', 'phone'], true)
                ? Identity::digits($value) : sanitize_text_field($value);
        }
        if (strlen($result['person']['cpf']) > 11 || strlen($result['person']['phone']) > 11) {
            return Identity::error('CPF ou telefone excede a quantidade de dígitos.');
        }
        if ($linked !== null) {
            $result['directoryId'] = $linked;
            // Preserve the version seen by the editor so a stale form cannot overwrite a newer record.
            $version = $row['directoryVersion'] ?? null;
            if (!is_int($version) || $version < 1 || $version > $directory[$linked]['version']) {
                return Identity::error('Versão de participante inválida.');
            }
            $result['directoryVersion'] = $version;
        }
        $seen = [];
        foreach ($row['items'] as $item) {
            $id = is_array($item) ? ($item['raceId'] ?? null) : null;
            if (!is_string($id) || !isset($races[$id]) || isset($seen[$id])) return Identity::error('Corrida atribuída inválida.');
            $seen[$id] = true;
            $mode = null;
            foreach ($races[$id]['modalities'] ?? [] as $candidate) {
                if ($candidate['id'] === ($item['modality'] ?? null)) $mode = $candidate;
            }
            if (!$mode) return Identity::error('Modalidade indisponível para a corrida.');
            $choice = ['raceId' => $id, 'modality' => $mode['id'], 'documents' => (object) []];
            $options = [
                'distance' => $mode['distances'], 'kitType' => array_column($mode['kitTypes'], 'label'),
                'size' => $mode['sizes'], 'pickup' => array_column($mode['pickups'], 'label'),
                'kit' => ['camiseta', 'numero'],
            ];
            foreach ($options as $field => $values) {
                $value = $item[$field] ?? '';
                if ($value !== '' && !in_array($value, $values, true)) return Identity::error('Uma opção da corrida mudou. Revise a configuração.');
                $choice[$field] = $value;
            }
            if ($choice['kit'] === '') $choice['kit'] = $mode['shirtEnabled'] ? 'camiseta' : 'numero';
            foreach (['membership', 'registration'] as $field) {
                $value = $item[$field] ?? '';
                if (!is_string($value) || strlen($value) > 196608) return Identity::error('Identificação de inscrição inválida.');
                $choice[$field] = sanitize_text_field($value);
            }
            $files = $item['documents'] ?? [];
            if (!is_array($files)) return Identity::error('Referências de documentos inválidas.');
            $requirements = array_column(array_filter($mode['documents'], static fn($doc) => $doc['requiresUpload'] !== false), null, 'id');
            foreach ($files as $requirement => $token) {
                $context = DraftDocuments::context($result, $choice, (string) $requirement);
                $grant = $requirement === PersonalDocuments::ID && is_string($token) ? PersonalDocuments::grant($owner, $token) : null;
                if ($grant && $linked && $grant['context'] === $context && $grant['cpf'] === $result['person']['cpf'] &&
                    $grant['draft'] === (RequestDrafts::load($owner)['key'] ?? null)) {
                    $choice['documents']->{$requirement} = $token;
                    continue;
                }
                $record = is_string($token) ? PrivateDocumentStore::record($owner, $token) : null;
                if (!$linked || !isset($requirements[$requirement]) || !$record ||
                    $record['context'] !== $context) {
                    return Identity::error('Documento não pertence a esta inscrição ou a exigência mudou.', 403);
                }
                $choice['documents']->{$requirement} = $token;
            }
            $result['items'][] = $choice;
        }
        return $result;
    }
}
