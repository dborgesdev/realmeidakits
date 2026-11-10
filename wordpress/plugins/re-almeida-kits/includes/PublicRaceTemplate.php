<?php
namespace ReAlmeida\Kits;
defined('ABSPATH') || exit;
$assets = PublicPages::assets();
$availability = static fn(array $entry): string => $entry['status'] === 'open' ? 'available' : 'closed';
?>
<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="referrer" content="no-referrer">
    <title><?= esc_html($title) ?> | Re Almeida Kits</title>
    <meta name="description" content="<?= esc_attr($description) ?>">
    <?php if (!$indexable): ?><meta name="robots" content="noindex,nofollow"><?php endif; ?>
    <?php if ($canonical): ?>
        <link rel="canonical" href="<?= esc_url($canonical) ?>">
        <meta property="og:type" content="website">
        <meta property="og:title" content="<?= esc_attr($title) ?>">
        <meta property="og:description" content="<?= esc_attr($description) ?>">
        <meta property="og:url" content="<?= esc_url($canonical) ?>">
        <meta property="og:image" content="<?= esc_url($image) ?>">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="<?= esc_attr($title) ?>">
        <meta name="twitter:description" content="<?= esc_attr($description) ?>">
        <meta name="twitter:image" content="<?= esc_url($image) ?>">
    <?php endif; ?>
    <?php if ($race && $indexable): ?>
        <script type="application/ld+json"><?= wp_json_encode([
            '@context' => 'https://schema.org', '@type' => 'WebPage',
            'name' => $title, 'description' => $description, 'url' => $canonical,
        ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?></script>
    <?php endif; ?>
    <link rel="icon" href="/brand/logo-corredor-original.jpg">
    <?php foreach ($assets['css'] ?? [] as $css): ?><link rel="stylesheet" href="<?= esc_url('/' . $css) ?>"><?php endforeach; ?>
    <?php if (!empty($assets['file'])): ?><script type="module" src="<?= esc_url('/' . $assets['file']) ?>"></script><?php endif; ?>
</head>
<body>
<div id="public-header">
    <a class="skip" href="#conteudo">Pular para o conteúdo</a>
    <header class="header">
        <nav class="container header-inner" aria-label="Navegação principal">
            <a href="/"><img class="brand" src="/brand/logo-corredor-original.jpg" width="180" height="65" alt="Re Almeida Kits, início"></a>
            <a href="/corridas">Corridas</a>
            <a href="/conta">Minha conta</a>
        </nav>
    </header>
</div>
<main id="conteudo" tabindex="-1" class="flow-shell">
    <div class="container page">
        <?php if (!$found): ?>
            <h1>Corrida não encontrada</h1>
            <p><a href="/corridas">Ver corridas publicadas</a></p>
        <?php elseif ($race): ?>
            <?php $entry = $race; require __DIR__ . '/PublicRaceDetail.php'; ?>
        <?php else: ?>
            <div class="page-title">
                <span class="eyebrow">PARA VOCÊ OU MAIS PESSOAS</span>
                <h1>Escolha suas corridas</h1>
                <p>Selecione uma ou várias corridas e configure as opções de cada participante.</p>
            </div>
            <div id="public-preference"></div>
            <div class="grid three">
                <?php if (!$catalog): ?><p role="status">Nenhuma corrida publicada no momento.</p><?php endif; ?>
                <?php foreach ($catalog as $entry): ?>
                    <article class="event-card">
                        <div class="event-image">
                            <?php if (!empty($entry['image'])): ?>
                                <?php PublicPages::image($entry['image'], '', true); ?>
                            <?php else: ?>
                                <div class="event-image-missing">Imagem ainda não cadastrada</div>
                            <?php endif; ?>
                        </div>
                        <div class="card-body">
                            <h2><?= esc_html($entry['name']) ?></h2>
                            <span class="availability <?= $availability($entry) ?>"><?= esc_html(PublicPages::availability($entry)) ?></span>
                            <p class="icon-line"><?= esc_html(PublicPages::date($entry['raceDate'] ?? '', 'd/m/Y') ?: 'Data a confirmar') ?></p>
                            <?php if (!empty($entry['closesAt'])): ?>
                                <p class="caption">Prazo <?= esc_html(PublicPages::date($entry['closesAt'], 'd/m/Y H:i')) ?> (Brasília)</p>
                            <?php endif; ?>
                            <p class="icon-line"><?= esc_html(($entry['location'] ?? '') ?: 'Local a confirmar') ?></p>
                            <p class="caption"><?= esc_html(implode(' · ', array_column($entry['modalities'] ?? [], 'label'))) ?></p>
                            <div class="card-selection">
                                <div data-race-selection="<?= esc_attr($entry['id']) ?>"></div>
                                <a class="text-link" href="<?= esc_url('/corridas/' . $entry['slug']) ?>">Conhecer corrida →</a>
                            </div>
                        </div>
                    </article>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        <?php if ($found): ?><div id="public-selection"></div><?php endif; ?>
    </div>
</main>
<div id="public-footer">
    <footer class="footer"><div class="container">
        <p>Re Almeida Kits · Serviço de retirada de kits de corrida.</p>
        <a href="/orientacoes">Orientações</a> · <a href="/privacidade">Privacidade</a>
    </div></footer>
</div>
<div id="public-races"></div>
</body>
</html>
