# Correções funcionais — 1.10.0

A rodada local 1.11.0 está descrita em [auditoria E2E de produção](production-e2e-audit.md), com os procedimentos atualizados de instalação e reversão.

Entrega local de 18/11/2026, branch `feat/hostgator-unified-architecture`. Não houve acesso de escrita à produção, alteração de dados reais, commit, push, PR, merge ou deploy. A documentação anterior de vouchers continua válida, com as mudanças abaixo.

## Auditoria e decisões

Foram auditados o formulário React, persistência de participantes/rascunhos, autenticação nativa, catálogo, reserva de corridas, pedido WooCommerce/HPOS, Central, arquivos privados, vouchers, transporte de e-mails e o child theme existente. Os serviços foram ampliados, sem criar um segundo painel ou um modelo financeiro paralelo. Os dados de pedidos permanecem nos snapshots e no WooCommerce. A conciliação também lê o CPF do participante em snapshots antigos que não o repetiam na linha.

| Área | Resultado |
| --- | --- |
| Cadastro | CPF e verificadores, telefone com DDD e prefixo +55, nascimento real entre 1900 e hoje, e-mail normalizado, campos obrigatórios e erros associados aos campos. Máscaras aceitam colagem; o input nativo de telefone não trunca o prefixo internacional antes da normalização. |
| Participantes | Continuar valida e persiste sequencialmente; reutiliza cadastros por identidade, conserva versões e aplica cada resultado confirmado. Botão obrigatório removido do wizard; edição do cadastro existente preservada. Falha não apaga campos; o cadastro é relido antes da próxima tentativa. |
| Duplicidade | Só pagamento regular segundo `RequestQueue::paid()` impede o par CPF/corrida. Status processing/completed sem confirmação efetiva não bastam. Não se cancela ou apaga pedido abandonado/expirado. |
| Retomada | A mesma chave de tentativa permanece idempotente. Snapshot equivalente e pedido retomável podem reutilizar um pedido anterior do titular. Participantes/documentos/opções alterados não sobrescrevem o histórico anterior. Pagamento é revalidado antes de iniciar outra finalização nativa. |
| Encerramento | Tentativas não pagas fora do período deixam as pendências correntes; o filtro de histórico financeiro as recupera. Novas solicitações e retomadas fora do período são recusadas, preservando callbacks em trânsito. |
| Conta | Conversão em pedido limpa a seleção temporária e o retorno antigo. A conta distingue rascunho, aguardando pagamento, pago, análise/correção de documentos, voucher e retirada. Pedidos sem retomada recebem orientação e acesso a nova solicitação para corrida aberta. |
| Exceções financeiras | Incluem não pagos que ainda exigem acompanhamento, valor/data/pedido/titular/participante e link de retomada aplicável. Pagamentos concorrentes sinalizados também aparecem nessa visão. |
| Recebimento externo | Exige `manage_woocommerce` e `manage_rak_requests`, nonce, confirmação explícita, valor integral, método e referência/observação. Guarda ator/data/operação no pedido e chama `payment_complete`. Valor não confere, pedido já pago, reembolso ou conflito impedem a ação. |
| Reenvio de voucher | Confirmado por formulário específico; um UUID evita repetir o mesmo envio por submissão duplicada. Reutiliza a identidade e o QR; só liberado. O estado é revalidado antes do transporte e reenvio pendente é suprimido se houver invalidação. |
| PDF por e-mail | CTA “Visualizar meu voucher” leva a ação somente de leitura, com autorização do titular. Sem sessão, login WooCommerce conserva o destino; depois abre o PDF inline. Não contém QR nem concede acesso público. A URL não depende de nonce de e-mail expirável; a autorização por sessão/titularidade continua obrigatória. |
| Correção documental | E-mail identifica corrida/participante/documento/motivo seguro, sem anexos. A conta preserva o destino após login, abre o pedido e posiciona o participante afetado. Reenvio gera aviso administrativo de análise pendente. |
| Corridas anteriores | Filtro baseado no dia do evento no fuso WordPress; data igual a hoje fica visível. Datas ausentes não são inventadas e não causam ocultação. Checkbox combina com busca, corrida, modalidade, documentos, voucher e exportação. |
| WooCommerce | Child theme 1.1.0 usa fontes e tokens existentes da raiz. Templates de página e checkout incluem header/rodapé oficiais, controles acessíveis e tabelas ajustadas no celular. Arquivos do tema-pai e do WooCommerce não foram editados. |
| Rotas | Redirecionamento restrito de `/app/` sem parâmetros e catálogo/produtos WooCommerce desnecessários em GET. Não se aplica a REST, Ajax, cron, administração, páginas de conta/checkout ou callbacks parametrizados. |

## Persistência, permissões e módulos

Migração incremental **5 → 6** cria `<prefixo>rak_notifications`. Não modifica nem exclui dados das tabelas de pedidos/vouchers existentes. A fila armazena chave de evento SHA-256 única, solicitação, operador, destinatário, assunto/corpo, contexto de autorização, estado, tentativas, data e resultado. Mensagens contêm apenas os dados operacionais necessários, sem documentos/CPF. O motivo comunicado é tratado como texto e identificações numéricas de CPF são omitidas. Retenção e acesso devem seguir a política operacional/LGPD do responsável; não há exclusão automática de auditoria.

Metadados adicionais: `_rak_draft_order_<chave>` vincula retomadas sem criar outra solicitação; `_rak_external_receipt` conserva o recebimento externo no próprio pedido; `_rak_payment_conflict` registra impedimento operacional decorrente de pagamento concorrente. Este último não substitui o status financeiro. Depois da conciliação no WooCommerce, a verificação dos vouchers remove o impedimento quando não existir outro pagamento válido e registra nota no pedido.

| Módulos | Alterações |
| --- | --- |
| `src/state/persistParticipants.ts`, `RequestPage`, `DataStep` | Persistência automática, prevenção de duplo clique, tratamento de sucesso parcial e edição |
| `identityRules`, `identityMasks`, `PersonForm` | Validação compartilhada, normalização e erros por campo |
| `useRemoteDraft`, `PaymentStep`, `AccountPage`, `accountClient`, `OrderHistory` | Conversão/retomada corretas, links direcionados e estados/ações do pedido |
| `RaceRegistrations`, `KitOrders`, `RequestDrafts`, `RequestFinance` | Pagamento efetivo, retomada equivalente, regularização, proteção e conciliação |
| `RequestQueue`, `RequestAdmin`, `RequestOperations`, `OrderDocuments`, `requests.js` | Exceções, histórico por data, motivo, recebimentos, reenvios e auditoria |
| `ActionLinks`, `TransactionalMail`, `NotificationQueue`, `VoucherMail`, `Vouchers` | Links autenticados, identidade transacional compartilhada, fila e notificações |
| `Identity`, `WooCommerce`, `AccountPage.php`, `assets/account.js` | Campos nativos, dados após erro, contexto de login e rotas limitadas |
| Entrada do plugin, `Migrations`, readme | Plugin 1.10.0, esquema 6 e nova tabela |
| `wordpress/themes/re-almeida-kits` | Child theme 1.1.0, templates de página/checkout e estilos responsivos |
| `eslint.config.js` | Distribuições geradas de releases excluídas do lint; fontes continuam verificadas |

Nenhuma biblioteca nova; lockfile mantido. PHP 8.3 e os requisitos anteriores permanecem. As capacidades existentes são preservadas: funcionários de retirada continuam sem análise documental ou administração financeira. Não se concede `manage_woocommerce` a esse papel.

## Notificações e recuperação

Vouchers automáticos conservam a estratégia 1.9.0. `TransactionalMail` centraliza apresentação e transporte WooCommerce. `NotificationQueue` trata as novas comunicações e o reenvio manual separado do primeiro envio automático. Estados: pending, sending, sent, failed, uncertain e suppressed. Cada tentativa é adquirida por atualização condicional. São até cinco tentativas por série com espera exponencial; interrupção/exceção exige conferir o transporte antes de repetir. O estado sent significa aceite do transporte, não prova de recebimento na caixa postal.

O cron horário já existente recupera eventos pendentes e reconstrói entradas ausentes a partir da auditoria operacional posterior à migração, sem disparar todo o histórico antigo. Alterações sem diferença efetiva não geram outro aviso. Alertas são deduplicados por ocorrência e dia; falhas do próprio e-mail administrativo não geram uma cascata de alertas. A Central apresenta falhas/resultado incerto e permite nova série após confirmação de conferência, mantendo o histórico dessa autorização. Notificações nativas de criação/pagamento/cancelamento/reembolso não são reproduzidas pelo plugin.

Não existe garantia distribuída de “exatamente uma entrega” entre banco e SMTP. Por isso resultado incerto permanece explícito, sem retentativa automática cega. Reenvio manual de voucher só dispara enquanto ele estiver liberado e usa o mesmo documento.

## Testes

Comandos e evidências:

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build:hostgator` e `pnpm plugin:zip`.
- 51 testes Node, incluindo persistência sequencial, normalização, sucesso parcial, erro sem perda de dados, reaproveitamento e rejeição antes de gravar.
- `tests/wordpress-production.php`: 55 verificações aprovadas; conta sintética, pendente/recusado/em espera, ausência de cancelamento, retomada equivalente, encerramento/histórico, dia do evento, regularização com confirmação/valor/permissão, avisos por mudança, reenvio, falha persistente e deduplicação. Também cobre pagamento concorrente sinalizado e liberação do impedimento após conciliação.
- `production-http.mjs`: login nativo completo com preservação do PDF, PDF liberado inline/autorizado, documento bloqueado recusado, upload multipart real de correção e preservação de REST/Ajax após redirecionar `/app/`.
- `production-browser.mjs`: conta e checkout reais com child theme em 320/390/768/1440, fontes/máscaras/erros, header oficial, ausência de overflow/erro JS, cadastro automático ao continuar e pedido convertido sem rascunho ativo. A transição de fixture `production-ui-worker.php` é exclusiva da réplica para representar a conversão persistida. Não integra o plugin nem a distribuição.
- Regressões de vouchers/conferência (43 verificações com dois processos concorrentes), Central, cadastro de corridas, rascunhos, inscrições e histórico documental. As expectativas antigas que reservavam/cancelavam pendentes foram atualizadas para a regra definitiva solicitada.

Na réplica, o runner assíncrono Action Scheduler foi desabilitado apenas por MU-plugin de QA para evitar bloqueio por loopback no servidor PHP de uma única thread. As filas foram exercitadas diretamente; disparo agendado e recuperação pelo cron real continuam na homologação da hospedagem. Esse MU-plugin não integra os pacotes.

As fixtures, contas, credenciais transitórias, imagens sintéticas, logs e screenshots permanecem em testes/`.local-tools` e não integram a entrega. Os envios foram interceptados e não houve cobrança. Os testes usam WordPress/WooCommerce reais com SQLite; a réplica mantém a limitação anterior de consultas HPOS de reembolsos com limite MySQL máximo. Isso não comprova homologação de estorno via gateway ou MySQL/MariaDB.

## Instalação manual

1. Faça backup do plugin, tema ativo/child theme, frontend, banco, regras Apache e arquivos privados. Registre a versão atual e mantenha a janela de reversão. Não copie `.local-tools`, testes ou fixtures.
2. Substitua o plugin usando `wordpress/releases/re-almeida-kits.zip`. Confira SHA-256, versão 1.10.0 e esquema 6 após a migração automática. Não altere o banco manualmente. Verifique a nova tabela e que os pedidos/vouchers anteriores permanecem vinculados.
3. Atualize o diretório `wordpress/themes/re-almeida-kits` na hospedagem. Requer o tema-pai Twenty Twenty-Five instalado. Se o child theme ainda não estiver ativo, ative-o em homologação e confira templates personalizados salvos no Editor do Site: eles podem sobrepor arquivos do tema. Preserve/revise personalizações; não exclua registros do banco automaticamente. Confira idioma pt_BR e traduções do WooCommerce; a réplica tem textos nativos em inglês.
4. Use o pacote vigente do frontend conforme o [procedimento atualizado](production-e2e-audit.md). Preserve as regras Apache existentes e os assets antigos na hospedagem durante a janela de reversão. `dist/.htaccess` permanece como referência.
5. Confirme arquivos `/design/` e fontes na raiz, cache excluído de conta/checkout/REST/downloads, HTTPS, PHP/iconv/mbstring, remetente/SMTP e cron. As URLs de login/PDF usam a origem configurada em WordPress, que deve permanecer `https://realmeidakits.com.br/app`.
6. Renata precisa das capacidades existentes `manage_rak_requests` e `manage_woocommerce` para recebimento externo. Confira contas individuais dos funcionários e que não receberam acesso financeiro. Use o e-mail administrativo correto em Configurações do WordPress.
7. Homologue login incorreto, recuperação real de senha, sessão expirada e retorno ao PDF/documentos. Verifique recebimento dos novos e-mails, spam, tentativas e recuperação com o SMTP/cron reais. Não considere envio interceptado como entrega comprovada.

## Limites que exigem homologação real

MySQL/MariaDB, ModSecurity/Apache, cache/CDN, gateway/Mercado Pago e seus webhooks, estornos monetários reais, meios de pagamento disponíveis, SMTP e aparelhos Android/iOS dependem da hospedagem. Nenhum gateway estava habilitado na réplica; o checkout foi exercitado sem submeter pagamento. Teste também impressão/PDF, câmera física e o fluxo completo pela conta da Renata.

A criação por chave é idempotente, tentativas equivalentes são reaproveitadas e o pagamento nativo revalida duplicidade. Entretanto dois pagamentos de tentativas diferentes já enviados simultaneamente ao provedor não podem ser desfeitos ou tornados atômicos apenas pelo WordPress. O plugin sinaliza o conflito, impede a entrega operacional e conserva o dinheiro/pedido no WooCommerce para conciliação explícita. A política do provedor para esse caso deve ser homologada; não se cancela ou estorna dinheiro automaticamente nem se declara esse cenário de produção aprovado com base no banco local.

## Reversão

Pause novas solicitações, recebimentos externos e retiradas. Preserve um backup posterior ao último evento financeiro/entrega. Restaure juntos frontend, plugin 1.9.0 e child theme anterior, sem remover a nova tabela, metadados ou documentos. A versão antiga não executa a nova fila nem interpreta as novas ações: confira e reconcilie notificações/recebimentos do intervalo antes de retomar. Não reduza manualmente o esquema ou restaure banco antigo sobre pagamentos novos. Faça qualquer restauração de banco somente após conciliar eventos posteriores ao backup. Preserve `/app/`, configurações WooCommerce e regras Apache em toda a reversão.
