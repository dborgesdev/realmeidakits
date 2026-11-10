<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

final class PublicPages {
    public static function boot(): void {
        add_action('template_redirect', [self::class, 'dispatch'], 0);
    }

    private static function posts(): array {
        return get_posts([
            'post_type' => 'corrida', 'post_status' => 'publish', 'has_password' => false,
            'numberposts' => -1, 'orderby' => 'ID', 'order' => 'ASC',
        ]);
    }

    public static function url(string $path): string {
        // WordPress is mounted under /app; the public frontend is at the origin root.
        $home = wp_parse_url(home_url('/'));
        return $home['scheme'] . '://' . $home['host'] . (isset($home['port']) ? ':' . $home['port'] : '') . $path;
    }

    private static function indexable(): bool {
        return defined('RAK_PUBLIC_INDEXING') && RAK_PUBLIC_INDEXING && (bool) get_option('blog_public')
            && self::url('/') === 'https://realmeidakits.com.br/';
    }

    private static function oldSlug(string $slug): ?\WP_Post {
        $matches = get_posts([
            'post_type' => 'corrida', 'post_status' => 'publish', 'has_password' => false,
            'numberposts' => 2, 'meta_key' => '_wp_old_slug', 'meta_value' => $slug,
        ]);
        return count($matches) === 1 ? $matches[0] : null;
    }

    public static function dispatch(): void {
        $path = wp_parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        if (!is_string($path) || !preg_match('#^/(?:sitemap\.xml|corridas(?:/[a-z0-9-]{1,200})?/?)$#D', $path)) return;
        if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', ['GET', 'HEAD'], true)) {
            status_header(405);
            header('Allow: GET, HEAD');
            exit;
        }
        header('Cache-Control: no-store');
        if ($path === '/sitemap.xml') self::sitemap();
        $slug = substr(trim($path, '/'), strlen('corridas/'));
        $post = $slug === '' ? null : get_page_by_path($slug, OBJECT, 'corrida');
        if ($slug !== '' && !$post) {
            $old = self::oldSlug($slug);
            if ($old) {
                wp_safe_redirect(self::url('/corridas/' . $old->post_name), 301);
                exit;
            }
        }
        $found = $slug === '' || ($post && $post->post_status === 'publish' && !$post->post_password);
        if ($found && str_ends_with($path, '/')) {
            $query = $_SERVER['QUERY_STRING'] ?? '';
            wp_safe_redirect(self::url(rtrim($path, '/') . ($query === '' ? '' : '?' . $query)), 301);
            exit;
        }

        $race = $found && $post ? Rest::project($post) : null;
        $catalog = $found && !$post ? array_map([Rest::class, 'project'], self::posts()) : [];
        $canonical = $found ? self::url(rtrim($path, '/')) : '';
        $title = $race['name'] ?? ($found ? 'Escolha suas corridas' : 'Corrida não encontrada');
        $description = $race
            ? wp_trim_words($race['description'] ?? '', 28, '…')
            : 'Consulte as corridas atendidas pelo serviço de retirada de kits da Re Almeida Kits.';
        if ($description === '' && $race) $description = 'Retirada de kits para ' . $race['name'] . ' com a Re Almeida Kits.';
        $image = $race['image']['url'] ?? self::url('/brand/logo-corredor-original.jpg');
        $indexable = $found && empty($race['configurationError']) && self::indexable();

        status_header($found ? 200 : 404);
        header('Content-Type: text/html; charset=UTF-8');
        if (!$indexable) header('X-Robots-Tag: noindex, nofollow');
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'HEAD') exit;
        require __DIR__ . '/PublicRaceTemplate.php';
        exit;
    }

    private static function sitemap(): never {
        if (!self::indexable()) {
            status_header(404);
            header('X-Robots-Tag: noindex, nofollow');
            exit;
        }
        status_header(200);
        header('Content-Type: application/xml; charset=UTF-8');
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'HEAD') exit;
        echo '<?xml version="1.0" encoding="UTF-8"?>';
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        foreach (['/', '/corridas', '/orientacoes', '/privacidade'] as $path) {
            echo '<url><loc>' . esc_xml(self::url($path)) . '</loc></url>';
        }
        foreach (self::posts() as $post) {
            if (!empty(Rest::project($post)['configurationError'])) continue;
            echo '<url><loc>' . esc_xml(self::url('/corridas/' . $post->post_name)) . '</loc>';
            $modified = get_post_modified_time(DATE_W3C, true, $post);
            if ($modified) echo '<lastmod>' . esc_xml($modified) . '</lastmod>';
            echo '</url>';
        }
        echo '</urlset>';
        exit;
    }

    public static function assets(): array {
        $manifest = dirname(rtrim(ABSPATH, '/\\')) . '/.vite/manifest.json';
        if (!is_readable($manifest)) return [];
        $entries = json_decode((string) file_get_contents($manifest), true);
        $entry = $entries['index.html'] ?? [];
        // The public shell uses the same entry as the SPA, including its CSS.
        return is_array($entry) ? $entry : [];
    }

    public static function image(?array $image, string $class = '', bool $lazy = false): void {
        if (empty($image['url'])) return;
        printf('<img class="%s" src="%s" alt="%s" width="%d" height="%d"%s>',
            esc_attr($class), esc_url($image['url']), esc_attr($image['alt']),
            $image['width'], $image['height'], $lazy ? ' loading="lazy"' : '');
    }

    public static function availability(array $race): string {
        return match ($race['status']) {
            'open' => 'Inscrições abertas',
            'closed' => 'Inscrições encerradas',
            default => 'Indisponível',
        };
    }

    public static function date(string $value, string $format): string {
        if ($value === '') return '';
        return (new \DateTimeImmutable($value, new \DateTimeZone('America/Sao_Paulo')))
            ->setTimezone(new \DateTimeZone('America/Sao_Paulo'))->format($format);
    }

}
