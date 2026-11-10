<?php
/** Run only against the disposable local WordPress/WooCommerce fixture. */
require $argv[1] . '/wp-load.php';
if (wp_parse_url(home_url(), PHP_URL_HOST) !== '127.0.0.1') exit(1);
use ReAlmeida\Kits\{Accounts, KitOrderRepository, PickupLibrary, RaceRegistrations, Schema};
global $wpdb;
$order = wc_create_order(['customer_id' => 1]);
$request = 0;
$location = 0;
$cpf = '00000000000'; // Synthetic storage key, deliberately invalid as a real CPF.
$line = ['cpf' => $cpf, 'raceId' => '987654123', 'participantId' => 1];
try {
    $request = KitOrderRepository::reserve(1, wp_generate_uuid4(), ['lines' => [$line]]);
    if (!$request || !KitOrderRepository::attach($request, $order->get_id())) throw new RuntimeException('Falha no vínculo sintético.');
    if (!RaceRegistrations::conflicts([$line], false)) throw new RuntimeException('Pedido pendente recente precisa reservar o par.');
    if (RaceRegistrations::conflicts([array_replace($line, ['raceId' => '987654124'])], false)) throw new RuntimeException('Outra corrida bloqueada.');
    if (RaceRegistrations::conflicts([array_replace($line, ['cpf' => '11111111111'])], false)) throw new RuntimeException('Outro CPF bloqueado.');
    $order->update_status('cancelled');
    if (RaceRegistrations::conflicts([$line], false)) throw new RuntimeException('Pedido cancelado bloqueou a vaga.');
    $order->set_status('pending');
    $order->set_date_created(time() - 7 * DAY_IN_SECONDS);
    $order->save();
    if (RaceRegistrations::conflicts([$line], true) || !wc_get_order($order->get_id())->has_status('cancelled')) {
        throw new RuntimeException('Pedido pendente expirado não foi liberado com segurança.');
    }
    $order->set_status('pending');
    $order->save();
    $order->payment_complete();
    if (!RaceRegistrations::conflicts([$line], false)) throw new RuntimeException('Pedido pago não bloqueou o CPF.');
    $race = Schema::validate(['status' => 'open', 'officialEnabled' => true, 'priceCents' => 2600, 'sizes' => ['PP', 'XGG'], 'shirtImageId' => 0,
        'distances' => [['id' => 'distance', 'label' => '5 km', 'modality' => 'oficial']],
        'kits' => [['id' => 'kit', 'label' => 'Opção sintética', 'additionalCents' => 500]]]);
    if (is_wp_error($race)) throw new RuntimeException($race->get_error_message());
    if ($race['officialCents'] !== 2600 || $race['kits'][0]['additionalCents'] !== 500 ||
        $race['sizes'] !== ['PP', 'XGG']) throw new RuntimeException('Preços legados, adicional ou grade não preservados.');
    $location = wp_insert_post(['post_type' => 'rak_pickup', 'post_status' => 'publish', 'post_title' => 'DEMONSTRAÇÃO local']);
    $save = new ReflectionMethod(PickupLibrary::class, 'store');
    $old = $save->invoke(null, $location, 'DEMONSTRAÇÃO local', 'Endereço sintético A', true);
    $new = $save->invoke(null, $location, 'DEMONSTRAÇÃO local', 'Endereço sintético B', false);
    if ($old['id'] !== $new['id'] || $new['version'] !== 2 ||
        get_post_meta($location, '_rak_pickup_1', true)['address'] !== 'Endereço sintético A' ||
        in_array($location, array_column(PickupLibrary::available(), 'libraryId'), true)) {
        throw new RuntimeException('A biblioteca alterou o endereço histórico ou exibiu local inativo.');
    }
    echo "OK unicidade, expirados, cancelados, pagamentos, preço legado, adicional, grade e versões de locais\n";
} finally {
    if ($request) $wpdb->delete(Accounts::table('requests'), ['id' => $request]);
    if ($location) wp_delete_post($location, true);
    $order->delete(true);
}
