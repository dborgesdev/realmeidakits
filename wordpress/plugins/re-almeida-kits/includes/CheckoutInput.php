<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class CheckoutInput {
    public static function validate(int $owner, array $draft) {
        $draft = DraftInput::clean($owner, $draft);
        if (is_wp_error($draft)) return $draft;
        $responsible = Identity::person(Accounts::profile($owner), true);
        if (is_wp_error($responsible)) return Identity::error('Revise os dados do titular antes de finalizar.');
        if (!$draft['prepared'] || !$draft['selectedRaceIds']) return Identity::error('Selecione corridas e participantes.');

        $races = [];
        foreach ($draft['selectedRaceIds'] as $id) {
            $race = Rest::project(get_post((int) $id));
            if ($race['status'] !== 'open') return Identity::error('Uma corrida não está mais disponível.', 409);
            if (count((array) ($draft['acceptedConditions']->{$id} ?? [])) !== count($race['conditions'])) {
                return Identity::error('Leia e aceite as condições atuais de todas as corridas.');
            }
            $races[$id] = $race;
        }

        $directory = array_column(Accounts::participants($owner), null, 'id');
        $assigned = $lines = $identities = [];
        $total = 0;
        foreach ($draft['participants'] as $person) {
            $id = $person['directoryId'] ?? 0;
            $registered = $directory[$id] ?? null;
            $normalized = Identity::person($person['person']);
            if (!$registered || is_wp_error($normalized) || $person['directoryVersion'] !== $registered['version'] ||
                $normalized != $registered['person'] || !$person['items']) {
                return Identity::error('Salve e selecione o cadastro atual de cada participante.');
            }
            foreach ($person['items'] as $item) {
                $race = $races[$item['raceId']];
                $identity = $normalized['cpf'] . ':' . $race['id'];
                if (isset($identities[$identity])) return Identity::error('O mesmo CPF foi atribuído duas vezes à mesma corrida.');
                $identities[$identity] = true;
                $mode = array_column($race['modalities'], null, 'id')[$item['modality']];
                $base = $race['prices'][$item['modality'] === 'oficial' ? 'official' : ($item['kit'] === 'camiseta' ? 'shirt' : 'number')];
                $amount = self::amount($item, $mode, $base);
                if (is_wp_error($amount)) return $amount;
                foreach ($mode['documents'] as $document) {
                    if (!$document['required'] || $document['requiresUpload'] === false) continue;
                    $token = $item['documents']->{$document['id']} ?? '';
                    $file = $token ? PersonalDocuments::openForRequest($owner, $token) : null;
                    if (!$file) return Identity::error(sprintf('Revise %s de %s na corrida %s antes de finalizar.',
                        $document['label'], $normalized['name'], $race['name']));
                    fclose($file['handle']);
                }
                $additional = $item['modality'] === 'oficial'
                    ? (array_column($mode['kitTypes'], 'additionalCents', 'label')[$item['kitType']] ?? 0) : 0;
                $amount += $additional;
                $pickup = array_column($mode['pickups'], null, 'label')[$item['pickup']] ?? null;
                $assigned[$race['id']] = true;
                $total += $amount;
                $lines[] = [
                    'raceId' => $race['id'], 'race' => $race['name'], 'participantId' => $id,
                    'participant' => $normalized['name'], 'modality' => $item['modality'],
                    'registration' => $item['registration'], 'cpf' => $normalized['cpf'], 'baseCents' => $base,
                    'additionalCents' => $additional, 'kitType' => $item['kitType'], 'size' => $item['size'], 'pickup' => $pickup,
                    'documentRequirements' => $mode['documents'],
                    'cents' => $amount, 'documentStatus' => (array) $item['documents'] ? 'pending_review' : 'not_required',
                    'bib' => null, 'pickupStatus' => 'pending',
                ];
            }
        }
        if (count($assigned) !== count($races)) return Identity::error('Atribua cada corrida selecionada a pelo menos um participante.');
        if ($total <= 0) return Identity::error('O valor do serviço precisa estar definido antes de abrir o checkout.');

        return ['draft' => $draft, 'responsible' => $responsible, 'lines' => $lines, 'total' => $total];
    }

    private static function amount(array $item, array $mode, ?int $price) {
        if ($item['distance'] === '' || ($mode['pickups'] && $item['pickup'] === '')) {
            return Identity::error('Complete as opções de retirada de cada inscrição.');
        }
        if (($mode['requireRegistration'] && trim($item['registration']) === '') ||
            ($mode['requireMembership'] && trim($item['membership']) === '')) {
            return Identity::error('Informe a matrícula ou o número de inscrição exigido.');
        }
        if ($item['modality'] === 'appai') {
            if (($item['kit'] === 'numero' && !$mode['numberEnabled']) ||
                ($item['kit'] === 'camiseta' && (!$mode['shirtEnabled'] || $item['size'] === ''))) {
                return Identity::error('Selecione um kit e tamanho válidos.');
            }
        } else {
            if ($mode['kitTypes'] && $item['kitType'] === '') return Identity::error('Selecione o kit oficial.');
        }
        return is_int($price) && $price >= 0 ? $price : Identity::error('Uma inscrição ainda está sem preço definido.');
    }
}
