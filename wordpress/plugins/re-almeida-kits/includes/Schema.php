<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
final class Schema {
    /** This schema drives both the accessible form and authoritative validation. */
    public static function sections(): array {
        $mode = ['type' => 'select', 'label' => 'Modalidade', 'options' => ['both' => 'Ambas', 'oficial' => 'Kit Oficial', 'appai' => 'APPAI']];
        $price = static fn($label) => ['type' => 'money', 'label' => $label . ' (R$)', 'help' => 'Deixe vazio para valor a confirmar. Sem tarifa automática.'];
        $sections = [
            ['title' => '1. Informações gerais', 'fields' => [
                'raceDate' => ['type' => 'date', 'label' => 'Data da corrida'],
                'raceTime' => ['type' => 'time', 'label' => 'Horário da corrida'],
                'location' => ['type' => 'text', 'label' => 'Local da corrida'],
            ]],
            ['title' => '2. Disponibilidade e inscrições', 'fields' => [
                'status' => ['type' => 'select', 'label' => 'Controle manual', 'options' => ['unavailable' => 'Indisponível', 'open' => 'Aberto (respeita os prazos)', 'closed' => 'Encerrado']],
                'opensAt' => ['type' => 'datetime-local', 'label' => 'Abertura das solicitações'],
                'closesAt' => ['type' => 'datetime-local', 'label' => 'Encerramento das solicitações'],
            ]],
            ['title' => '3. Modalidades', 'fields' => [
                'officialEnabled' => ['type' => 'checkbox', 'label' => 'Oferecer Kit Oficial'],
                'requireRegistration' => ['type' => 'checkbox', 'label' => 'Exigir número da inscrição/pedido na organização', 'when' => 'officialEnabled'],
                'appaiEnabled' => ['type' => 'checkbox', 'label' => 'Oferecer APPAI'],
                'requireMembership' => ['type' => 'checkbox', 'label' => 'Exigir matrícula APPAI', 'when' => 'appaiEnabled'],
            ]],
            ['title' => '4. Distâncias', 'fields' => [
                'distances' => ['type' => 'rows', 'label' => 'Distâncias (na ordem de exibição)', 'fields' => ['label' => ['type' => 'text', 'label' => 'Distância *', 'required' => true], 'modality' => $mode]],
            ]],
            ['title' => '5. Kits e camisetas', 'fields' => [
                'kits' => ['type' => 'rows', 'label' => 'Tipos de Kit Oficial', 'fields' => ['label' => ['type' => 'text', 'label' => 'Nome do kit *', 'required' => true], 'additionalCents' => $price('Adicional opcional')]],
                'shirtEnabled' => ['type' => 'checkbox', 'label' => 'APPAI: camiseta com número de peito', 'when' => 'appaiEnabled'],
                'numberEnabled' => ['type' => 'checkbox', 'label' => 'APPAI: somente número de peito', 'when' => 'appaiEnabled'],
                'sizes' => ['type' => 'lines', 'label' => 'Tamanhos disponíveis', 'choices' => ['PP', 'P', 'M', 'G', 'GG', 'XGG'], 'default' => ['PP', 'P', 'M', 'G', 'GG', 'XGG'], 'when' => 'shirtEnabled'],
                'shirtImageId' => ['type' => 'image', 'label' => 'Imagem real da camiseta', 'when' => 'shirtEnabled'],
            ]],
            ['title' => '6. Valores', 'fields' => [
                'officialCents' => $price('Kit Oficial') + ['when' => 'officialEnabled'],
                'shirtCents' => $price('APPAI com camiseta') + ['when' => 'shirtEnabled'],
                'numberCents' => $price('APPAI somente número de peito') + ['when' => 'numberEnabled'],
            ]],
            ['title' => '7. Retirada', 'fields' => [
                'pickups' => ['type' => 'rows', 'label' => 'Pontos de retirada', 'fields' => [
                    'label' => ['type' => 'text', 'label' => 'Nome do ponto *', 'required' => true], 'modality' => $mode,
                    'address' => ['type' => 'text', 'label' => 'Endereço/descrição'], 'at' => ['type' => 'datetime-local', 'label' => 'Data e horário'],
                    'guidance' => ['type' => 'textarea', 'label' => 'Orientações e condições operacionais'],
                ]],
            ]],
            ['title' => '8. Documentos exigidos', 'fields' => [
                'documents' => ['type' => 'rows', 'label' => 'Exigências adicionais da corrida', 'help' => 'RG ou CNH já é obrigatório para cada participante. Associe comprovantes, autorizações e outras exigências da corrida.', 'fields' => [
                    'label' => ['type' => 'text', 'label' => 'Nome exibido *', 'required' => true], 'modality' => $mode,
                    'scope' => ['type' => 'select', 'label' => 'Escopo', 'options' => ['personal' => 'Pessoal (participante)', 'race' => 'Específico da corrida']],
                    'required' => ['type' => 'checkbox', 'label' => 'Obrigatório'], 'guidance' => ['type' => 'textarea', 'label' => 'Orientações de envio'],
                ]],
            ]],
            ['title' => '9. Condições', 'fields' => [
                'conditions' => ['type' => 'rows', 'label' => 'Condições da corrida', 'help' => 'O identificador é estável. Alterar o texto cria uma nova versão; textos anteriores permanecem arquivados. Valide o conteúdo jurídico antes de publicar.', 'fields' => [
                    'text' => ['type' => 'textarea', 'label' => 'Texto *', 'required' => true], 'active' => ['type' => 'checkbox', 'label' => 'Ativa'],
                ]],
            ]],
            ['title' => '10. Comunicação e orientações', 'fields' => [
                'whatsappUrl' => ['type' => 'url', 'label' => 'Link confirmado do grupo de WhatsApp'],
                'guidance' => ['type' => 'textarea', 'label' => 'Orientações gerais para participantes'],
                'contact' => ['type' => 'textarea', 'label' => 'Informações públicas adicionais de contato'],
            ]],
        ];
        $sections[1]['title'] = 'Inscrições';
        $sections[0]['title'] = 'Informações gerais';
        $sections[2]['title'] = 'Modalidades e distâncias';
        $sections[2]['fields'] += $sections[3]['fields'];
        $sections[4]['title'] = 'Kits, camisetas e valores';
        $sections[4]['fields'] += $sections[5]['fields'];
        $sections[6]['title'] = 'Retirada';
        $sections[7]['title'] = 'Documentos';
        $sections[8]['title'] = 'Condições';
        $sections[9]['title'] = 'Comunicação';
        $sections[4]['fields']['kits']['label'] = 'Opções de kit da organizadora';
        foreach ($sections[4]['fields'] as &$field) if ($field['type'] === 'money') $field['label'] = 'Serviço de retirada · ' . $field['label'];
        unset($field);
        $sections[7]['fields']['documents']['fields'] += [
            'purpose' => ['type' => 'text', 'label' => 'Tipo / finalidade'],
            'requiresUpload' => ['type' => 'checkbox', 'label' => 'Exige arquivo preenchido ou assinado', 'default' => true],
            'requiresSignature' => ['type' => 'checkbox', 'label' => 'Exige assinatura'],
            'conditionId' => ['type' => 'text', 'label' => 'Condição de aplicação'],
            'templateId' => ['type' => 'pdf', 'label' => 'PDF modelo público em branco'],
        ];
        return array_values(array_intersect_key($sections, array_flip([0,1,2,4,6,7,8,9])));
    }
    public static function validate($input) {
        if (!is_array($input)) {
            return new \WP_Error('rak_invalid', 'Configuração inválida.', ['status' => 422]);
        }
        $input = RacePrices::canonical($input);
        $errors = [];
        $result = [];
        foreach (self::sections() as $section) {
            $result += self::fields($input, $section['fields'], $errors);
        }
        if ($result['opensAt'] && $result['closesAt'] && strtotime($result['opensAt']) >= strtotime($result['closesAt'])) {
            $errors[] = 'O encerramento deve ocorrer após a abertura.';
        }
        if (!$result['officialEnabled'] && !$result['appaiEnabled']) {
            $errors[] = 'Habilite pelo menos uma modalidade.';
        }
        if ($result['appaiEnabled'] && !$result['shirtEnabled'] && !$result['numberEnabled']) {
            $errors[] = 'Habilite ao menos uma opção APPAI.';
        }
        if ($result['appaiEnabled'] && $result['shirtEnabled'] && !$result['sizes']) {
            $errors[] = 'Informe os tamanhos disponíveis para a camiseta.';
        }
        foreach (['oficial' => $result['officialEnabled'], 'appai' => $result['appaiEnabled']] as $mode => $enabled) {
            if ($enabled && !array_filter($result['distances'], static fn($row) => in_array($row['modality'], ['both', $mode], true))) {
                $errors[] = 'Informe ao menos uma distância para ' . $mode . '.';
            }
        }
        $amounts = array_filter([
            $result['officialEnabled'] ? $result['officialCents'] : null,
            $result['appaiEnabled'] && $result['shirtEnabled'] ? $result['shirtCents'] : null,
            $result['appaiEnabled'] && $result['numberEnabled'] ? $result['numberCents'] : null,
        ], 'is_int');
        $result['priceCents'] = $amounts ? min($amounts) : null;
        $conditionIds = array_column($result['conditions'], 'id');
        foreach ($result['documents'] as $document) {
            if ($document['id'] === PersonalDocuments::ID) $errors[] = 'Exigências adicionais da corrida: identificação pessoal é definida pelo sistema.';
            if ($document['conditionId'] !== '' && !in_array($document['conditionId'], $conditionIds, true)) {
                $errors[] = 'Condição de aplicação: selecione uma condição desta corrida.';
            }
            if ($document['requiresSignature'] && !$document['requiresUpload']) $errors[] = 'Exige assinatura: habilite o envio de arquivo.';
        }
        $paths = [];
        foreach ($errors as $message) {
            foreach (self::sections() as $section) foreach ($section['fields'] as $key => $field) {
                if (str_starts_with($message, $field['label'] . ':')) $paths[] = $key;
                foreach ($field['fields'] ?? [] as $child) if (str_starts_with($message, $child['label'] . ':')) $paths[] = $key;
            }
            if (str_contains($message, 'encerramento')) $paths[] = 'closesAt';
            if (str_contains($message, 'pelo menos uma modalidade')) $paths[] = 'officialEnabled';
            if (str_contains($message, 'opção APPAI')) $paths[] = 'numberEnabled';
            if (str_contains($message, 'tamanhos disponíveis')) $paths[] = 'sizes';
            if (str_contains($message, 'uma distância')) $paths[] = 'distances';
        }
        return $errors ? new \WP_Error('rak_invalid', implode(' ', $errors), ['status' => 422, 'errors' => $errors, 'fields' => array_values(array_unique($paths))]) : $result;
    }
    private static function fields(array $input, array $fields, array &$errors): array {
        $out = [];
        foreach ($fields as $key => $field) {
            $v = $input[$key] ?? null;
            $label = $field['label'];
            if ($field['type'] === 'rows') {
                $out[$key] = [];
                if ($v !== null && (!is_array($v) || !array_is_list($v) || count($v) > 100)) {
                    $errors[] = "$label: lista inválida (máximo 100).";
                    continue;
                }
                $ids = [];
                $labels = [];
                foreach ($v ?? [] as $row) {
                    if (!is_array($row) || !is_string($row['id'] ?? null) || !preg_match('/^[a-zA-Z0-9_-]{1,64}$/D', $row['id']) || in_array($row['id'], $ids, true)) {
                        $errors[] = "$label: identificador inválido ou duplicado.";
                        continue;
                    }
                    $ids[] = $row['id'];
                    $clean = ['id' => $row['id']] + self::fields($row, $field['fields'], $errors);
                    if (in_array($key, ['documents', 'conditions', 'pickups'], true)) {
                        foreach (['libraryId','libraryVersion'] as $ref) {
                            $refValue = $row[$ref] ?? 0;
                            if (!is_int($refValue) || $refValue < 0) $errors[] = "$label: referência de biblioteca inválida.";
                            $clean[$ref] = is_int($refValue) ? max(0, $refValue) : 0;
                        }
                        if ($key === 'documents' && !array_key_exists('requiresUpload', $row)) $clean['requiresUpload'] = true;
                    }
                    if ($key === 'conditions') $clean['version'] = max(1, (int) ($row['version'] ?? 1));
                    if (isset($clean['label'])) {
                        if (in_array($clean['label'], $labels, true)) $errors[] = "$label: nomes duplicados.";
                        $labels[] = $clean['label'];
                    }
                    $out[$key][] = $clean;
                }
                continue;
            }
            if ($field['type'] === 'checkbox') {
                if ($v !== null && !in_array($v, [true, false, 0, 1, '0', '1'], true)) $errors[] = "$label: opção inválida.";
                $out[$key] = in_array($v, [true, 1, '1'], true);
                continue;
            }
            if ($field['type'] === 'lines') {
                if (!is_array($v) || count($v) > 30 || array_filter($v, static fn($s) => !is_string($s) || strlen($s) > 30 || !trim($s))) {
                    $errors[] = "$label: lista de tamanhos inválida.";
                    $v = [];
                }
                $out[$key] = array_values(array_unique(array_map('sanitize_text_field', $v)));
                continue;
            }
            if ($field['type'] === 'money') {
                // Transport/storage uses integer cents. Decimal input is converted by the UI.
                if ($v !== null && (!is_int($v) || $v < 0 || $v > 99999999)) $errors[] = "$label: informe valor entre 0 e 999.999,99.";
                $out[$key] = is_int($v) && $v >= 0 && $v <= 99999999 ? $v : null;
                continue;
            }
            if ($field['type'] === 'pdf') {
                $v ??= 0;
                if (!is_int($v) || $v < 0 || ($v && !PublicModels::describe($v))) $errors[] = "$label: selecione um PDF público em branco aprovado na biblioteca.";
                $out[$key] = is_int($v) ? max(0, $v) : 0;
                continue;
            }
            if ($field['type'] === 'image') {
                if (!is_int($v) || $v < 0 || ($v && !wp_attachment_is_image($v))) $errors[] = "$label: escolha uma imagem válida da biblioteca.";
                $out[$key] = is_int($v) ? $v : 0;
                continue;
            }
            if (!is_scalar($v) && $v !== null) {
                $errors[] = "$label: conteúdo inválido.";
                $v = '';
            }
            $v = (string) ($v ?? '');
            if (strlen($v) > 15000) $errors[] = "$label: texto muito longo.";
            if (!empty($field['required']) && !trim($v)) $errors[] = "$label: campo obrigatório.";
            if ($field['type'] === 'select' && !array_key_exists($v, $field['options'])) $errors[] = "$label: selecione uma opção válida.";
            if (in_array($field['type'], ['date', 'time', 'datetime-local'], true) && $v) {
                $format = ['date' => 'Y-m-d', 'time' => 'H:i', 'datetime-local' => 'Y-m-d\TH:i'][$field['type']];
                // Stored datetime includes offset. Revalidate without losing the WordPress timezone.
                if ($field['type'] === 'datetime-local' && preg_match('/[+-]\d{2}:\d{2}$/', $v)) $v = substr($v, 0, 16);
                $date = \DateTimeImmutable::createFromFormat('!' . $format, $v, wp_timezone());
                if (!$date || $date->format($format) !== $v) $errors[] = "$label: data ou horário inválido.";
                elseif ($field['type'] === 'datetime-local') $v = $date->format('c');
            }
            if ($field['type'] === 'url' && $v) {
                $parts = wp_parse_url($v);
                if (!$parts || ($parts['scheme'] ?? '') !== 'https' || !in_array(strtolower($parts['host'] ?? ''), ['chat.whatsapp.com', 'wa.me', 'api.whatsapp.com', 'www.whatsapp.com'], true) || isset($parts['user']) || isset($parts['port'])) $errors[] = "$label: use um endereço HTTPS válido do WhatsApp.";
                $v = esc_url_raw($v, ['https']);
            }
            $out[$key] = $field['type'] === 'textarea' ? sanitize_textarea_field($v) : sanitize_text_field($v);
        }
        return $out;
    }
}
