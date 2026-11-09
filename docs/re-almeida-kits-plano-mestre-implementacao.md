# RE ALMEIDA KITS — PLANO MESTRE DE IMPLEMENTAÇÃO FUNCIONAL

**Revisão:** 30/10/2026
**Finalidade:** documento autossuficiente de contexto, decisões, escopo, dependências e critérios de aceite para reutilização em conversas futuras e handoff ao Codex.
**Referência de desenvolvimento:** `https://github.com/dborgesdev/realmeidakits`, branch local informada `feat/v2-preview`. **Não presumir que alterações locais foram commitadas ou enviadas ao GitHub.**

## 0. Como utilizar este documento

1. No começo de cada nova etapa, anexar este arquivo e indicar o bloco a executar.
2. Codex deve inspecionar o repositório e documentação vigente antes de editar; o código é a verdade do estado implementado, este arquivo é a verdade do escopo/decisões até esta revisão.
3. Ao concluir um bloco, atualizar o status e as decisões deste documento (ou a versão versionada em `docs/`), registrar testes realmente executados e pendências; não declarar produção validada com testes locais.
4. **Status:** `ENTREGUE LOCAL` = relatório Codex/documentos, ainda requer validação na HostGator; `PENDENTE` = não implementado; `A CONFIRMAR` = decisão operacional não estabelecida.
5. Objetivo do desenvolvimento: sistema funcional com dados reais, `pnpm dev` consumindo WordPress por padrão, sem fixtures no fluxo principal, sem avisos visuais de demonstração, sem múltiplos modos e flags para uso cotidiano. Manter validações, permissões e integridade de dados de forma discreta e efetiva.

## 1. Contexto do negócio e limites

**Empresa:** Re Almeida, serviço de retirada de kits de corrida para participantes já inscritos junto às organizadoras ou contemplados pela modalidade APPAI. **Não vende inscrição de corrida, kit ou camiseta da organizadora.** Cobra pelo **serviço de retirada**, com valor configurável por corrida e modalidade.

**Público:** corredores, inclusive pessoas com pouca familiaridade digital; experiência simples, legível e objetiva. A administradora Renata configura corridas, requisitos, pontos de retirada, preços, documentos e condições. Operadores autorizados (incluindo sua filha, conforme papel definido) ajudam na conferência e entrega.

**Modalidades:**
- **Kit Oficial:** participante já adquiriu/tem inscrição na organização; informar número de inscrição quando exigido, corrida, distância, tipo de kit quando aplicável, dados pessoais e documentos definidos para aquela corrida.
- **APPAI:** associado informa matrícula APPAI; opções de camiseta + número de peito ou somente número de peito conforme corrida; distâncias configuráveis; tamanhos baby look P/M/G/GG/XG onde aplicável; foto da camiseta cadastrada por corrida.
- Cada corrida define modalidades, distâncias, disponibilidade, prazos, preços do serviço, documentos, condições, pontos de retirada, orientações e link WhatsApp quando existente.

**Pedido coletivo:** um responsável autenticado pode incluir até **20 participantes distintos** em um pedido, com uma ou várias corridas; cada participante possui CPF e escolhas/documentos/resultado de retirada próprios. Um pagamento consolidado. **Não criar automaticamente conta para cada participante adicional.**

**Condições:** aceite uma vez por corrida dentro do pedido, não repetido para cada participante; registrar versão e texto efetivamente aceitos, data/hora e responsável no pedido real. Regras como guarda por dois meses/doação precisam de confirmação final da Renata; não inventar textos jurídicos.

**Após pagamento:** voucher PDF/QR por participante/corrida; Renata informa número de peito manualmente quando necessário; documentos passam por conferência; entrega só liberada com situação financeira e documental válidas; impedir dupla baixa; trilha de auditoria e relatórios.

## 2. Infraestrutura, arquitetura e situação conhecida

- **Frontend:** React + TypeScript + Vite + Tailwind + pnpm. Domínio previsto `https://realmeidakits.com.br`; V1 publicada em `https://realmeidakits.smartlocal.workers.dev/` no Cloudflare Workers.
- **Backend:** WordPress `https://app.realmeidakits.com.br`, HostGator, WooCommerce com HPOS. WordPress informado 6.7.13, WooCommerce informado 11.2.1, PHP 8.3.36; **revalidar versões atuais**. GoSMTP presente. Mercado Pago **não configurar ainda**.
- **Plugin:** `wordpress/plugins/re-almeida-kits/`; pacote `wordpress/releases/re-almeida-kits.zip`. Versão 1.1.0/esquema 2 relatada em 29/10/2026; oito abas, biblioteca de documentos/condições, snapshots/versões, PDFs públicos em branco, duplicação de corrida e REST público.
- **API existente:** `GET /wp-json/re-almeida/v1/corridas` e `GET /wp-json/re-almeida/v1/corridas/{slug}`; catálogo não deve expor documentos pessoais, rascunhos nem dados administrativos.
- **Testes relatados da 1.1.0:** 38 Node/React, 47 verificações WP legadas + 36 de refinamento, 11 arquivos PHP sintaticamente válidos, typecheck/lint/build, atualização local 1.0.0→1.1.0. Laboratório WP 6.7.10/PHP 8.3.36/SQLite; **não comprova MySQL/HostGator/WooCommerce**.
- **Limites confirmados da 1.1.0:** upload privado, contas reais, participantes persistentes, pedidos/pagamento, aceite jurídico persistido e vouchers operacionais **ainda não implementados** segundo documentação recebida.
- **Mudança de orientação posterior:** foi solicitado ao Codex que `pnpm dev` consuma diretamente a API real, sem modo `demo` padrão. **Execução/resultado dessa mudança ainda não confirmado nesta conversa.** Auditar antes de prosseguir.
- **Git:** trabalhar na branch de implementação existente; sem alterações diretas na `main`, sem merge/deploy não autorizado. V1 publicada deve permanecer intacta até aprovação.

## 3. Mapa de blocos e dependências

| Bloco | Área | Entrega funcional | Estado em 30/10/2026 | Depende de |
|---|---|---|---|---|
| 0 | Base e integração | `pnpm dev` com API real, catálogo/corridas sem mocks | SOLICITADO AO CODEX; NÃO CONFIRMADO | Plugin 1.1.0 ativo |
| 1 | WooCommerce — configuração | Loja virtual de serviços, conta, e-mail, HPOS, pagamento manual | PENDENTE DE CONFERÊNCIA/CONFIGURAÇÃO | WP/Woo existentes |
| 2 | Plugin — contas e participantes | Autenticação, CPF, perfis, até 20 participantes, autorização de acesso | PENDENTE | Bloco 1 |
| 3 | Plugin — documentos | Biblioteca refinada, upload privado, reaproveitamento, conferência | PENDENTE | Bloco 2 |
| 4 | Plugin — produtos e pedidos | Produtos técnicos, cálculo seguro, pedido consolidado Woo | PENDENTE | Blocos 1–3 |
| 5 | Frontend — jornada real | Cadastro/login, participantes, documentos, checkout, minha conta | PENDENTE | Blocos 2–4 |
| 6 | Operação — vouchers e retirada | PDF/QR, número de peito, baixa, auditoria, relatórios | PENDENTE | Blocos 3–5 |
| 7 | Homologação integrada | Fluxo completo real, Woo manual, e-mails, responsividade | PENDENTE | Blocos 0–6 |
| 8 | Mercado Pago e publicação | Pix/cartão, webhooks, reconciliação, deploy | FUTURO; EXCLUÍDO DESTA RODADA | Bloco 7 |

**Execução recomendada:** preparar Woo e implementar blocos 2–5 como uma entrega integrada com testes incrementais, evitando interfaces fictícias; depois bloco 6 e homologação 7. Bloco 0 deve estar corrigido antes de avaliar o frontend.

## BLOCO 0 — Catálogo real e desenvolvimento local

**Objetivo:** `pnpm dev` no repositório local consome por padrão `https://app.realmeidakits.com.br/wp-json/re-almeida/v1`; corridas e dados vêm do WP real, sem fixtures nem avisos de demonstração. Não exigir `--mode`, arquivos `.env` extras ou switches para trabalho diário. Preservar V1 publicada.

**Codex:** auditar `src/config/catalog.ts`, hooks, adaptadores, Vite, imports de fixtures, REST/CORS; corrigir causa raiz. API vazia → estado vazio normal; API com erro → tratamento de erro funcional, nunca dados inventados. Conferir respostas de rede, modalidades, preços, imagens, documentos e condições. Se mudar PHP, versionar e empacotar ZIP atualizado. Validar typecheck/lint/testes/build e navegação real.

**Aceite:** `pnpm dev` mostra apenas corridas publicadas do WP; nenhuma corrida fictícia; sem necessidade de parâmetros especiais.

## BLOCO 1 — WooCommerce: configuração integral sem Mercado Pago

**Objetivo:** deixar WooCommerce pronto para contas, produtos virtuais, pedidos e confirmação manual de pagamento para testes reais.

**Configurar/auditar:**
- WordPress, WooCommerce, permalinks REST, HTTPS, fuso horário, moeda BRL, dados da loja e impostos segundo operação real (não presumir isenção fiscal).
- HPOS ativo e compatibilidade dos plugins; páginas Woo (Carrinho, Checkout, Minha conta) existentes, mesmo se experiência final for React.
- Habilitar criação/login de clientes, recuperação de senha e políticas de contas; não exigir cadastro manual no wp-admin.
- Produtos **virtuais**, sem entrega/frete; categorias e catálogo convencional não são o fluxo público.
- Método de **pagamento manual** do WooCommerce para testes, sem cobrança financeira real; pedido é real e muda de estado pelo painel. Não fingir confirmação de pagamento no frontend. Mercado Pago permanece desligado.
- SMTP/GoSMTP: testar e-mails transacionais (cadastro/recuperação/pedido) e logs, sem disparos em massa.
- Papéis/capabilities de administrador, operador de conferência e cliente; operadores não devem ter acesso amplo a dados/finanças sem necessidade.
- Regras de cancelamento/reembolso, emissão fiscal e textos comerciais **A CONFIRMAR** com Renata; não inventar.

**Produtos técnicos — desenho recomendado, sujeito a auditoria:** três serviços virtuais internos: retirada Kit Oficial, retirada APPAI camiseta+número, retirada APPAI somente número. Criados/sincronizados automaticamente pelo plugin, não cadastrados à mão em cada corrida. Evitar produto por combinação corrida/distância/tamanho. Valores calculados e validados no servidor segundo corrida/modalidade/forma de pagamento, nunca confiando no preço enviado pelo navegador. Se a diferença de preço por meio de pagamento exigir mecanismo específico, implementar regra transparente e compatível com Woo/checkout manual; não inventar preço.

**Aceite:** produtos técnicos coerentes, conta cliente operante, pedido manual real no WooCommerce, status financeiro controlável, e-mails de teste entregues e nenhum frete indevido. **Não configurar Mercado Pago.**

## BLOCO 2 — Plugin: contas, identidade e participantes

**Objetivo:** cliente cadastra-se e autentica-se pelo React, usando usuários WordPress/WooCommerce como identidade; responsável pode incluir até 20 participantes distintos no pedido.

**Dados do responsável:** nome, CPF, data de nascimento, telefone, e-mail, senha; confirmação/recuperação de e-mail conforme desenho implementado. CPF validado e único por conta; evitar duplicação e enumeração de contas. Não usar CPF como senha. **CPF de participantes adicionais não implica criação de usuário WordPress.**

**Participantes:** nome, CPF, nascimento, telefone e demais dados efetivamente necessários; dados pessoais reutilizáveis pelo responsável nos próximos pedidos. Vínculo entre participante, responsável e inscrições; não permitir que um usuário veja participantes/pedidos de outro. Evitar conflito quando CPF de terceiro aparecer em mais de uma conta: definir modelo de vínculo/consentimento sem permitir apropriação de cadastro existente. Um pedido pode ter participantes e corridas múltiplas.

**Autenticação:** sessão/cookie seguro compatível com frontend em `realmeidakits.com.br` e backend em `app.realmeidakits.com.br`; validar CSRF, origem e permissões, sem chaves privadas no browser. Recuperação por e-mail. Não usar cookies de reconhecimento como prova de identidade. Preferir APIs WordPress/Woo e sessão adequada, sem inventar provedor externo.

**Aceite:** registrar, entrar, sair, recuperar senha, editar dados, adicionar/editar participantes, persistir e recuperar com isolamento entre contas, até 20 por pedido.

## BLOCO 3 — Plugin: documentos reais, autorização e conferência

**Problema atual:** biblioteca 1.1.0 confunde modelo PDF público com documento que o corredor deve enviar. React ainda não envia arquivo privado. Corrigir conceito e UX junto à persistência real.

**Categorias funcionais:**
1. **Documento pessoal com foto (RG/CNH):** upload JPG/PNG/PDF, obrigatório quando definido; pode ser reutilizado pelo mesmo participante em corridas posteriores, com atualização/substituição.
2. **Comprovante de inscrição/compra na organizadora:** arquivo JPG/PNG/PDF vinculado à corrida/participante; não reutilizar entre corridas.
3. **Autorização de retirada por terceiros:** PDF em branco **opcional** para download (fornecido pela organizadora quando houver); upload de autorização preenchida/assinada, JPG/PNG/PDF, específico da corrida; algumas organizadoras aceitam autorização manuscrita, conforme instrução configurável.
4. **Outras exigências:** Renata cadastra novos tipos e escolhe por corrida/modalidade, com obrigatoriedade, finalidade, instruções e formatos.

**Dados estruturados, não uploads por padrão:** CPF, matrícula APPAI e número de inscrição da organizadora são campos; só exigir arquivo extra quando Renata configurar uma exigência documental.

**Biblioteca e painel:** cadastro uma vez, associação com um clique em várias corridas, ajustes de obrigatoriedade/modalidade/escopo, versões/snapshots; nomes de campo simples (ex.: “O corredor deve enviar um arquivo?”; “Disponibilizar modelo em branco?”). Modelo público não deve ser obrigatório para RG. Preservar dados da 1.1.0.

**Upload privado:** não usar mídia pública do WordPress para RG, comprovantes e autorizações assinadas. Endpoint autenticado, autorização por responsável/participante e equipe, limites e verificação de arquivo, armazenamento fora de URL pública ou entrega autenticada, sem vazamento em API pública, logs ou cache. Proteção é requisito funcional, sem avisos excessivos ao usuário. Retenção e exclusão de dados pessoais **A CONFIRMAR**.

**Conferência:** pendente/aprovado/rejeitado; motivo de rejeição e reenvio; Renata/operadores autorizados visualizam arquivos por corrida/participante, registram data/autor da conferência. Envio de obrigatórios antes de concluir pedido conforme regra aprovada; aprovação pode ocorrer depois, mas retirada não é liberada antes da validação.

**Aceite:** upload real e recuperação após login, download de modelo quando existente, autorização assinada enviada, reaproveitamento de identidade, isolamento entre usuários, rejeição/reenvio, aprovação administrativa e bloqueio da retirada por pendência.

## BLOCO 4 — Plugin/WooCommerce: produtos, cálculo e pedidos reais

**Objetivo:** um pedido WooCommerce com itens de serviço de retirada, vinculados aos participantes e corridas escolhidos; cobrança única.

**Modelo:** produtos técnicos virtuais ocultos; para cada atribuição participante×corrida, item Woo com metadados estáveis: corrida ID/versão, modalidade, distância, tipo de kit, camiseta/tamanho, participante ID, preço validado, requisitos aplicáveis. A quantidade pode ser uma unidade por atribuição para facilitar vouchers e auditoria. Não usar nome do produto como fonte de verdade.

**Preço:** servidor revalida disponibilidade, prazos, modalidade, combinação e valor no instante do pedido; nunca aceita total informado pelo React. Regras de Pix/cartão e eventuais taxas dependem da configuração real e do gateway futuro; pagamento manual de testes deve preservar valor auditável. Não vender kit ou inscrição.

**Pedido:** responsável WooCommerce, até 20 participantes distintos, várias corridas, aceite por corrida com texto/versão/timestamp, referência dos documentos, snapshot das escolhas, prevenção de duplicidade em reenvios (idempotência). Criar pedido real via APIs Woo, HPOS; não editar tabelas diretamente. Status de pagamento separados de status de documento e de retirada. Confirmação manual pelo painel Woo aciona os mesmos efeitos de um pagamento futuro aprovado, sem inventar transação.

**Aceite:** pedido real com múltiplos itens, valor correto, vínculo individual, status e histórico no WooCommerce, sem frete, sem cobrança real, sem duplicação ao repetir requisição.

## BLOCO 5 — React: jornada integral e minha conta

**Fluxo público:** catálogo real → corrida → modalidade/distância/kit/camiseta → responsável/login ou cadastro → participantes (até 20) → dados exigidos por corrida → uploads reais e modelos para baixar → condições por corrida → revisão consolidada → criar pedido Woo → pagamento manual de teste → acompanhamento.

**Experiência:** manter design aprovado, responsividade e acessibilidade; reduzir passos e texto excessivo para público menos habituado à internet; não mostrar banners “demo”, placeholders de pagamento ou avisos repetitivos. Erros legítimos claros, foco em campo e recuperação de progresso. Se pagamento ainda não existir no bloco em andamento, não representar como concluído.

**Minha conta:** perfil, participantes salvos, documentos pessoais reaproveitáveis, pedidos/inscrições, situação financeira, documentos pendentes, número de peito, voucher quando emitido, possibilidade de corrigir rejeição. Um responsável vê apenas seus dados e participantes autorizados.

**Aceite:** jornada real no navegador com duas pessoas/duas corridas, uploads persistentes, três condições aceitas apenas uma vez por corrida (conforme quantidade de condições), pedido Woo criado, retorno e acompanhamento sem fixtures.

## BLOCO 6 — Operação de kits, voucher e relatórios

**Voucher:** PDF por participante×corrida com QR individual, gerado após confirmação de pagamento; emissão não significa retirada liberada se documentos ainda pendentes. Link autenticado ou compartilhamento controlado, sem exposição de CPF/documentos completos no QR.

**Operação:** painel por corrida, busca participante/CPF parcial/número de inscrição, atribuição manual do número de peito, conferência de documentos, leitura QR e confirmação de entrega por operador autorizado; evitar retirada duplicada, registrar operador e horário; tratar exceções com permissão adequada.

**Relatórios:** filtros por corrida, participante, modalidade, pago/pendente, documentos e retirado/não retirado; exportação CSV/Excel de dados necessários com controle de acesso. Evitar expor anexos privados em exportações públicas.

**Aceite:** pagamento manual confirmado → voucher individual → conferência documental → número de peito → QR → entrega uma única vez → relatório consistente.

## BLOCO 7 — Homologação integral antes de Mercado Pago

**Ambiente:** HostGator WordPress/MySQL/WooCommerce + React local usando API real. Backup restaurável antes de atualizar ZIP. Não desinstalar plugin para atualizar; migrações versionadas/idempotentes preservam corridas, bibliotecas e versões. Não instalar ZIP antigo sobre banco migrado como “rollback”; restaurar backup consistente se necessário.

**Cenário obrigatório:** criar duas corridas reais de teste, documentos e condições reutilizáveis, cadastrar responsável e dois participantes com CPFs de teste válidos e consentidos, escolher Kit Oficial e APPAI, anexar documentos fictícios próprios, baixar modelo, assinar autorização de teste, finalizar pedido Woo manual, conferir status, aprovar/rejeitar/re-enviar, confirmar pagamento manual, emitir voucher/QR, informar número de peito, baixar kit, verificar relatório. Nenhuma cobrança externa.

**Testes:** CORS, HTTPS, login/logout, CSRF, permissões horizontais, uploads privados, cache e downloads, WP/Woo/HPOS/MySQL, recuperação de senha/e-mail, performance, telas 320/375/768/1440, teclado, erros, lint/typecheck/build/testes PHP/React e atualização de plugin. Medir e documentar resultados. Não deixar uploads pessoais expostos só porque o ambiente tem poucos usuários.

**Aceite:** operação real completa sem Mercado Pago; ausência de fixtures no fluxo principal; V1 pública preservada até autorização de publicação.

## BLOCO 8 — Mercado Pago, produção e pós-publicação (FUTURO)

**Fora da rodada atual.** Configurar Pix/cartão Mercado Pago, credenciais somente no servidor, webhook com assinatura/idempotência, reconciliação de status, taxas/parcelamento conforme definição comercial, testes em sandbox e cobrança autorizada, estorno/cancelamento, e-mails e observabilidade. Somente depois de homologar blocos 0–7. Aprovação para PR/merge/deploy separada.

## 4. Pendências de negócio que não devem ser inventadas

- Texto jurídico final das condições, prazo de guarda/doação e política de privacidade/retensão de documentos.
- Regras específicas de cada organizadora: autorização própria ou manuscrita, documentos obrigatórios, matrícula APPAI, tipo de kit, distâncias e preços.
- Valores por corrida/modalidade/meio de pagamento, política fiscal, cancelamento/reembolso e eventual capacidade máxima.
- Papéis exatos da Renata e operadores, escopo de permissões, prazos de retenção e política de exclusão.
- E-mail de remetente e textos transacionais definitivos; telefone/WhatsApp oficial se necessário para mensagens.
- Configuração efetiva atual do WooCommerce/HostGator, estado do plugin instalado e conclusão da mudança `pnpm dev`→API real.

**Regra:** não bloquear implementação por detalhes editoriais ou de corrida que Renata poderá preencher no painel; bloquear somente quando a ausência comprometer integridade, cobrança, autorização ou privacidade. Não inventar fatos empresariais.

## 5. Padrões de engenharia e entrega Codex

- Preservar React + TS + Tailwind + pnpm, componentes separados, responsabilidades claras, API PHP e Woo conforme convenções existentes; sem frameworks extras desnecessários.
- Não criar segundo cadastro paralelo de produtos/usuários/pedidos se WooCommerce já resolve; plugin adiciona regras específicas do negócio.
- Não usar dados pessoais em fixtures de produção, mídia pública, URLs, logs ou respostas públicas.
- Toda mudança PHP relevante: versionar plugin, migração quando necessária, gerar ZIP final e verificar conteúdo. Toda alteração de contrato: atualizar frontend e testes juntos.
- Documentação autossuficiente em `docs/project.md` e documentos específicos existentes; evitar redundância. Footer obrigatório: “Desenvolvido por Douglas Borges - Smart Local” com link `https://smartlocal.com.br` em nova aba e `rel="noopener noreferrer"`.
- Validar experiência visual real, responsividade, teclado, erros, typecheck, lint, testes, build, APIs e deploy target; não alegar testes não executados.
- Trabalhar em branch de implementação, não alterar `main` nem publicar/mergear sem autorização; não exigir repetidos passos manuais quando Codex puder configurar/testar diretamente.

## 6. Fontes e confiabilidade

Este plano consolida solicitações e decisões desta conversa e os quatro documentos entregues pelo Codex em 29/10/2026: `wordpress-setup.md`, `wordpress-implementation.md`, `wordpress-deployment.md`, `qa-block-b.md`. **Não é auditoria independente do repositório ou do servidor HostGator.** Em cada bloco, inspecionar código/instalação real e atualizar estados conforme evidência.

**Frase de retomada sugerida:** “Use o arquivo `re-almeida-kits-plano-mestre-implementacao.md` como referência do projeto. Vamos executar o BLOCO [N]. Confira o estado atual do repositório, preserve decisões aprovadas e prepare o prompt/implementação do bloco sem recriar fluxos demonstrativos.”
