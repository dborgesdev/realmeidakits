<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class OrderDocuments {
    public static function boot(): void {
        add_action('rest_api_init', static function (): void {
            register_rest_route('re-almeida/v1', '/account/orders/(?P<id>[1-9][0-9]*)/documents', [
                'methods' => 'POST', 'permission_callback' => [RequestDrafts::class, 'permission'],
                'callback' => [self::class, 'replace'],
            ]);
        });
    }

    public static function describe(int $owner, array $snapshot, array $line, int $index, bool $editable): array {
        [, $item] = RequestQueue::item($snapshot, $line);
        $requirements = RequestQueue::documents($item, $line);
        $documents = [];
        foreach ($requirements + array_fill_keys(array_keys($item['documents'] ?? []), []) as $id => $requirement) {
            $reference = $item['documents'][$id] ?? '';
            $review = $line['reviews'][$id] ?? [];
            $status = $review['status'] ?? ($reference ? 'received' : 'missing');
            $documents[] = ['id' => (string) $id, 'label' => $requirement['label'] ?? (string) $id,
                'required' => (bool) ($requirement['required'] ?? false),
                'reused' => (bool) PersonalDocuments::grant($owner, $reference), 'status' => $status,
                'reason' => $review['reason'] ?? '',
                'canReplace' => $editable && self::mayReplace($line, $status)];
        }
        unset($line['reviews'], $line['replacementDocuments'], $line['documentRequirements'], $line['cpf']);
        if ($line['documentStatus'] === 'rejected') $line['documentStatus'] = 'pending_documents';
        return $line + ['documentLine' => $index, 'documents' => $documents];
    }

    private static function mayReplace(array $line, string $status): bool {
        return $line['pickupStatus'] !== 'collected' &&
            ($status === 'rejected' || $status === 'missing' || $line['documentStatus'] === 'pending_documents');
    }

    public static function replace(\WP_REST_Request $request) {
        $owner = NativeSession::user($request);
        $id = (int) $request['id'];
        $row = KitOrderRepository::ready() ? KitOrderRepository::get($id) : null;
        if (!$row || (int) $row->owner_id !== $owner) return Identity::error('Solicitação não encontrada.', 404);
        $params = $request->get_body_params();
        $index = filter_var($params['line'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
        $requirement = $params['requirement'] ?? null;
        $file = $request->get_file_params()['file'] ?? null;
        if ($index === false || !is_string($requirement) || !is_array($file)) return Identity::error('Envie o documento e sua inscrição.');
        if ($requirement === PersonalDocuments::ID && !PersonalDocuments::photo($file)) {
            return Identity::error('Envie uma foto do RG ou da CNH em JPG ou PNG.', 415);
        }
        return Accounts::locked('request_ops_' . $id, static function () use ($owner, $row, $index, $requirement, $file) {
            if (!RequestQueue::paid(RequestQueue::order($row))) return Identity::error('O pedido não está na fila operacional.', 409);
            $snapshot = json_decode($row->snapshot, true);
            $state = RequestOperations::read($row);
            if (!isset($snapshot['lines'][$index])) return Identity::error('Inscrição não encontrada.', 404);
            $line = array_replace($snapshot['lines'][$index], $state['lines'][$index] ?? []);
            [$person, $item] = RequestQueue::item($snapshot, $line);
            $previous = $item['documents'][$requirement] ?? '';
            $review = $line['reviews'][$requirement] ?? [];
            if ((!$previous && !isset(RequestQueue::documents($item, $line)[$requirement])) ||
                !self::mayReplace($line, $review['status'] ?? ($previous ? 'received' : 'missing'))) {
                return Identity::error('O documento não está habilitado para substituição.', 409);
            }
            $context = ['request' => (int) $row->id, 'line' => $index, 'requirement' => $requirement];
            if ($requirement === PersonalDocuments::ID) $context['cpf'] = $person['cpf'] ?? '';
            $token = PrivateDocumentStore::put($owner, $file, $context);
            if (is_wp_error($token)) return $token;
            $patch = $state['lines'][$index] ?? [];
            $patch['replacementDocuments'][$requirement] = $token;
            unset($patch['reviews'][$requirement]);
            $patch['documentStatus'] = in_array('rejected', array_column($patch['reviews'] ?? [], 'status'), true) ? 'rejected' : 'pending_review';
            $state['version']++;
            $state['lines'][$index] = $patch;
            $state['audit'][] = ['at' => gmdate('c'), 'actor' => $owner, 'line' => $index,
                'before' => ['documentStatus' => $line['documentStatus'], 'reviews' => $review ? [$requirement => $review] : [], 'reference' => $previous],
                'after' => ['documentStatus' => $patch['documentStatus'], 'replacement' => $requirement]];
            if (!update_user_meta($owner, '_rak_request_ops_' . $row->id, wp_slash($state))) {
                PrivateDocumentStore::remove($owner, $token);
                return Identity::error('Não foi possível registrar a substituição.', 503);
            }
            return ['saved' => true];
        });
    }
}
