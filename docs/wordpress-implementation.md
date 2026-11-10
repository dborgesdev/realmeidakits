# Implementação entregue — refinamento do Bloco B

> Registro histórico. Consulte a [arquitetura vigente](project.md), a [autenticação](wordpress-authentication.md) e o [procedimento HostGator](wordpress-deployment.md).

Revisão: 05/11/2026. Branch `feat/v2-preview`. Plugin **1.2.0**, esquema **3**. Evolução existente, sem reconstrução da jornada e sem novas dependências.

## Bloco C — contas e identificação

Identity valida CPF (dígitos verificadores), nome, telefone, e-mail e nascimento no servidor; identityRules aplica as mesmas regras no React. Accounts cria customer via wc_create_new_customer quando WooCommerce está carregado, com alternativa nativa wp_insert_user somente se a função customer já existe. Usa APIs WordPress para usuários/senhas, sem tabelas internas de pedidos. Perfil é privado em _rak_profile/_rak_cpf e campos de cobrança compatíveis.

Tabela rak_identities tem CPF normalizado único e user_id único; a criação verifica também _rak_cpf, billing_cpf, _billing_cpf e cpf dos usuários existentes, normalizando os valores. Instalação não cria usuários nem altera identidades antigas. Conflitos pré-existentes bloqueiam a vinculação e exigem atendimento, sem mesclar dados. O filtro rak_cpf_meta_keys permite mapear outro campo legado somente se ele existir nesse ambiente.

Tabela rak_participants armazena owner_id, CPF, dados e versão; unique(owner_id,cpf), limite 20 e trava por titular protegem gravações. IDs estáveis e directoryId/directoryVersion no rascunho preparam a ligação participante/corrida. Não há conta automática por participante nem criação de pedido. Não há pesquisa global de CPF ou compartilhamento entre titulares.

AccountAuth/AccountPage oferecem autenticação hospedada no WordPress: nonce e Origin próprios nos formulários; validação de callback exato /conta/retorno, state, PKCE S256, código 120 segundos de uso único; troca REST sem cookies/segredo cliente. Bearer aleatório de 256 bits, 15 minutos, somente memória React, com hash no servidor, origem vinculada e escopo exclusivo de perfil/participantes do customer. O código não concede acesso wp-admin/core REST. Cookies nativos HttpOnly/HTTPS permanecem apenas no domínio WordPress; navegação de primeiro nível evita dependência de cookies de terceiros. Login usa wp_signon; recuperação/redefinição usam o WordPress nativo e wp_mail, aproveitando GoSMTP/Brevo. Logout e troca de senha revogam acessos.

Endpoint protegido revalida titular no servidor, ignora IDs de owner enviados pelo cliente, exige bearer/origem e aplica no-store/private. Métodos: POST /auth/token, POST /auth/logout, GET/PUT /account, GET/POST /account/participants, PUT/DELETE /account/participants/{id}, sob /wp-json/re-almeida/v1. Erros 401/403/404/409 não retornam dados de outro titular. Corpos limitados, trava de identidade, unicidade no banco, limite de tentativas e controle de versão complementam permissões.

Migração 3 cria apenas três tabelas próprias, sem apagar corridas, bibliotecas, usuários ou pedidos. Deletar usuário WordPress remove suas sessões e participantes. Frontend AccountContext carrega perfil/diretório reais, e RequestContext mantém apenas o rascunho das opções. Minha conta funciona mesmo se o catálogo estiver indisponível. Checkout, pagamento, pedido e upload privado permanecem futuros.

## Estrutura

| Área | Responsabilidade |
| --- | --- |
| Races / Repository / Schema | CPT corrida, _rak_race, sanitização/validação; histórico _rak_condition_history |
| Admin / admin.js / admin.css | Oito abas, teclado, preservação entre abas, erros com foco, mídia e salvamento recuperável |
| Library | CPTs privados rak_document/rak_condition; menu nativo, criação inline autenticada, referências estáveis e histórico |
| PublicModels | Aprovação administrativa de PDF em branco e download público validado |
| Duplicate | Ação nativa protegida, rascunho e revisão antes de publicar |
| Migrations | Migrações incrementais não destrutivas: bibliotecas no esquema 2, contas no esquema 3 |
| Rest | Endpoints existentes, projeção pública permitida e CORS restrito com loopback local automático |
| WooCommerce | Declaração HPOS, sem escrita direta em tabelas de pedidos |
| React | Normalização compatível, documentos informativos/obrigatórios/opcionais, modelos e aceites por corrida |

Oito abas: Informações gerais, Inscrições, Modalidades e distâncias, Kits/camisetas/valores, Retirada, Documentos, Condições e Comunicação. Só painel ativo visível; setas/Home/End navegam pelas abas. Publicar/atualizar permanece nativo. Validação atravessa painéis ocultos e mostra resumo, indicador e foco. Tentativas inválidas preservam configuração pública anterior e valores administrativos por 30 minutos.

## Bibliotecas, versões e migração

Bibliotecas guardam `_rak_library` e `_rak_library_history`, IDs doc-ID/condition-ID estáveis. Associação copia conteúdo, libraryId/libraryVersion para corrida, preservando seu ID de linha e instruções específicas. Editar/desativar não altera snapshots existentes; reassociação explícita adota nova versão. Conteúdo inalterado não cria versão. API não expõe referências administrativas/histórico. Exclusão não apaga snapshots em cascata; PDFs aprovados têm exclusão permanente protegida.

Migração conserva corridas, IDs das exigências, textos/versões, modalidades, distâncias e valores. Deduplicação usa chave determinística do conteúdo. Lotes de 25, progresso persistido e trava de 300 segundos; esquema 2 só é marcado ao completar. Repetição não duplica nem reescreve dados já migrados. Não altera tabelas WooCommerce. Revisões nativas não restauram automaticamente toda configuração: exige backup completo.

Duplicação copia opções recorrentes/snapshots, limpa datas/prazos/local/WhatsApp, preços inclusive por kit e datas dos pontos. Não copia imagem destacada nem descrição. Exige novo nome e confirmação de revisão; nasce rascunho indisponível.

## Modelos públicos e permissões

Cadastro/substituição exige capability própria, upload_files e nonce. Criação inline usa AJAX autenticado; sem escrita anônima. Mídia usa APIs nativas WordPress. Modelo exige confirmação de formulário público em branco, extensão PDF, MIME/Fileinfo, assinatura/EOF, até 5 MB, arquivo local dentro de uploads e ausência de ações PDF comuns perigosas. Isso não é antivírus nem permite publicar documentos pessoais.

Download GET/HEAD público por `admin-post.php?action=rak_public_model&attachment=ID`, também sem login, valida arquivo a cada acesso e envia attachment/PDF/nosniff/no-cache. URLs arbitrárias não são aceitas. Sem Fileinfo há erro administrativo explícito. Substituição usa novo anexo; referência antiga continua. Desativação não revoga publicação anterior. Uploads WordPress continuam públicos: nunca armazene documentos preenchidos/assinados ali.

## REST e React

Mantidos `GET /wp-json/re-almeida/v1/corridas` e `/{slug}`. Exigências acrescentam `requiresUpload`, `purpose`, `version` e `template: {url,name,mime}` ou null. Condições mantêm ID/texto/versão/ativo. Campos antigos válidos; requiresUpload ausente assume true. Projeção explícita exclui libraryId/history. Rascunhos, privadas e senha fora do catálogo.

React valida modelo PDF na mesma origem da API configurada, rota/ação próprias, attachment positivo, HTTPS (HTTP só loopback), sem credenciais/fragmento. Mostra instruções e download quando configurado, inclusive documentos opcionais/informativos; envio só aparece quando exigido. Modelo ausente não produz link. Aceite uma vez por corrida, abrangendo participantes, sem registro jurídico real.

Fonte única WordPress em src/config/catalog.ts, com URL pública conhecida. pnpm dev basta; sem flags de fonte, modos ou .env de teste. Fixtures movidas a tests/fixtures e helper de assets separado. RequestContext/draft substituem o contexto e os perfis demonstrativos: formulários vazios, sem documentos preexistentes inventados. Banners/rótulos de simulação e ações de exemplo removidos. Documentos mostram exigências e modelos; envio privado indisponível, sem marcar anexo como recebido. Navegação permite consultar condições/revisão, mas envio/pagamento permanecem bloqueados. Conclusão fictícia não é acessível e acompanhamento mostra indisponibilidade. Titular e participantes são persistidos conforme o Bloco C; somente opções da solicitação permanecem em memória. Produção e Git remoto preservados.

CORS 1.1.1 aceita HTTP/HTTPS apenas em localhost, 127.0.0.1 ou [::1], portas 5173–5199. Aplica-se somente às rotas próprias de listagem/detalhe e métodos GET/HEAD/OPTIONS; não libera escrita, administração, LAN, hosts com sufixos ou credenciais. Origens públicas existentes/filtro mantidos. O Bloco C usa esquema 3; o contrato público das corridas permanece compatível.

## Validação

[QA](qa-block-b.md): 44 testes Node, typecheck/lint/build, sintaxe dos 15 PHP, 48 verificações de contas em WordPress local, 83 regressões de cadastro/bibliotecas e 34 verificações de CORS. Cadastro, logout/login, restauração e isolamento também conferidos no navegador. Local: WP 6.7.10/PHP 8.3.36/SQLite, com função customer provisionada para teste. A execução com WooCommerce carregado, MySQL e entrega pelo Brevo dependem da homologação hospedada após instalar o ZIP. [Operação](wordpress-setup.md) · [Instalação](wordpress-deployment.md).
