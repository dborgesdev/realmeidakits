# QA atual — Bloco C (05/11/2026)

Plugin **1.2.0**, esquema **3**, branch feat/v2-preview. Sem commit, push, PR, merge, deploy ou atualização no WordPress hospedado.

## Resultado local

| Verificação | Resultado |
| --- | --- |
| Typecheck / lint | Aprovados após a implementação |
| Node | **44 testes aprovados**, incluindo CPF/contato, retorno PKCE/state/expiração e regressões existentes |
| Build | Aprovado, 1.990 módulos; CSS 32,47 kB e JS 344,26 kB (gzip 106,76 kB); sem publicação |
| PHP | Sintaxe dos **15 arquivos** do plugin aprovada |
| Contas WordPress | **48 verificações aprovadas** em tests/wordpress-accounts.php |
| Regressão WordPress | **47 verificações** do cadastro/API e **36** de bibliotecas/modelos aprovadas novamente |
| CORS | **34 verificações** isoladas existentes aprovadas; chamadas cross-origin da conta também funcionaram no navegador |
| Instalação | Plugin_Upgrader nativo substituiu o ZIP e preservou corrida existente; migração repetida preservou participantes |
| Pacote | Comparação byte a byte dos fontes/runtime, raiz única e checksum aprovada |

## Fluxos e segurança exercitados

Cadastros reais no WordPress local com identidades sintéticas geradas para teste (nenhum dado pessoal real). Verificados: usuário customer sem privilégio administrativo, senha com hash nativo, CPF inválido/duplicado, CPF formatado em conta legada, e-mail de login, senha incorreta, visitante, origem externa/nula, bearer ligado à origem, token de administrador recusado e expiração. Perfis/editáveis persistiram; CPF/e-mail de acesso ficaram protegidos.

Participantes: gravação sem criar usuário, CPF único no titular, limite de 20, lista isolada, tentativa de edição/remoção pelo ID de outro titular recusada, controle de versão, trava e remoção do próprio registro. PKCE incorreto, código repetido/expirado e callback externo foram recusados. Logout revogou bearer; troca de senha revogou sessões; chave de redefinição foi consumida uma única vez. wp_mail foi interceptado nos testes, sem envio externo.

## Navegador

1. Executado pnpm dev e usado WordPress real local com URL de teste temporariamente aplicada ao mesmo adaptador, sem mocks, modos ou flags novos. Ao terminar, src/config/catalog.ts foi restaurado para **https://app.realmeidakits.com.br/wp-json/re-almeida/v1**; build final usa a URL pública.
2. Cadastro no formulário hospedado WordPress, retorno PKCE e área React autenticada conferidos. Uma segunda conta foi criada após os ajustes finais do retorno e chegou ao React normalmente.
3. Participante salvo pela interface; logout levou à sessão anônima; novo login exigiu credenciais e recuperou o participante; recarregar restaurou a sessão nativa e manteve a lista.
4. Segundo titular encontrou **zero participantes**, sem herdar dados do primeiro.
5. Recuperação abriu formulário nativo WordPress e retornou a confirmação. E-mail foi capturado somente em arquivo local ignorado para endereços example.invalid. Redefinição completa foi exercitada na suíte WordPress, sem alterar uma senha real no navegador.
6. Inspeção desktop padrão e entrada/recuperação em 320 px. Entrada em 320 px sem overflow horizontal (scrollWidth/clientWidth iguais). Matriz completa das telas autenticadas em 320/375/768/1440 px permanece para homologação; não se alega auditoria exaustiva de todos os tamanhos.
7. Usuários sintéticos de navegador foram removidos e o interceptador local de e-mail foi retirado. Corridas e administrador existentes preservados.

Evidências: participante recuperado após novo login/reload (evidência local) · recuperação (evidência local). Os nomes DEMONSTRAÇÃO nas capturas pertencem aos registros locais de QA, sem avisos de demonstração adicionados à aplicação.

## Problemas corrigidos durante QA

Referrer-Policy no-referrer produzia origem nula em submissão nativa; política same-origin preservou a verificação CSRF e omite referência no retorno externo. CSP form-action precisava permitir o retorno ao cliente exato validado após POST/303. O formulário de dados passou a ler FormData no envio, evitando perda do valor nativo de nascimento. Recuperação passou a mostrar confirmação após o retorno do WordPress. Expiração entre permissão/handler passou a usar autenticação validada por requisição, sem erro de tipo. Nenhum controle de origem/permissão foi desabilitado para aprovar o teste.

## O que depende do servidor hospedado

Consulta anônima em 05/11/2026 à rota hospedada /wp-json/re-almeida/v1/account retornou **404**, confirmando que o módulo novo ainda precisa ser instalado. Nenhuma escrita remota foi feita. Instalar o ZIP e conferir com o WooCommerce efetivamente carregado/MySQL real. O ambiente local foi **WP 6.7.10/PHP 8.3.36/SQLite**; a função customer foi provisionada no teste local, sem instalar WooCommerce. Portanto, o caminho wc_create_new_customer e seus hooks/plug-ins precisam de homologação no servidor configurado; o caminho WordPress nativo foi executado de verdade.

Validar entrega e link de redefinição pelo GoSMTP/Brevo existentes, HTTPS reconhecido, passagem de Authorization/Origin e bypass de cache nas rotas privadas/ações de autenticação. Origens do site/Worker atual e loopback já estão no plugin; outra origem exige apenas autorização exata por rak_account_origins. Nenhum segredo administrativo ou client secret vai para o React.

Checkout, pedido persistido, aceite jurídico persistente, upload privado, pagamento e acompanhamento operacional não foram implementados antecipadamente. Só perfil/participantes persistem; escolhas de corrida/opções continuam rascunho.

## Artefato atual

[ZIP final](../wordpress/releases/re-almeida-kits.zip), **1.2.0 / esquema 3**, **42.361 bytes**.

SHA-256: dc9524b825c2f3e3f898c49e484e056423bcd5646d86fd4cec9f578934d803db.

[Instalação e configurações externas](wordpress-deployment.md) · [Operação](wordpress-setup.md) · [Implementação](wordpress-implementation.md).

---

# Histórico do Bloco B

Os resultados abaixo pertencem às rodadas anteriores; a implementação vigente de contas está descrita acima.

# QA atual — conexão direta WordPress (30/10/2026)

## Resultado e limitação de aceite

Código preparado para **pnpm dev** usar exclusivamente https://app.realmeidakits.com.br/wp-json/re-almeida/v1. Sem modos/env de integração, proxy ou fallback fictício. **O aceite de ponta a ponta ainda depende de instalar o plugin 1.1.1 no WordPress hospedado:** a versão remota consultada não libera CORS local. Não se declara a jornada hospedada aprovada no navegador.

## Causa e alterações desta rodada

catalogConfig retornava demo por padrão e CatalogContext importava fixtures; diversos componentes importavam assets pelo mesmo módulo de corridas. Endpoint público não autorizava localhost. Corrigidos: fonte única/URL central, fixtures em tests/fixtures, assets separados, RequestContext/draft com formulários vazios e sem documentos inventados, UI sem avisos de simulação. Upload/pedido/pagamento não implementados ficam indisponíveis, sem confirmar operações inexistentes. Documentos são consultáveis; navegação pode seguir para condições/revisão sem marcar anexo como recebido. Verificação de documentos permanece nas regras de conclusão; a interface não oferece concluir pedido.

## Testes executados em 30/10

| Verificação | Resultado |
| --- | --- |
| pnpm dev sem parâmetros | Iniciou Vite em localhost:5173, sem modo/env extra; consulta direta ao WordPress configurada |
| Typecheck / lint | Aprovados no estado final |
| Node/React | **41 aprovados**, zero falhas; sem mocks no catálogo, rascunhos vazios, validação, regras existentes e ZIP |
| Build | Aprovado, 1.983 módulos; CSS 31,93 kB, JS 329,54 kB (gzip 102,33 kB); não publicado |
| CORS isolado | **34 verificações PHP aprovadas**: loopback/faixa de portas, hosts maliciosos, métodos, rotas e ausência de credenciais |
| CORS HTTP WordPress local | localhost:5173 e [::1]:5175 retornaram origem exata; origem externa e localhost.evil não receberam autorização; sem credenciais |
| WordPress real local | Instalador nativo preservou corrida existente; **47 verificações de regressão aprovadas** na versão 1.1.1 |
| PHP | Sintaxe do Rest.php alterado aprovada; demais arquivos PHP operacionais preservados nesta correção |
| ZIP final | Arquivos comparados byte a byte aos fontes, raiz/checksum aprovados |
| V1 / Git | Worker, wrangler.jsonc, main e pnpm-lock.yaml preservados; sem commit/push/PR/merge/deploy |

A validação de Node usa fixtures somente nos testes. Testes históricos de snapshot/voucher demonstrativo continuam verificando funções anteriores isoladas; essas operações não são acessíveis na aplicação atual. Ambiente WordPress local: WP 6.7.10/PHP 8.3.36/SQLite, diferente do servidor real.

## Consulta efetiva ao servidor hospedado

Somente GET/HEAD de recursos públicos, sem login ou alteração do WordPress. Lista e detalhe passaram pelo adaptador real loadWordpressRaces/loadWordpressRace, sem fixture:

- Lista HTTP 200: uma corrida **Runlloween**, ID 16, slug runlloween, estado aberto na consulta de 30/10/2026 às 11:01 (Brasília).
- Distância 5km, Oficial e APPAI. Valores em centavos: Oficial Pix 2600/cartão 3000; APPAI camiseta 2400/2800, somente número 2000/2400; tamanhos P/M/G/GG.
- Dois documentos por modalidade, instruções preservadas e uma condição versão 1. O modelo chamado “Exemplo” foi cadastrado no WordPress; esse nome vem da API, não de fixture e não foi alterado.
- Imagem da corrida e camiseta: HTTP 200/image/jpeg.
- Modelo público: HTTP 200/application/pdf, download attachment, 128.023 bytes, assinatura %PDF- válida.
- Resposta com Origin http://127.0.0.1:5173: **Access-Control-Allow-Origin ausente**. localhost:5173 também não recebeu autorização. Cache-Control no-store presente.

No navegador, aplicação iniciou com carregamento e terminou no estado de erro/retry, sem corridas fictícias ou banners de demonstração. Captura (evidência local). A automação de navegador não expôs painel de rede nesta execução; os status/cabeçalhos acima foram medidos pelas requisições HTTP públicas e pelo cliente real executado em Node. Não se alega captura HAR nem inspeção de uma resposta aceita pelo navegador.

## Pendências para completar o aceite

1. No wp-admin, fazer backup e substituir plugin existente pelo ZIP **1.1.1**, sem desinstalar. Não alterar Worker. CORS novo não exige filtro manual.
2. Reabrir pnpm dev e confirmar no navegador a resposta REST liberada pela origem local. Só então conferir visualmente catálogo/imagens/preços, modalidades/distâncias, documentos/downloads e condições com dados hospedados.
3. Testar duas pessoas com campos vazios preenchidos para QA e navegação entre etapas, sem enviar dados pessoais/arquivos ao backend. Confirmar envio/pagamento indisponíveis. Completar responsividade/teclado.
4. Upload privado, persistência de participantes/pedido, aceite jurídico persistente, pagamento e acompanhamento seguem módulos futuros. Não foram apresentados como implementados.

## Pacote final desta rodada

Plugin **1.1.1**, esquema 2, **30.101 bytes**. SHA-256: f83818763913bdb993217040b3c368da9db2d115e0721ff0619c7bb9f7f0b0f1.

[ZIP](../wordpress/releases/re-almeida-kits.zip) · [Setup](wordpress-setup.md) · [Implementação](wordpress-implementation.md) · [Atualização](wordpress-deployment.md).

---

# Registro histórico — refinamento de 29/10/2026

Os resultados e capturas abaixo pertencem à rodada anterior, que ainda usava demo como padrão. Esse comportamento foi substituído pela rodada de 30/10 acima.


Consolidação: 29/10/2026, branch feat/v2-preview. Evolução do plugin existente para **1.1.0 / esquema 2**. Nenhuma alteração em produção ou operação Git remota.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| Typecheck / lint | Aprovados após alterações React/admin |
| Node/React | 38 testes aprovados; regras da jornada, contrato/modelos, demo padrão e pacote |
| Build | Aprovado novamente na conclusão; 1.989 módulos, CSS 31,93 kB e JS 355,16 kB (gzip 110,44 kB); dist estático, sem publicação |
| Sintaxe PHP | 11 arquivos aprovados novamente na conclusão |
| Regressão WordPress | 47 verificações de tests/wordpress-integration.php aprovadas nesta implementação, aproveitadas na conclusão |
| Refinamento WordPress | 36 verificações de tests/wordpress-refinement.php aprovadas, repetidas no ZIP final |
| Instalação/atualização | Plugin_Upgrader nativo local: substituição pelo ZIP final; depois ciclo 1.0.0 → 1.1.0 em processos separados, com snapshots das corridas 11/52 integralmente preservados |
| Migração legado | IDs/textos/versões/configurações preservados, associações criadas; repetição não duplica |
| ZIP × fontes | Igualdade de todos os arquivos, raiz única e SHA-256 pelo teste de pacote |
| Demo / prévia | catalogConfig({}) retorna demo; .env.example demo, sem .env.production; lockfile preservado, sem deploy |

Ambiente real local existente: **WordPress 6.7.10, PHP 8.3.36, SQLite**. Não reproduz MySQL/HostGator/WooCommerce nem confirma WP 6.7.13. Sem instalação de dependências nesta conclusão. pnpm executado com pnpm_config_verify_deps_before_run=false somente no processo, usando dependências presentes.

Os 36 testes reais cobrem mídia nativa com PDF de exemplo, extensão/MIME/conteúdo, confirmação de publicação, criação/reabertura/edição/inativação de bibliotecas, versões, associação em duas corridas, remoção independente, download histórico, proteção de exclusão, condição atualizada sem efeito retroativo, reassociação explícita, cópia/revisão/publicação, REST com projeção privada excluída, visitante sem permissão e migração idempotente.

## QA no navegador efetivamente realizado

- Documento criado no wp-admin: autorização DEMONSTRAÇÃO, finalidade/instruções, PDF selecionado na mídia nativa e confirmação pública. Salvo/reaberto na versão 1.
- Associação na corrida e instruções específicas; navegação por todas as oito abas preservou alterações ainda não salvas. Salvar/reabrir confirmou persistência.
- Preço negativo provocado em aba diferente da ativa: submissão abriu Kits/camisetas/valores, mostrou pendência e aria-invalid, focalizando o campo. Corrigido antes de salvar.
- Condição criada inline na corrida e salva na biblioteca; ID de linha preservado. Duplicação pela ação nativa gerou rascunho; revisão/nome ajustados antes da publicação local.
- React carregou duas corridas do WordPress. Duas pessoas atribuídas a ambas (quatro itens), com Oficial e APPAI/camiseta M. Documentos/instruções por corrida exibidos sem misturar pessoas.
- Download pelo botão **Baixar modelo de autorização** gerou arquivo PDF real de **621 bytes**, cabeçalho %PDF-1.4 e conteúdo DEMONSTRACAO. Nenhum documento pessoal enviado.
- Documentos concluídos somente com marcadores fictícios. Condições apresentaram **três checkboxes**, dois para primeira corrida e um para segunda, cada conjunto abrangendo as duas pessoas; sem duplicar por participante.
- Três aceites demonstrativos permitiram avançar à revisão das quatro atribuições. Pagamento mostrou aviso de integração indisponível e botão desabilitado, sem concluir pedido real.
- Modelo ausente/URL insegura/documento informativo/opcional têm testes automatizados. Não se alega inspeção visual completa de todos esses estados nesta rodada.

Evidências: abas/documentos (evidência local), modelos React (evidência local), aceites por corrida (evidência local), pagamento bloqueado (evidência local). Evidências anteriores do Bloco B permanecem em qa/block-b (evidência local), incluindo inspeção administrativa 320/1440 px. Elas mostram a interface anterior; não substituem a matriz responsiva completa das novas abas.

## Problemas encontrados e corrigidos

- Migração preservava referências libraryId/libraryVersion zeradas por usar união de arrays. Corrigida para substituição explícita; suíte real passou com associações e idempotência.
- Variável administrativa sem uso removida após lint. Sem Fileinfo, validação retorna erro claro em vez de falha fatal.
- Timeouts/interrupções de automação exigiram retomadas. Lista de locators React mudou após substituir marcadores; o teste passou a usar o estado atual. Isso não foi tratado como falha funcional do produto.

## Limites e roteiro real pendente

1. Homologar HostGator: MySQL/MariaDB, versões/extensões, HTTPS, uploads/Fileinfo, permissões, cache/CDN, CORS, download visitante, coexistência de plugins e WooCommerce HPOS/Blocks. Não comprovados localmente.
2. Completar matriz visual nova em 320/375/768/1440 px, teclado/foco, linhas extensas, mídia real autorizada e imagem de camiseta. Não houve auditoria visual exaustiva das novas abas em todos os tamanhos.
3. Conferir visualmente todos os estados vazio/encerrado/payload inválido, documentos opcionais/sem modelo e recuperação de conexão em homologação; cobertura automatizada não equivale à inspeção de cada tela.
4. Confirmar eventos, preços do serviço, datas, tamanhos, pontos, documentos e textos jurídicos com Renata. PDFs públicos devem ser modelos em branco revisados.
5. Testar restauração consistente de backup antes de atualizar servidor. Upload privado, conta, pedidos, aceite persistente, pagamentos e notificações não foram implementados nesta rodada.

## Artefato

[ZIP final](../wordpress/releases/re-almeida-kits.zip), **1.1.0**, **29.827 bytes**.

SHA-256: `f9d38a4d7a93d5624e2302f578a26e548beabd23a6a51e60b84fb8f545d49c66`.

[Setup](wordpress-setup.md) · [Implementação](wordpress-implementation.md) · [Implantação](wordpress-deployment.md). Pronto para iniciar homologação, sem alegar liberação operacional dos módulos futuros.
