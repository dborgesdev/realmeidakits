<?php
/**
 * Plugin Name: Re Almeida Kits
 * Description: Cadastro administrativo e catálogo público de serviços de retirada de kits.
 * Version: 1.2.0
 * Requires at least: 6.7
 * Requires PHP: 8.3
 * Text Domain: re-almeida-kits
 */
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
const VERSION = '1.2.0';
const SCHEMA_VERSION = 3;
const CAPABILITY = 'manage_re_almeida_kits';
const FILE = __FILE__;
foreach (['Identity', 'Accounts', 'AccountAuth', 'AccountPage', 'PublicModels', 'Library', 'Schema', 'Repository', 'Races', 'Duplicate', 'Admin', 'Rest', 'Migrations', 'WooCommerce'] as $class) {
    require_once __DIR__ . '/includes/' . $class . '.php';
}
register_activation_hook(__FILE__, [Migrations::class, 'upgrade']);
add_action('init', [Migrations::class, 'upgrade'], 20);
add_action('init', [Races::class, 'register']);
PublicModels::boot();
Library::boot();
Duplicate::boot();
Admin::boot();
Rest::boot();
AccountAuth::boot();
WooCommerce::boot();
