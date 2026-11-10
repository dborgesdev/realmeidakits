# QA da arquitetura HostGator — 09/11/2026

## Ambiente e resultados

A revisão partiu da main sincronizada em `2fa4aadb96d47f5cd877488c2f2da7d29962d56d`. A implementação está na branch local `feat/hostgator-unified-architecture`.

| Verificação | Resultado |
| --- | --- |
| Typecheck, lint e testes Node | 44 testes aprovados. |
| Build | `pnpm build` e `pnpm build:hostgator` verificados com manifesto, configuração Apache e robots por ambiente. |
| Plugin | PHP 8.3.36 validou a sintaxe. As suítes PHP existentes passaram com 34 verificações CORS, 47 de integração, 36 de refinamento e 48 de contas. |
| Páginas públicas | HTTP local confirmou conteúdo editorial no HTML inicial, canonical, Open Graph, assets do manifesto, respostas 200/301/404/405 e rascunhos/protegidos com 404. O sitemap local bloqueou staging. Com a configuração canônica simulada em loopback, entregou XML com lastmod e excluiu rascunhos, protegidos e slugs antigos. |
| Sessão nativa | HTTP local confirmou bootstrap sem cache e bloqueio de origem, cadastro WooCommerce com retorno à solicitação, CPF duplicado, login, edição, redefinição por e-mail interceptado, persistência de participantes entre logins, isolamento, nonce inválido e logout. As rotas PKCE retornaram 404 ao desativar o legado na réplica. |
| Desenvolvimento | O Vite em loopback encaminhou o HTML PHP e o bootstrap. As URLs nativas mantiveram a origem do navegador. |
| Responsividade | Chrome headless exercitou home, catálogo e detalhe em 320, 375, 768 e 1440 px. A revisão visual identificou um título longo cortado em 320 px e o CSS passou a permitir quebra dentro do contêiner. A nova verificação em 320 e 1440 px confirmou o ajuste, seleção pelo teclado e navegação ao WooCommerce sem exceções de JavaScript. A primeira carga intermitente do catálogo na réplica foi recuperada com o botão de nova tentativa. O navegador também cadastrou um titular sintético, retornou autenticado à solicitação, exibiu o perfil e ajustou múltiplas corridas sem sair do formulário. |

Os testes HTTP usaram PHP em loopback, WordPress 6.7.10, WooCommerce 9.9.5, SQLite e registros sintéticos identificados como DEMONSTRAÇÃO. O teste de e-mail interceptou a mensagem localmente. A atualização do conteúdo editorial apareceu por HTTP sem recompilar o frontend. Corridas removidas sem registro de remoção definitiva retornam 404. Um 410 depende de política de remoção e de um registro confiável.

## Homologação na HostGator

1. Em staging protegido, confira regras Apache reais, coexistência de aplicações, permalinks e funcionamento de wp-admin, WooCommerce, API, arquivos estáticos e download de PDFs.
2. Confira SSL e canonical, versões e extensões PHP, MySQL/MariaDB, limites e ModSecurity. Teste cache, compressão e cookies no navegador com a configuração da hospedagem.
3. Repita cadastro, CPF duplicado, login, logout, alteração e recuperação de senha, sessão expirada, nonce inválido e isolamento entre dois titulares de teste. Confirme a entrega de e-mail pelo transporte configurado.
4. Percorra o fluxo React de múltiplas corridas e participantes, com teclado e nas quatro larguras. Verifique responsividade no tema nativo da conta e os estados de erro.
5. Publique, edite, renomeie, encerre e retire de publicação uma corrida de teste em staging. Confira o HTML inicial e os códigos HTTP sem rebuild. Confira o sitemap e a indexação sob a configuração de publicação aprovada.
6. Exercite a reversão documentada e, após validar a substituição, desligue PKCE e repita as verificações de sessão.

## Arquivos para revisão

- Apache e build em `public/.htaccess`, `vite.config.ts`, `index.html`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` e `.env.example`. Foram removidas as configurações Wrangler e Vercel e a versão estática do robots.
- React em `src/App.tsx`, `src/main.tsx`, `src/PublicRaceControls.tsx`, `src/config/catalog.ts`, `src/data/{accountClient,normalizeRace,wordpressClient}.ts`, `src/state/{AccountContext,RequestContext}.tsx` e `src/styles.css`. Os componentes afetados incluem cartões, seletor de corridas, navegação, resumo, participantes e layout. As páginas alteradas incluem Conta, Conclusão, Solicitação e redirecionamentos legados. As páginas públicas React de corridas e o cliente PKCE foram retirados.
- Plugin em `wordpress/plugins/re-almeida-kits`, incluindo o ponto de entrada, `includes/{NativeSession,AccountAuth,Accounts,Identity,WooCommerce,Rest,PublicPages,PublicRaceTemplate,PublicRaceDetail}.php` e `readme.txt`. A distribuição atualizada e o checksum estão em `wordpress/releases`.
- Validações em `tests/{accounts,catalog,deployment,wordpress-direct}.test.mjs` e `tests/wordpress-cors.php`.
- Documentação em `AGENTS.md`, `README.md`, `docs/project.md`, `docs/integration.md`, `docs/wordpress-{setup,implementation,deployment,authentication}.md` e nos relatórios de QA.

## Consolidação funcional — 10/11/2026

Typecheck, lint, 47 testes Node e build HostGator passaram. No PHP local, passaram CORS, rascunhos e integração WordPress. As sete suítes restantes encontraram limitações da réplica (WooCommerce indisponível para criação de pedidos, requisitos de ambiente das suítes de contas e refinamento e configuração ou permissões do armazenamento privado). O responsável pelo projeto confirmou a homologação funcional e autorizou a consolidação com essas limitações registradas.
