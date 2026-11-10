# Publicação e reversão na HostGator

O Apache serve a distribuição React no document root. O WordPress restaurado fica em `app/`, com `WP_HOME` e `WP_SITEURL` apontando para `https://realmeidakits.com.br/app`. Preserve banco, chaves, usuários, uploads e tabelas do plugin. Confira se URLs da biblioteca e links editoriais gravados antes da mudança de domínio resolvem corretamente. Corrija referências antigas em homologação com backup e revisão da substituição.

## Pré-requisitos

- Confirme document root, SSL, redirecionamento para HTTPS sem www, PHP 8.3+, WordPress 6.7+, WooCommerce, MySQL/MariaDB, mbstring, Fileinfo, limites de upload e memória, permissões, compressão e ModSecurity.
- Confirme mod_rewrite, mod_headers e permissão para as diretivas em `.htaccess`. Preserve o `app/.htaccess` do WordPress com permalinks em `/app/`, as regras de segurança e os blocos gerenciados pelo cPanel.
- Configure Minha conta e checkout no WooCommerce. Habilite o cadastro e confirme que Minha conta renderiza `[woocommerce_my_account]` e os hooks do plugin no tema ativo. Mantenha o cadastro fora de Minha conta desabilitado enquanto não houver validação de identidade nesses canais. Verifique o transporte de e-mail.
- Exclua da cache compartilhada conta, checkout, o bootstrap `admin-ajax.php?action=rak_session`, REST privada e downloads do plugin. Preserve Cookie, Set-Cookie, X-WP-Nonce, Cache-Control e X-Robots-Tag.

## Desenvolvimento e homologação

Monte uma réplica isolada em origem única, com o frontend no document root e WordPress em `/app/`. Use uma base separada e dados sintéticos rotulados DEMONSTRAÇÃO em testes de escrita. Proteja staging com autenticação no servidor e desabilite `blog_public`. Execute `pnpm build` e copie o conteúdo de `dist`, incluindo arquivos ocultos, para o document root da réplica.

Para HMR, use `pnpm dev` e configure `RAK_DEV_REPLICA` em `.env.local` com o endereço do Apache local. O navegador usa `http://127.0.0.1:5173` e o Vite encaminha `/app/`, `/corridas`, `/sitemap.xml` e `/assets/`. Nesse modo, `WP_HOME` e `WP_SITEURL` devem usar a origem visível ao navegador mais `/app`. As páginas PHP usam os assets compilados da réplica. Recompile após editar seus componentes. Use o endereço do Apache diretamente para validar as regras de produção.

## Preparar e instalar

1. Faça backup verificável do banco, `app/wp-config.php`, plugins, uploads, ambos os `.htaccess` e arquivos estáticos. Guarde uma cópia fora do document root e teste a recuperação em staging.
2. Execute `pnpm build:hostgator` e `pnpm plugin:zip`. A distribuição é o conteúdo de `dist/`, incluindo `.vite/manifest.json`. Confira o SHA-256 de `wordpress/releases/re-almeida-kits.zip` e use **Substituir o atual pelo enviado** no wp-admin.
3. Compare `dist/.htaccess` com as regras atuais. Substitua eventual fallback genérico do frontend anterior e preserve as regras de outras aplicações nos respectivos prefixos, além de `app/.htaccess`. O bloco da raiz delega `/app/` ao WordPress, preserva arquivos existentes, encaminha corridas e sitemap a `app/index.php` e aplica fallback às rotas React.
4. Transfira primeiro os assets com hash e os arquivos públicos. Atualize manifesto, index, robots e regras da raiz na mesma janela. Preserve os assets antigos até encerrar a janela de reversão.
5. Execute o [roteiro de QA](qa-hostgator.md). Após validar integralmente o fluxo nativo, configure `define('RAK_LEGACY_PKCE', false);` no `wp-config.php` e repita os testes. O React desta arquitetura já utiliza a sessão nativa.
6. Após autorização de publicação, habilite `define('RAK_PUBLIC_INDEXING', true);` e a indexação do WordPress. O sitemap exige ambas as opções e o domínio canônico. Confira robots, sitemap, HTML inicial e status HTTP.

## Reversão

Restaure juntos os arquivos estáticos, o manifesto e as regras anteriores. Reinstale a versão anterior do plugin sem desinstalar e restaure as constantes do baseline. A versão 1.3.1 conserva o esquema 3, permitindo voltar à 1.2.0 com os cadastros feitos no intervalo. Restaure banco e uploads somente se necessário e depois de reconciliar alterações posteriores ao backup. Verifique contas, participantes, administração, REST e downloads antes de liberar o tráfego.
