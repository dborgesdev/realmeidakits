<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class RequestOperations {
    public const CAPABILITY = 'manage_rak_requests';
    public const DOCUMENTS = ['not_required' => 'Sem arquivo exigido', 'pending_review' => 'Aguardando análise',
        'pending_documents' => 'Documentos pendentes', 'rejected' => 'Documentos rejeitados', 'approved' => 'Documentos aprovados'];
    public const PICKUP = ['pending' => 'Pendente', 'ready' => 'Kit liberado', 'collected' => 'Retirado'];

    public static function read(object $row): array {
        $stored = get_user_meta((int) $row->owner_id, '_rak_request_ops_' . $row->id, true);
        return is_array($stored) ? $stored : ['version' => 0, 'lines' => [], 'audit' => []];
    }

    public static function lines(object $row, array $snapshot): array {
        $operations = self::read($row);
        return array_map(static fn($line, $index) => array_replace(
            $line, $operations['lines'][$index] ?? []
        ), $snapshot['lines'] ?? [], array_keys($snapshot['lines'] ?? []));
    }

    public static function update(object $row, int $index, int $version, array $patch) {
        return Accounts::locked('request_ops_' . $row->id, static function () use ($row, $index, $version, $patch) {
            $snapshot = json_decode($row->snapshot, true);
            if (!RequestQueue::paid(RequestQueue::order($row))) {
                return Identity::error('O pedido não está na fila operacional de pagamentos confirmados.', 409);
            }
            $current = self::read($row);
            if ($version !== $current['version']) return Identity::error('Outra pessoa editou esta solicitação. Recarregue.', 409);
            $line = $snapshot['lines'][$index] ?? null;
            if (!$line || !isset(self::DOCUMENTS[$patch['documentStatus']], self::PICKUP[$patch['pickupStatus']])) {
                return Identity::error('Estado operacional inválido.');
            }
            $previous = array_replace($line, $current['lines'][$index] ?? []);
            [, $item] = RequestQueue::item($snapshot, $previous);
            if (isset($patch['review'])) {
                $review = $patch['review'];
                unset($patch['review']);
                $token = $item['documents'][$review['id']] ?? '';
                $file = PersonalDocuments::openForRequest((int) $row->owner_id, $token, true);
                if (!$file) return Identity::error('O arquivo não está disponível para análise.');
                fclose($file['handle']);
                if (!in_array($review['status'], ['approved', 'rejected'], true) ||
                    ($review['status'] === 'rejected' && $review['reason'] === '')) {
                    return Identity::error('Informe o resultado e a justificativa da rejeição.');
                }
                $patch['reviews'] = array_replace($previous['reviews'] ?? [], [$review['id'] => [
                    'status' => $review['status'], 'reason' => $review['reason'], 'token' => $token,
                ]]);
                $patch['documentStatus'] = in_array('rejected', array_column($patch['reviews'], 'status'), true)
                    ? 'rejected' : 'pending_review';
                if ($patch['documentStatus'] !== 'rejected') {
                    $required = array_keys(array_filter(RequestQueue::documents($item, $line), static fn($requirement) => $requirement['required']));
                    $pending = array_diff(array_unique(array_merge($required, array_keys($item['documents']))),
                        array_keys(array_filter($patch['reviews'], static fn($decision) => $decision['status'] === 'approved')));
                    if (!$pending) $patch['documentStatus'] = 'approved';
                }
            }
            if ($patch['documentStatus'] === 'rejected' && empty($patch['reviews']) &&
                ($previous['documentStatus'] ?? '') !== 'rejected') {
                return Identity::error('Registre a rejeição no documento e informe a justificativa.');
            }
            if ($patch['documentStatus'] === 'approved') {
                $requirements = RequestQueue::documents($item, $line);
                if (!$item || !get_post((int) $line['raceId'])) return Identity::error('A configuração documental não está disponível.');
                foreach ($requirements as $id => $requirement) {
                    if (!$requirement['required']) continue;
                    $file = PersonalDocuments::openForRequest((int) $row->owner_id, $item['documents'][$id] ?? '', true);
                    if (!$file) return Identity::error('Há documento obrigatório ausente ou inacessível.');
                    fclose($file['handle']);
                }
                $reviews = $patch['reviews'] ?? $previous['reviews'] ?? [];
                if (in_array('rejected', array_column($reviews, 'status'), true)) {
                    return Identity::error('Reveja os documentos rejeitados antes de aprovar a inscrição.');
                }
                foreach ($item['documents'] ?? [] as $id => $token) {
                    if (($reviews[$id]['token'] ?? '') === $token) continue;
                    $file = PersonalDocuments::openForRequest((int) $row->owner_id, $token, true);
                    if (!$file) return Identity::error('Há um documento anexado inacessível.');
                    fclose($file['handle']);
                    $reviews[$id] = ['status' => 'approved', 'reason' => '', 'token' => $token];
                }
                if ($reviews) $patch['reviews'] = $reviews;
            }
            $before = array_intersect_key($previous, $patch);
            if ($before === $patch) return true;
            $current['version']++;
            $current['lines'][$index] = array_replace($current['lines'][$index] ?? [], $patch);
            $current['audit'][] = ['at' => gmdate('c'), 'actor' => get_current_user_id(), 'line' => $index, 'before' => $before, 'after' => $patch];
            if (!update_user_meta((int) $row->owner_id, '_rak_request_ops_' . $row->id, wp_slash($current))) {
                return Identity::error('Não foi possível salvar o estado.', 503);
            }
            if (($review['status'] ?? '') === 'rejected' && $review['id'] === PersonalDocuments::ID) {
                PersonalDocuments::rejectSource((int) $row->owner_id, $item['documents'][PersonalDocuments::ID] ?? '');
            }
            return true;
        });
    }
}
