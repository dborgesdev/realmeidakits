# Validação da V1 revisada — 15/10/2026

Branch `feat/v1-site`. Sem commit, push, PR, merge ou publicação.

## Verificações executadas

- `pnpm typecheck`: passou.
- `pnpm lint`: passou.
- `pnpm test`: 4 testes passaram. Cobertura de requisitos documentais/autorização, MIME e limite de arquivo, matrícula APPAI, tamanho condicional, campos de Kit oficial e nascimento/telefone condicionais; data futura e data impossível rejeitadas.
- `pnpm build`: passou. Saída estática `dist/`; bundle JS 300,11 kB (94,49 kB gzip), CSS 21,26 kB (5,69 kB gzip).
- Kit oficial / Corrida da Primavera: identificação, dados sem campos APPAI/nascimento/telefone, documentos sem autorização, bloqueio por documentos ausentes, revisão, Pix simulado e confirmação com voucher.
- APPAI / Circuito Rio Antigo: nascimento/telefone ilustrativos, matrícula, somente número de peito sem campo tamanho, documentos com autorização obrigatória, revisão, cartão simulado e voucher.
- APPAI camiseta: matrícula inválida bloqueada pela validação do formulário; matrícula corrigida e tamanho G permitem avançar. Retorno por teclado preserva tamanho G.
- Acesso direto à confirmação em nova aba sem estado redireciona à modalidade.
- `/admin-demo` e `/minha-conta`: página 404; home, navegação e footer sem links para essas áreas.
- Home, formulário APPAI e voucher: medidas em 320, 375, 768, 1024 e 1440 px, sem overflow horizontal. Inspeção visual desktop/mobile; cards e campos com contraste, agrupamentos e etapas visíveis.
- Capturas atualizadas em `docs/qa/`: home-desktop.png, home-preview.png, form-desktop.png, form-mobile.png e voucher-desktop.png.
- Console na nova aba com carregamento limpo e identificação/formulário: nenhum erro. Durante a edição houve erro transitório do contexto React causado pela atualização a quente do módulo; não reapareceu no carregamento limpo.
- Revisão do código: sem leitura de conteúdo de arquivo, upload remoto, armazenamento persistente, autenticação ou pagamento real. Fixtures individuais separadas em `src/data/demo.ts`; componentes e regras separados. CSS e fixtures exclusivas das áreas removidas excluídos.
- SEO existente preservado: title, description, canonical configurável, OG/Twitter, favicon, noindex e robots bloqueado para conteúdo demonstrativo. Rewrite SPA Vercel preservado.

## Limites

Não houve deploy Vercel; fallback configurado, não testado em domínio publicado. Não foi executada auditoria completa WCAG, leitor de tela, matriz de navegadores ou testes em aparelhos físicos. Seletor nativo de arquivos não exercitado nesta revisão; MIME/tamanho cobertos por testes de regras. Não há PDF, QR operacional, pedido, cobrança ou envio de e-mail.

Campos exatos dos formulários originais e detalhes de áudios continuam pendentes. Variações por corrida e grade de camiseta são exemplos explicitamente rotulados. As decisões futuras WordPress/WooCommerce estão em `docs/integration.md`; nenhum contrato de API foi inventado.

## Preparação para Cloudflare Workers

Validação adicional em 15/10/2026: typecheck, lint, cinco testes (incluindo configuração de implantação), build e dry-run Wrangler aprovados. Static Assets em `dist`, fallback SPA, sem backend, bindings ou domínio personalizado. Sessão OAuth oficial verificada; nenhum token no projeto. Wrangler adicionado ao lockfile e scripts de instalação limitados a esbuild/workerd. Referência visual movida para docs para não compor o deploy. Credenciais, logs e artefatos gerados ignorados pelo Git. A publicação pública e suas verificações são posteriores ao merge; resultados serão informados no relatório de entrega.
