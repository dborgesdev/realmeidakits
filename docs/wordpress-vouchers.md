# Vouchers e conferência — versão 1.9.0

Na versão local 1.11.0, o PDF gerado sob demanda exibe o código de conferência `V-<id>`. A busca da equipe também aceita o CPF inteiro com ou sem máscara e pode retornar vários vouchers sem exibir o CPF. O QR e o token originais continuam associados à mesma ficha. Consulte a [auditoria E2E de produção](production-e2e-audit.md).

Implementação local de 18/11/2026. Aprovada tecnicamente nos testes indicados abaixo; requer homologação na hospedagem antes de operar com clientes.

## Auditoria e decisões

O plugin 1.8.1 já possuía solicitações em `rak_requests`, pedidos WooCommerce por CRUD compatível com HPOS, snapshot de itens por participante/corrida, arquivos privados, revisões por token, substituições versionadas e Central Operacional. O estado operacional é armazenado no metadado do titular `_rak_request_ops_<id>`, sob bloqueio `request_ops_<id>`. A fila financeira usa status processing/completed, `is_paid`, data efetiva de pagamento e ausência de estorno. A autenticação usa WordPress e nonce REST. Não havia voucher operacional, QR, notificação específica ou registro atômico de entrega. O PDF demonstrativo antigo não é utilizado.

A implementação reutiliza esses contratos. Liberação não depende de kit marcado manualmente como pronto. Todos os documentos obrigatórios e anexados precisam de aprovação com o token atual, além do pagamento regular. Sem documentos exigidos/anexados, `not_required` é aceito. Aprovar globalmente não contorna um arquivo obrigatório ausente. A análise antes do pagamento fica na mesma Central, pela ação “Analisar documentos antes do pagamento”.

Reembolsos parciais invalidam preventivamente todos os vouchers ainda não utilizados daquele pedido, conforme a regra financeira já existente. Não se tenta distribuir um estorno entre participantes sem uma regra comercial confirmada. Nova regularização pode liberar novamente o mesmo voucher; não cria outra identidade nem repete uma notificação já enviada.

Retiradas anteriores à versão 1.9.0 são preservadas como utilizadas. Datas/funcionários ausentes não são inventados: o motivo orienta consultar o histórico anterior. Pedidos antigos sem data da corrida no snapshot omitem esse campo do PDF; pedidos novos capturam `raceDate`. Nome, modalidade e local vêm do snapshot confirmado, preservando pedidos anteriores mesmo após uma nova solicitação.

## Módulos e persistência

| Arquivo | Responsabilidade |
| --- | --- |
| `includes/VoucherRepository.php` | Migração, identidade única, leitura e atualização condicional de estado/auditoria |
| `includes/Vouchers.php` | Elegibilidade, eventos WooCommerce, reconciliação, descrição e confirmação |
| `includes/VoucherMail.php` | Mailer WooCommerce, fila, tentativas e reenvio administrativo auditado |
| `includes/VoucherPdf.php` | Autorização do titular e PDF A4 sob demanda, com logo oficial e QR vetorial |
| `includes/VoucherPickup.php` | Tela restrita, REST e download protegido |
| `assets/pickup.js`, `pickup.css`, `jsQR.js` | Leitura por câmera, pesquisa e confirmação responsiva |
| `RequestOperations`, `RequestQueue`, `RequestAdmin`, `RequestExport` | Análise antes de pagar, proteção do histórico, filtros e exportação de vouchers |
| `KitOrders`, `OrderDocuments`, `CheckoutInput` | Histórico do titular, substituição documental e snapshot da data |
| `src/components/account/OrderHistory.tsx` | Situação, motivo, download e data de retirada na área existente |
| `Migrations.php`, entrada do plugin, readme e empacotador | Esquema 5, versão 1.9.0 e dependências incluídas no ZIP |

Uma tabela adicional: `<prefixo>rak_vouchers` (o prefixo é calculado por `Accounts::table`). Colunas: solicitação, índice histórico do item, participante, corrida, pedido, token aleatório, estado/motivo, revisão, auditoria JSON, primeira liberação, data/funcionário/operação da entrega e estado/contador/data/resultado da notificação. Há unicidade por solicitação/participante/corrida e por token. Não contém CPF ou anexos. Não altera tabelas WooCommerce nem apaga registros existentes.

Transições operacionais e auditoria correspondente são gravadas no mesmo `UPDATE ... WHERE id/revision/state`. A confirmação exige estado liberado e revalida pagamento/documentos no servidor sob o mesmo bloqueio usado pela análise documental. O teste concorrente abre dois processos, aguarda ambos carregarem o mesmo voucher e os libera juntos; um único processo pode concluir. A atualização condicional continua protegendo contra revisão antiga mesmo se houver uma disputa de bloqueio.

Os estados são blocked, released, used e invalidated. A retirada antiga `collected` é projetada a partir de used; a edição antiga não pode criar ou apagar uma entrega. Alterações financeiras/documentais posteriores mantêm used e registram um aviso para conferência administrativa.

## Segurança e dependências

REST: `POST /app/wp-json/re-almeida/v1/pickup/lookup`, `/search`, `/confirm`. Todos exigem login WordPress, nonce `wp_rest` e `confirm_rak_pickups`. Um token QR não substitui essas condições. A pesquisa retorna apenas nome, corrida, modalidade, referência e estado operacional; responsáveis/documentos/CPF não são retornados. Resultados e buscas são limitados a 30 itens; refine a pesquisa quando necessário.

PDF: `admin-post.php?action=rak_voucher_pdf&request=...&line=...&_wpnonce=...`. Exige sessão, nonce específico e titular correspondente. A referência numérica não concede acesso. O QR usa `admin.php?page=rak-pickup#voucher=<256 bits aleatórios>`; o fragmento não integra a requisição HTTP e é removido da barra após leitura. O token é enviado somente no corpo dos POST protegidos. Não há consulta externa ou serviço de QR. Respostas autenticadas usam no-store e o PDF também no-referrer/nosniff. Exclua `/app/wp-admin/`, a REST autenticada e a área de conta de caches de hospedagem/CDN. Mantenha logs de depuração desabilitados em produção.

O papel `rak_pickup_staff` recebe somente read e confirm_rak_pickups. Não recebe administração de usuários/pedidos, análise de documentos ou configurações. Administradores mantêm as permissões anteriores e recebem a capacidade de conferência. A integração permite ao funcionário entrar especificamente na página de conferência apesar do bloqueio administrativo padrão do WooCommerce. Atribua o papel a contas individuais; não compartilhe a conta administrativa da Renata.

O codificador QR de Kazuhiko Arase é incluído com revisão registrada em `vendor/qr/README.txt`; jsQR 1.4.0 é distribuído localmente com licença Apache 2.0. O primeiro recebeu apenas namespace/guarda WordPress. Não há Composer ou biblioteca Node nova; `pnpm-lock.yaml` permanece. PDF usa PHP 8.3, iconv, getimagesizefromstring e os recursos padrão de strings/criptografia, sem GD, shell, binário PDF ou rede. O frontend usa BarcodeDetector quando disponível e jsQR como alternativa. A câmera requer HTTPS e permissão do navegador; código/pesquisa manual permanecem disponíveis.

O PDF é gerado apenas quando o titular solicita o download. A identidade, o snapshot e o token são persistentes; não se gera um PDF em cada consulta nem se cria arquivo público previsível. A saída é enviada diretamente ao cliente. Campos extensos quebram linhas e páginas, preservando espaço para o QR e evitando sobreposição.

## Notificação e recuperação

Cada primeira liberação persiste `released_at` antes de agendar a mensagem. Eventos repetidos conservam o voucher e o estado de envio. Um `UPDATE` exclusivo muda pending para sending antes de chamar o mailer transacional WooCommerce. O e-mail usa destinatário e nome de cobrança do pedido, corrida, participante e link para `/conta`, sem anexos ou token QR. Se a retirada ocorrer antes do envio, a mensagem informa que já foi registrada. Enquanto o voucher estiver bloqueado/invalidado, a tentativa é adiada até nova regularização.

Falha explícita do transporte permite até cinco tentativas, com espera exponencial. Cron horário recupera agendamentos pendentes e marca sending interrompido há mais de 15 minutos como uncertain. Exceção de transporte também fica uncertain. `sent` indica aceite do transporte, não entrega comprovada ao destinatário. Não há transação distribuída entre MySQL e SMTP: uma interrupção após aceite precisa ser conferida antes de reenviar.

A Central exibe estado, resultado e tentativas. Para failed/uncertain, confirme no provedor se houve entrega e só então use “Conferi o transporte: tentar envio novamente”. Isso inicia nova série e guarda a série anterior na auditoria. Funcionários de retirada não recebem essa permissão. Configure um cron confiável na HostGator para executar os eventos vencidos WordPress; se `DISABLE_WP_CRON` estiver ativo, o agendador do servidor é obrigatório. A reconciliação percorre solicitações em lotes de 50, sem exigir que o cliente abra Minha Conta.

## Resultados executados

| Cenário | Evidência local |
| --- | --- |
| Pagamento antes/depois dos documentos | Suíte PHP com anexo sintético privado e aprovação efetiva pelo serviço existente |
| Múltiplos participantes | Dois liberados e um bloqueado no mesmo pedido |
| Webhook/atualização e aprovação repetidos | Mesma identidade, quantidade e auditoria de liberação |
| Falha e recuperação de e-mail | Transporte interceptado: falha, segunda tentativa aceita e chamadas posteriores sem novo envio |
| PDF autenticado e acesso cruzado | HTTP real com duas sessões WordPress; PDF 200, terceiro 404, anônimo redirecionado ao login |
| QR válido, inexistente e nonce | HTTP REST real, capacidade/nonce obrigatórios e resposta privada no-store |
| QR do documento | PDF renderizado por Poppler e imagem decodificada por jsQR em Chromium |
| Retirada simultânea | Dois processos PHP e duas contas autorizadas; apenas uma confirmação |
| Repetição e revisão antiga | Segunda confirmação recusada, CAS antigo recusado, mesmo registro de entrega |
| Consulta manual | HTTP real devolve os mesmos vouchers; interface interceptada não contorna estado utilizado |
| Sem permissão | Conta customer e visitante recusados no HTTP; papel restrito inspecionado; funcionário autorizado participa do teste concorrente |
| Cancelamento/estorno | Vouchers não utilizados invalidados; utilizado preserva funcionário/operação e recebe aviso administrativo |
| Falha de conexão | Chromium, API interceptada: sem sucesso e sem ação antiga de confirmação após erro |
| Responsividade | Chromium em 320, 390, 768 e 1440 px, sem overflow horizontal; screenshots locais e inspeção visual |
| Regressões | 48 testes Node; PHP catálogo 50, rascunhos 10, Central e histórico documental |
| Qualidade e pacote | Typecheck, lint, PHP 8.3 lint, build HostGator e ZIP comparado byte a byte com fontes |

Comandos: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build:hostgator`, `pnpm plugin:zip`. Suítes PHP: `php tests/wordpress-vouchers.php <wordpress-local>`, `wordpress-integration.php`, `wordpress-drafts.php`, `wordpress-operations.php`, `wordpress-identity-history.php`. A suíte de vouchers chama `voucher-http.mjs` e `wordpress-voucher-worker.php`, usa sessões/arquivos sintéticos e os remove. Após renderizar o PDF de QA com `pdftoppm`, `node tests/pickup-browser.mjs` verifica a interface com API interceptada. Artefatos DEMONSTRAÇÃO ficam em `.local-tools/voucher-qa`, excluídos do aplicativo e do pacote. Nenhum teste usa cartão, gateway financeiro ou serviço real de e-mail.

Os testes locais usam SQLite. A réplica apresenta limitações preexistentes em consultas HPOS de reembolsos com limite MySQL máximo; isso não homologa MySQL e não foi convertido em alegação de aprovação do ambiente HostGator. Cancelamento/estorno por status e prevenção conservadora de reembolso foram exercitados; reembolso monetário via gateway e seu webhook seguem no roteiro abaixo.

## Instalação e homologação na HostGator

1. Faça backup do banco, plugin, frontend, regras Apache, wp-config.php e armazenamento privado. Preserve alterações visuais existentes e gere o frontend com `pnpm build:hostgator`. Não publique fixtures ou `.local-tools`.
2. Instale `wordpress/releases/re-almeida-kits.zip` substituindo o plugin de mesmo nome. A migração incremental cria a tabela e o papel, sem excluir dados. Verifique versão 1.9.0, opção `rak_schema_version=5`, tabela e capacidades. Falha de permissão de criação do banco precisa ser corrigida antes do uso.
3. Publique o conteúdo de `dist/` na raiz quando autorizado, preservando `/app/`, `.htaccess`, manifesto Vite e configurações Apache. Atualize plugin e frontend na mesma janela. Não se exige segredo novo no navegador.
4. Confirme WooCommerce, produto de serviço, BRL, checkout, gateway, HTTPS e armazenamento privado conforme `wordpress-requests.md`. Revise PHP/iconv, exclusões de cache, remetente e autenticação do transporte SMTP já utilizado. Configure cron confiável e confira os eventos `rak_voucher_mail`, `rak_reconcile_vouchers` e seus lotes.
5. Atribua `Conferência de retirada` às contas individuais de funcionários. Teste o login direto em `/app/wp-admin/admin.php?page=rak-pickup`. Confirme que não acessam pedidos, documentos, usuários ou configurações. Preserve a conta administrativa da Renata.
6. Use contas e corridas sintéticas explicitamente DEMONSTRAÇÃO em homologação isolada. Repita os dois sentidos pagamento/documentos com sandbox do gateway, confirmação duplicada de webhook, estorno parcial/integral efetivo e entrega seguida de estorno. Confirme que um pedido novo não altera vouchers anteriores.
7. Com dois aparelhos/funcionários, confirme simultaneamente o mesmo voucher no MySQL/MariaDB. Verifique uma única operação e auditoria íntegra. Não marque o teste de produção aprovado com base no SQLite local.
8. Teste câmera física Android e iOS/Safari, permissão negada, pesquisa manual, rede interrompida após clique e nova consulta ao servidor. Verifique PDF em smartphone/impressão, local/data reais, foco/teclado e Central/exportação na conta da Renata.
9. Confirme recebimento efetivo de e-mail, spam, remetente, cron, falha temporária e ausência de duplicação em eventos repetidos. Verifique resultado incerto no transporte antes de autorizar reenvio. Nenhum envio real foi comprovado pelos testes interceptados.

Essas validações dependem exclusivamente da hospedagem, gateway, transporte e aparelhos reais. Não houve deploy nem acesso a contas reais nesta entrega.

## Reversão

Pause novas solicitações e retiradas. Preserve um backup posterior ao último registro de entrega. Restaure juntos plugin e frontend anteriores; mantenha banco, tabela de vouchers, metadados e arquivos privados. O plugin anterior não conhece a proteção de used e não deve ser usado para continuar registrando retiradas após a reversão. Não remova vouchers nem reduza manualmente a versão do esquema, pois isso elimina rastreabilidade sem restaurar o estado do negócio.

Em caso de restauração do banco anterior, exporte/reconcilie antes as entregas, eventos financeiros e notificações ocorridos após o backup. Mantenha a operação suspensa até a reconciliação administrativa. A desativação do plugin interrompe callbacks; eventos agendados não contêm token QR. A retomada na 1.9.0 reconcilia os registros existentes sem emitir novas identidades.
