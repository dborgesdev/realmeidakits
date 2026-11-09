# Instalação, homologação e atualização na HostGator

Revisão: 05/11/2026. Pacote pronto para homologação. Sem acesso/alteração de produção, commit, push, PR, merge ou deploy.

## Artefato final

- `wordpress/releases/re-almeida-kits.zip`: versão **1.2.0**, esquema **3**, **42.361 bytes**.
- SHA-256: `dc9524b825c2f3e3f898c49e484e056423bcd5646d86fd4cec9f578934d803db`.
- Raiz única `re-almeida-kits/`; arquivos conferidos byte a byte contra fontes e checksum adjacente.
- Somente runtime/readme; sem testes, ambiente local, credenciais, frontend ou anexos privados.

ZIP atualizado porque houve alterações no plugin. Documentação posterior não exige empacotar novamente. Não é preciso compilar React para instalar.

## Configurações externas do Bloco C

1. Backup restaurável e atualização do plugin pelo ZIP 1.2.0, sem desinstalar. WooCommerce já deve fornecer customer; GoSMTP/Brevo existente é reutilizado.
2. HTTPS reconhecido pelo WordPress (home/siteurl e terminação TLS). Segurança/cache devem permitir admin-post.php?action=rak_authorize/rak_end_session, wp-login.php para recuperação e /wp-json/re-almeida/v1/account e /auth, sem cache de conteúdo privado e sem remover Authorization/Origin. Métodos/preflight CORS são tratados pelo plugin; cookies de terceiros não precisam ser habilitados.
3. As origens https://realmeidakits.com.br, https://www.realmeidakits.com.br, Worker atual e loopback 5173–5199 já são permitidas. Somente se o frontend usar outra origem real, registrar essa origem exata por rak_account_origins; callback permanece /conta/retorno. Não há chave administrativa, application password, client secret ou configuração SMTP nova no React.
4. Depois de instalar, testar criação/login/logout, senha e acesso de dois clientes. Confirmar chegada real do e-mail de recuperação pelo Brevo e redefinição; local validou wp_mail com interceptação, sem transmissão. Homologar o caminho WooCommerce carregado/MySQL real, pois o ambiente local utilizou WordPress/SQLite e a função customer provisionada para teste.

Nenhum deploy, atualização no WordPress hospedado ou envio real de e-mail foi executado nesta rodada.

## Pré-requisitos no servidor real

1. Homologação autorizada, backup restaurável de banco/plugins/uploads e responsável pela reversão.
2. WordPress >= 6.7, PHP >= 8.3, Fileinfo, banco MySQL/MariaDB e compatibilidade com plugins/WooCommerce. Local usou WP 6.7.10/PHP 8.3.36/SQLite; WP 6.7.13 informado não foi reproduzido.
3. HTTPS, fuso, permissões de extração/mídia, limites PHP/espaço e PDFs até 5 MB (ou limite menor do servidor).
4. REST e links permanentes; segurança/cache/CDN devem permitir endpoints próprios e download GET/HEAD de `wp-admin/admin-post.php?action=rak_public_model`, inclusive visitante. Respeitar no-store/no-cache; não desabilitar proteção global.
5. Uploads públicos devem receber somente modelos em branco aprovados. Documentos pessoais precisam de infraestrutura privada futura. Conferir backup/retenção dos anexos históricos protegidos.
6. O catálogo público permite automaticamente Vite em localhost/127.0.0.1/[::1], portas 5173–5199, apenas leitura, sem credenciais. Origem pública https://realmeidakits.com.br e filtro rak_public_origins preservados. Nenhum filtro manual é necessário para desenvolvimento local. Worker publicado permanece intacto.

## Instalar e homologar

**Plugins → Adicionar plugin → Enviar plugin → escolher ZIP → Instalar agora → Ativar**. Na atualização, **Substituir o atual pelo enviado**, sem desinstalar. Confirme versão e acesso administrativo. [Primeiro cadastro](wordpress-setup.md).

Crie autorização DEMONSTRAÇÃO com PDF em branco e condição não jurídica. Associe em duas corridas, reabra, remova uma associação e confira independência. Edite/desative biblioteca e confira versões antigas/downloads. Reassocie explicitamente para nova versão. Duplique corrida, revise campos limpos e publique somente teste autorizado.

Percorra oito abas, mudanças não salvas e erro em outra aba. Teste 320, 375, 768 e 1440 px, teclado/foco e mídia real autorizada. Confira REST lista/detalhe, rascunhos/privadas/senha, campos opcionais, versões, CORS/cache. Baixe como visitante e valide conteúdo/headers. Não envie anexos pessoais.

Execute somente pnpm dev, sem arquivo .env/modo de integração: duas pessoas/duas corridas, Oficial/APPAI, documentos/modelos opcionais e ausentes, aceites por corrida, revisão e pagamento bloqueado. Confira carregando/vazio/erro e imagem de camiseta. [Resultados locais e limites](qa-block-b.md).

Homologue WooCommerce HPOS/Checkout Blocks, segurança/cache e MySQL. Declaração de compatibilidade não comprova testes no servidor. GoSMTP/Brevo existente é usado na recuperação de senha. Cron/Action Scheduler e gateway de pagamento permanecem fora deste bloco.

## Migração e reversão

Migração automática em lotes de 25 e idempotente preserva configurações/IDs/versões e cria associações de bibliotecas. Em bases maiores, confira conclusão nas próximas requisições e logs. Teste local migrou legado e comprovou repetição sem duplicar. Atualização nativa 1.0.0 → 1.1.0 preservou snapshots de duas corridas existentes.

Para reverter esquema 3, restaure **backup consistente de banco, plugin e uploads**. Não basta instalar 1.0.0 e continuar editando: editor antigo pode descartar campos novos e não conhece as tabelas de contas. Desativar preserva cadastros, mas interrompe menu/API. Não apague posts/opções/metadados para reverter. Sem atualizador remoto.

A aplicação de desenvolvimento já usa a API real como fonte única. Em 30/10/2026, o servidor hospedado respondeu HTTP 200, mas não autorizou a origem local via CORS. Atualize o plugin hospedado com este ZIP 1.2.0; essa instalação não foi executada nesta tarefa. Depois repita o QA completo no navegador com pnpm dev. Nenhuma mudança no Worker publicado é necessária. O Bloco C acrescenta migração 3 para contas/participantes/sessões; os dados de corridas permanecem preservados.
