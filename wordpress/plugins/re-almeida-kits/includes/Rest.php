<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
final class Rest {
    public static function boot(): void {
        add_action('rest_api_init', [self::class, 'routes']);
        add_filter('rest_pre_dispatch', static function ($result, $server, $request) {
            if (preg_match('#^/wp/v2/corrida(?:/|$)#', $request->get_route()) && !current_user_can(CAPABILITY)) {
                return new \WP_Error('rak_forbidden', 'Acesso administrativo necessário.', ['status' => 403]);
            }
            return $result;
        }, 10, 3);
        add_filter('rest_pre_serve_request', [self::class, 'cors'], 20, 4);
    }
    public static function routes(): void {
        register_rest_route('re-almeida/v1', '/corridas', [
            'methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => [self::class, 'index'],
            'args' => [
                'page' => ['default' => 1, 'validate_callback' => static fn($v) => filter_var($v, FILTER_VALIDATE_INT) !== false && (int) $v >= 1, 'sanitize_callback' => 'absint'],
                'per_page' => ['default' => 20, 'validate_callback' => static fn($v) => filter_var($v, FILTER_VALIDATE_INT) !== false && (int) $v >= 1 && (int) $v <= 100, 'sanitize_callback' => 'absint'],
            ],
        ]);
        register_rest_route('re-almeida/v1', '/corridas/(?P<slug>[a-z0-9-]+)', [
            'methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => [self::class, 'detail'],
            'args' => ['slug' => ['sanitize_callback' => 'sanitize_title', 'validate_callback' => static fn($v) => is_string($v) && strlen($v) <= 200]],
        ]);
    }
    public static function index(\WP_REST_Request $request): \WP_REST_Response {
        $q = new \WP_Query(['post_type' => 'corrida', 'post_status' => 'publish', 'has_password' => false, 'posts_per_page' => $request['per_page'], 'paged' => $request['page'], 'orderby' => 'ID', 'order' => 'ASC']);
        return self::response(['data' => array_map([self::class, 'project'], $q->posts), 'page' => $request['page'], 'totalPages' => (int) $q->max_num_pages, 'total' => (int) $q->found_posts]);
    }
    public static function detail(\WP_REST_Request $request) {
        $post = get_page_by_path($request['slug'], OBJECT, 'corrida');
        if (!$post || $post->post_status !== 'publish' || $post->post_password) return new \WP_Error('rak_not_found', 'Corrida não encontrada.', ['status' => 404]);
        return self::response(['data' => self::project($post)]);
    }
    private static function response(array $body): \WP_REST_Response {
        $response = new \WP_REST_Response($body);
        $response->header('Cache-Control', 'no-store');
        return $response;
    }
    public static function project(\WP_Post $post): array {
        $d = Repository::get($post->ID);
        $valid = Schema::validate($d);
        $editorial = [
            'id' => (string) $post->ID, 'slug' => $post->post_name, 'name' => get_the_title($post),
            'description' => wp_strip_all_tags($post->post_content), 'image' => self::image(get_post_thumbnail_id($post)),
        ];
        if (is_wp_error($valid)) return $editorial + ['status' => 'unavailable', 'configurationError' => true];
        $d = $valid;
        $forMode = static fn($rows, $id) => array_values(array_filter($rows, static fn($row) => in_array($row['modality'], ['both', $id], true)));
        $activeConditions = array_column(array_filter($valid['conditions'], static fn($condition) => $condition['active']), 'id');
        $documents = array_filter($valid['documents'], static fn($document) =>
            $document['conditionId'] === '' || in_array($document['conditionId'], $activeConditions, true));
        $modes = [];
        foreach (['oficial' => 'officialEnabled', 'appai' => 'appaiEnabled'] as $id => $enabled) {
            if (!$d[$enabled]) continue;
            $modes[] = [
                'id' => $id, 'label' => $id === 'oficial' ? 'Kit Oficial' : 'Associado à APPAI',
                'requireRegistration' => $id === 'oficial' && $d['requireRegistration'],
                'requireMembership' => $id === 'appai' && $d['requireMembership'],
                'distances' => array_column($forMode($d['distances'], $id), 'label'),
                'pickups' => array_map(static fn($pickup) => array_intersect_key($pickup, array_flip(['id', 'label', 'address', 'at', 'guidance', 'modality'])), $forMode($d['pickups'], $id)),
                'kitTypes' => $id === 'oficial' ? array_map(static fn($kit) => ['id' => $kit['id'], 'label' => $kit['label'], 'additionalCents' => $kit['additionalCents'] ?? 0], $d['kits']) : [],
                'shirtEnabled' => $id === 'appai' && $d['shirtEnabled'], 'numberEnabled' => $id === 'appai' && $d['numberEnabled'],
                'sizes' => $id === 'appai' && $d['shirtEnabled'] ? $d['sizes'] : [],
                'shirtImage' => $id === 'appai' && $d['shirtEnabled'] ? self::image($d['shirtImageId']) : null,
                'documents' => [...array_map(static fn($doc) => [
                    'id' => $doc['id'], 'label' => $doc['label'], 'scope' => $doc['scope'], 'modality' => $doc['modality'], 'required' => $doc['required'], 'guidance' => $doc['guidance'],
                    'requiresUpload' => $doc['requiresUpload'] ?? true, 'requiresSignature' => $doc['requiresSignature'],
                    'purpose' => $doc['purpose'] ?? '', 'version' => $doc['libraryVersion'] ?: 1, 'template' => PublicModels::describe($doc['templateId'] ?? 0),
                ], $forMode($documents, $id)), PersonalDocuments::requirement($id)],
            ];
        }
        return $editorial + [
            'priceCents' => $d['priceCents'], 'prices' => ['official' => $d['officialCents'], 'shirt' => $d['shirtCents'], 'number' => $d['numberCents']],
            'raceDate' => $d['raceDate'], 'raceTime' => $d['raceTime'], 'location' => $d['location'],
            'opensAt' => $d['opensAt'], 'closesAt' => $d['closesAt'], 'status' => Repository::availability($d),
            'modalities' => $modes, 'conditions' => array_values(array_map(static fn($c) => ['id' => $c['id'], 'text' => $c['text'], 'version' => $c['version'], 'active' => true], array_filter($d['conditions'], static fn($c) => $c['active']))),
            'guidance' => $d['guidance'], 'contact' => $d['contact'], 'whatsappUrl' => $d['whatsappUrl'],
        ];
    }
    private static function image(int $id): ?array {
        $image = $id ? wp_get_attachment_image_src($id, 'large') : false;
        return $image ? ['url' => $image[0], 'width' => $image[1], 'height' => $image[2], 'alt' => (string) get_post_meta($id, '_wp_attachment_image_alt', true)] : null;
    }
    public static function localOrigin(string $origin): bool {
        // Vite local only. Exact loopback hosts; never LAN, suffixes or credentials.
        return (bool) preg_match('#^https?://(?:localhost|127\.0\.0\.1|\[::1\]):(?:517[3-9]|518[0-9]|519[0-9])$#D', $origin);
    }
    public static function cors($served, $result, $request, $server) {
        if (!preg_match('#^/re-almeida/v1/corridas(?:/[a-z0-9-]+)?/?$#D', $request->get_route())) return $served;
        header_remove('Access-Control-Allow-Origin');
        header_remove('Access-Control-Allow-Credentials');
        header_remove('Access-Control-Allow-Methods');
        $allowed = apply_filters('rak_public_origins', ['https://realmeidakits.com.br']);
        $origin = get_http_origin();
        header('Vary: Origin', false);
        if (NativeSession::legacy() && in_array($request->get_method(), ['GET', 'HEAD', 'OPTIONS'], true) && $origin && (in_array($origin, $allowed, true) || self::localOrigin($origin))) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
        }
        return $served;
    }
}
