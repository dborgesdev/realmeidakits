<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
final class WooCommerce {
    public static function boot(): void {
        add_action('before_woocommerce_init', static function (): void {
            if (class_exists('Automattic\\WooCommerce\\Utilities\\FeaturesUtil')) {
                \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', FILE, true);
            }
        });
        // No orders, cart, checkout or gateway hooks in this release.
    }
}
