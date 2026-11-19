<?php
defined('ABSPATH') || exit;

add_filter('body_class', static function (array $classes): array {
    $classes[] = 'rak-native';
    return $classes;
});

add_action('wp_enqueue_scripts', static function (): void {
    // Apache serves the same tokens and fonts to React, PHP race pages and WordPress.
    $parts = wp_parse_url(home_url());
    $root = $parts['scheme'] . '://' . $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '');
    wp_enqueue_style('rak-design', $root . '/design/tokens.css', [], '1.0.0');
    wp_enqueue_style('rak-chrome', $root . '/design/chrome.css', ['rak-design'], wp_get_theme()->get('Version'));
    wp_enqueue_script('rak-navigation', get_theme_file_uri('navigation.js'), [], wp_get_theme()->get('Version'), ['strategy' => 'defer', 'in_footer' => true]);
    wp_enqueue_script('rak-whatsapp', $root . '/design/whatsapp.js', [], '1.0.0', true);
    wp_enqueue_style('rak-native', get_stylesheet_uri(), ['rak-chrome'], wp_get_theme()->get('Version'));
});

remove_action('wp_head', 'wp_site_icon', 99);
add_action('wp_head', static function (): void {
    echo '<link rel="icon" href="/favicon.ico" sizes="any">' . "\n";
}, 99);

// Use the child theme's canonical chrome even when an older template part is saved in the Site Editor.
add_filter('render_block_core/template-part', static function (string $content, array $block): string {
    $slug = $block['attrs']['slug'] ?? '';
    if (!in_array($slug, ['header', 'footer'], true)) return $content;
    $file = get_stylesheet_directory() . '/parts/' . $slug . '.html';
    if (!is_readable($file)) return $content;
    $html = do_blocks(file_get_contents($file));
    if ($slug !== 'header') return $html;

    $route = null;
    if (function_exists('is_wc_endpoint_url') && (is_wc_endpoint_url('order-received') || is_wc_endpoint_url('orders') || is_wc_endpoint_url('view-order'))) {
        $route = 'orders';
    } elseif (function_exists('is_checkout') && is_checkout()) {
        $route = 'checkout';
    } elseif (function_exists('is_account_page') && is_account_page()) {
        $route = 'account';
    }
    $tags = new WP_HTML_Tag_Processor($html);
    while ($tags->next_tag('A')) {
        if ($route !== null && $tags->get_attribute('data-rak-route') === $route) {
            $tags->set_attribute('aria-current', 'location');
        }
    }
    return $tags->get_updated_html();
}, 10, 2);

add_filter('woocommerce_thankyou_order_received_title', static function (string $title, $order): string {
    if (!$order instanceof WC_Order || !$order->get_meta('_rak_request_id')) {
        return $title;
    }
    return match ($order->get_status()) {
        'cancelled' => 'Pedido cancelado',
        'refunded' => 'Pedido reembolsado',
        'failed' => 'Pagamento não concluído',
        default => 'Pedido recebido',
    };
}, 10, 2);

add_filter('woocommerce_thankyou_order_received_text', static function (string $message, $order): string {
    if (!$order instanceof WC_Order || !$order->get_meta('_rak_request_id')) {
        return $message;
    }
    if (class_exists('ReAlmeida\\Kits\\RequestQueue') && \ReAlmeida\Kits\RequestQueue::paid($order)) {
        return 'O pagamento foi confirmado.';
    }
    if ($order->has_status(['cancelled', 'refunded', 'failed'])) return $message;
    if ((float) $order->get_total_refunded() > 0) return 'O pedido tem um reembolso parcial.';
    return 'Acompanhe a situação do pagamento em Meus pedidos.';
}, 10, 2);
