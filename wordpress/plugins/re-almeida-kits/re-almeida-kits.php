<?php
/**
 * Plugin Name: Re Almeida Kits
 * Description: Cadastro administrativo e catálogo público de serviços de retirada de kits.
 * Version: 1.10.0
 * Requires at least: 6.7
 * Requires PHP: 8.3
 * Text Domain: re-almeida-kits
 */
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
const VERSION = '1.10.0';
const SCHEMA_VERSION = 6;
const CAPABILITY = 'manage_re_almeida_kits';
const FILE = __FILE__;
foreach (['Identity', 'Accounts', 'NativeSession', 'AccountAuth', 'DraftInput', 'RequestDrafts', 'RequestSettings', 'PrivateDocumentStore', 'PersonalDocuments', 'OrderDocuments', 'DraftDocuments', 'CheckoutInput', 'RaceRegistrations', 'KitOrderRepository', 'KitOrders', 'RequestOperations', 'RequestQueue', 'RequestExport', 'RequestAdmin', 'AccountPage', 'PublicModels', 'Library', 'PickupLibrary', 'RacePrices', 'Schema', 'Repository', 'Races', 'Duplicate', 'Admin', 'Rest', 'PublicPages', 'Migrations', 'WooCommerce'] as $class) {
    require_once __DIR__ . '/includes/' . $class . '.php';
}
register_activation_hook(__FILE__, [Migrations::class, 'upgrade']);
foreach (['VoucherRepository', 'Vouchers', 'VoucherMail', 'VoucherPdf', 'VoucherPickup', 'ActionLinks', 'TransactionalMail', 'NotificationQueue', 'RequestFinance'] as $class) {
    require_once __DIR__ . '/includes/' . $class . '.php';
}
Vouchers::boot();
VoucherMail::boot();
VoucherPickup::boot();
ActionLinks::boot();
NotificationQueue::boot();
RequestFinance::boot();
add_action('init', [Migrations::class, 'upgrade'], 20);
add_action('init', [Races::class, 'register']);
PublicModels::boot();
Library::boot();
PickupLibrary::boot();
Duplicate::boot();
Admin::boot();
Rest::boot();
PublicPages::boot();
AccountAuth::boot();
RequestDrafts::boot();
DraftDocuments::boot();
PersonalDocuments::boot();
OrderDocuments::boot();
RequestSettings::boot();
KitOrders::boot();
RaceRegistrations::boot();
RequestAdmin::boot();
NativeSession::boot();
WooCommerce::boot();
