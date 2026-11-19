<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;

$timezone = new \DateTimeZone('America/Sao_Paulo');
$facts = [
    ['calendar', 'Data do evento', empty($entry['raceDate']) ? '' :
        wp_date('j \d\e F \d\e Y', (new \DateTimeImmutable($entry['raceDate'], $timezone))->getTimestamp(), $timezone)],
    ['clock', 'Horário do evento', $entry['raceTime'] ?? ''],
    ['pin', 'Local do evento', $entry['location'] ?? ''],
];
$icons = [
    'calendar' => 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
    'clock' => 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM12 6v6l4 2',
    'pin' => 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z',
];
$window = array_filter([
    'Início das solicitações' => $entry['opensAt'] ?? '',
    'Encerramento das solicitações' => $entry['closesAt'] ?? '',
]);
$prices = $entry['prices'] ?? array_fill_keys(['official', 'shirt', 'number'], $entry['priceCents'] ?? null);
$money = static fn(?int $cents): string => $cents === null ? 'A confirmar' : 'R$ ' . number_format($cents / 100, 2, ',', '.');
$amounts = [];
$locations = [];
foreach ($entry['modalities'] ?? [] as $mode) {
    if ($mode['id'] === 'oficial') {
        $amounts['Valor da retirada — Kit Oficial'] = [$money($prices['official'] ?? null)];
    }
    if ($mode['id'] === 'appai') {
        $values = [];
        if (!empty($mode['shirtEnabled'])) $values[] = $money($prices['shirt'] ?? null);
        if (!empty($mode['numberEnabled'])) $values[] = $money($prices['number'] ?? null);
        if ($values) $amounts['Valor da retirada — APPAI'] = array_unique($values);
    }
    foreach ($mode['pickups'] ?? [] as $pickup) {
        $location = implode(' · ', array_filter([$pickup['label'] ?? '', $pickup['address'] ?? '']));
        if ($location !== '') $locations[$location] = true;
    }
}
?>
<article class="race-detail">
    <a class="text-link" href="/corridas">← Todas as corridas</a>
    <header class="race-feature<?= empty($entry['image']['url']) ? '' : ' has-photo' ?>">
        <?php PublicPages::image($entry['image'] ?? null, 'race-detail-image'); ?>
        <div class="race-feature-content">
            <h1><?= esc_html($entry['name']) ?></h1>
            <div class="race-feature-selection">
                <div data-race-selection="<?= esc_attr($entry['id']) ?>"></div>
                <?php if (($entry['status'] ?? '') !== 'open'): ?>
                    <span class="availability closed"><?= esc_html(PublicPages::availability($entry)) ?></span>
                <?php endif; ?>
            </div>
        </div>
    </header>

    <section class="race-info-card">
        <h2>Sobre a corrida</h2>
        <dl class="race-facts">
            <?php foreach ($facts as [$icon, $label, $value]): ?>
                <?php if ($value === '') continue; ?>
                <div>
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="<?= esc_attr($icons[$icon]) ?>"/></svg>
                    <dt><?= esc_html($label) ?></dt>
                    <dd><?= esc_html($value) ?></dd>
                </div>
            <?php endforeach; ?>
        </dl>
    </section>

    <section class="race-info-card">
        <h2>Retirada de kits</h2>
        <dl class="race-service">
            <?php foreach ($window as $label => $value): ?>
                <div><dt><?= esc_html($label) ?></dt><dd><?= esc_html(PublicPages::date($value, 'd/m/Y \à\s H:i')) ?></dd></div>
            <?php endforeach; ?>
            <?php if ($locations): ?>
                <div class="race-service-location">
                    <dt>Local de retirada</dt>
                    <?php foreach (array_keys($locations) as $location): ?>
                        <dd><?= esc_html($location) ?></dd>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
            <?php foreach ($amounts as $label => $values): ?>
                <div class="race-service-price">
                    <dt><?= esc_html($label) ?></dt>
                    <dd><?= esc_html(implode(' ou ', $values)) ?></dd>
                </div>
            <?php endforeach; ?>
        </dl>
    </section>
</article>
