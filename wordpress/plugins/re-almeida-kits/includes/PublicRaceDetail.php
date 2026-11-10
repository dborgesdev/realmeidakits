<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
?>
<section class="race-hero">
    <?php PublicPages::image($entry['image'] ?? null); ?>
    <div>
        <span class="eyebrow">CORRIDAS</span>
        <h1><?= esc_html($entry['name']) ?></h1>
        <p><?= esc_html($entry['description'] ?? '') ?></p>
    </div>
</section>
<div class="detail-grid">
    <?php if (!empty($entry['image'])): ?>
        <?php PublicPages::image($entry['image'], 'detail-image', true); ?>
    <?php else: ?>
        <div class="panel">Imagem ainda não cadastrada.</div>
    <?php endif; ?>
    <div class="panel">
        <span class="availability <?= $availability($entry) ?>"><?= esc_html(PublicPages::availability($entry)) ?></span>
        <h2>Uma corrida, suas próprias opções</h2>
        <p>Confira as opções do serviço de retirada de kits da Re Almeida Kits.</p>
        <?php if (!empty($entry['raceDate'])): ?>
            <p>Data da corrida <?= esc_html(PublicPages::date($entry['raceDate'], 'd/m/Y')) ?></p>
        <?php endif; ?>
        <?php if (!empty($entry['location']) || !empty($entry['raceTime'])): ?>
            <p><?= esc_html(implode(' · ', array_filter([$entry['location'], $entry['raceTime']]))) ?></p>
        <?php endif; ?>
        <?php if (!empty($entry['closesAt'])): ?>
            <p>Prazo <?= esc_html(PublicPages::date($entry['closesAt'], 'd/m/Y H:i')) ?> (Brasília)</p>
        <?php endif; ?>
        <?php if (array_key_exists('priceCents', $entry)): ?>
            <p>Preço inicial do serviço <?= esc_html($entry['priceCents'] === null ? 'a confirmar' : 'R$ ' . number_format($entry['priceCents'] / 100, 2, ',', '.')) ?></p>
        <?php endif; ?>
        <?php foreach ($entry['modalities'] ?? [] as $mode): ?>
            <section>
                <h3><?= esc_html($mode['label']) ?></h3>
                <p>Distâncias <?= esc_html(implode(' / ', $mode['distances'])) ?></p>
                <?php PublicPages::image($mode['shirtImage'], 'shirt-preview', true); ?>
                <?php if ($mode['sizes']): ?><p>Tamanhos <?= esc_html(implode(' / ', $mode['sizes'])) ?></p><?php endif; ?>
                <?php if ($mode['shirtEnabled']): ?><p>Camiseta com número</p><?php endif; ?>
                <?php if ($mode['numberEnabled']): ?><p>Somente número</p><?php endif; ?>
                <?php foreach ($mode['kitTypes'] as $kit): ?>
                    <p><?= esc_html($kit['label']) ?></p>
                <?php endforeach; ?>
                <?php if ($mode['pickups']): ?>
                    <h4>Pontos de retirada</h4>
                    <ul>
                        <?php foreach ($mode['pickups'] as $pickup): ?>
                            <li><?= esc_html(implode(' · ', array_filter([$pickup['label'], $pickup['address'], PublicPages::date($pickup['at'], 'd/m/Y H:i'), $pickup['guidance']]))) ?></li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
                <?php if ($mode['documents']): ?>
                    <h4>Documentos</h4>
                    <ul>
                        <?php foreach ($mode['documents'] as $doc): ?>
                            <li>
                                <?= esc_html($doc['label'] . ($doc['required'] ? '' : ' · opcional')) ?>
                                <?php if ($doc['guidance']): ?><p><?= esc_html($doc['guidance']) ?></p><?php endif; ?>
                                <?php if (!empty($doc['template']['url'])): ?>
                                    <a href="<?= esc_url($doc['template']['url']) ?>">Baixar modelo em branco</a>
                                <?php endif; ?>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
            </section>
        <?php endforeach; ?>
        <?php if (!empty($entry['guidance'])): ?><h3>Orientações</h3><p><?= nl2br(esc_html($entry['guidance'])) ?></p><?php endif; ?>
        <?php if (!empty($entry['contact'])): ?><p><?= esc_html($entry['contact']) ?></p><?php endif; ?>
        <?php foreach ($entry['conditions'] ?? [] as $condition): ?>
            <p class="caption">Condição · versão <?= (int) $condition['version'] ?>: <?= esc_html($condition['text']) ?></p>
        <?php endforeach; ?>
        <?php if (!empty($entry['whatsappUrl'])): ?>
            <p><a href="<?= esc_url($entry['whatsappUrl'], ['https']) ?>" target="_blank" rel="noopener noreferrer">Grupo da corrida</a></p>
        <?php endif; ?>
        <div data-race-selection="<?= esc_attr($entry['id']) ?>"></div>
        <p><a href="/corridas">Ver todas as corridas</a></p>
    </div>
</div>
