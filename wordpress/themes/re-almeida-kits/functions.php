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
    wp_enqueue_script('rak-whatsapp', $root . '/design/whatsapp.js', [], '1.0.0', true);
    wp_enqueue_style('rak-native', get_stylesheet_uri(), ['rak-design'], wp_get_theme()->get('Version'));
});

add_filter('woocommerce_thankyou_order_received_text', static function (string $message, $order): string {
    if (!$order instanceof WC_Order) {
        return $message;
    }
    if (class_exists('ReAlmeida\\Kits\\RequestQueue') && \ReAlmeida\Kits\RequestQueue::paid($order)) {
        return 'Pedido recebido. O pagamento foi confirmado.';
    }
    if ($order->has_status(['pending', 'on-hold'])) {
        return 'Pedido recebido. Acompanhe a situação do pagamento em Meus pedidos.';
    }
    return 'Consulte a situação e as orientações abaixo.';
}, 10, 2);
