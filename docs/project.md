# Re Almeida Kits — Escopo da V2 demonstrativa

Atualizado em **20/10/2026**, conforme os apontamentos da Renata e a solicitação de implementação. Evolução da V1 aprovada, sem redesign ou operação real.

## Objetivo e limites

Prévia React navegável para uma participante individual selecionar uma ou várias corridas, configurar cada item, preencher os dados uma vez, conferir documentos e condições, simular pagamento consolidado e conhecer o acompanhamento por corrida. Não vende inscrições nem kits.

**Sem autenticação, backend, uploads remotos, armazenamento de arquivos/dados pessoais, pagamentos, comunicações, leitura de QR ou interfaces administrativas.** Estado e cenário de pedido somente em memória; atualizar a página apaga a demonstração. Não existe conta real. A tela de acompanhamento não é uma área da corredora completa nem define a interface final de Minha Conta do WooCommerce.

Repositório: https://github.com/dborgesdev/realmeidakits . V1 publicada: https://realmeidakits.smartlocal.workers.dev/ . Site público existente: https://realmeidakits.com.br/ . Futura aplicação WordPress/WooCommerce: https://app.realmeidakits.com.br/ . Hospedagem futura contratada: HostGator Plano M.

## Referências e decisões

Documentos e decisões do usuário definem as regras; conceito visual define aparência. Datas, provas, contatos e preços ilustrativos não são fatos reais da Renata. Preserve as marcas originais, utilizando `logo-corredor-original.jpg`, e as seis imagens WebP aprovadas. Hero, tipografia, composição e direção visual da home preservados; evoluir a entrada na jornada sem splash ou introdução obrigatória.

Fontes históricas: proposta e aceite WhatsApp de setembro/2026, esclarecimentos e material de outubro; revisão de escopo V1 em 15/10 e apontamentos da Renata de 20/10. Formulários originais e áudios ainda precisam ser cotejados; não afirmar validação documental inexistente nem publicar dados pessoais desses materiais.

## Páginas e jornada

- `/`: home existente, três eventos ilustrativos, controles de seleção e resumo da seleção em seção própria. CTA principal continua levando ao catálogo.
- `/corridas`: múltipla seleção, quantidade, estimativa demonstrativa e CTA de configuração. A mesma corrida não ocupa dois itens. Remover e adicionar preserva os dados pessoais; cada corrida removida perde suas opções/documentos específicos ao ser adicionada novamente.
- `/corridas/:slug`: requisitos por modalidade, orientação, prazo de exemplo, condições ilustrativas e adicionar/remover corrida.
- `/solicitacao/:stage`: **configuracao → identificacao → dados → documentos → condicoes → revisao → pagamento → confirmacao**. Seleção de corridas precede as oito etapas. Links V1 `/solicitacao/:slug/:stage` levam aos detalhes atuais da corrida.
- `/acompanhamento`: acessível após confirmação; sem pedido na memória mostra estado vazio e CTA. Sem login, busca por CPF ou recursos de conta.
- `/orientacoes`, `/privacidade` e 404. `/minha-conta` e `/admin-demo` permanecem ausentes.

## Dados configuráveis por corrida

Tipos explícitos em `src/types/domain.ts`; fixtures em `src/data/events.ts`. Cada corrida contém ID/slug, nome, foto, descrição, data opcional, encerramento opcional, status aberta/encerrada/indisponível, modalidades disponíveis, distâncias, tipos de kit, preços em centavos, documentos por modalidade, condições versionadas de exemplo, pontos de retirada e orientações. URL WhatsApp é opcional e só deve existir se confirmada; nenhuma foi criada.

Disponibilidade é calculada pelo status e pelo prazo, incluindo igualdade ao encerramento. Seleção e conclusão são bloqueadas para provas encerradas. Frontend demonstra a regra; a decisão autoritativa futura é do WordPress.

As três provas originais continuam ilustrativas e abertas no cenário inicial; quarta fixture é uma edição encerrada do Circuito Rio Antigo, reutilizando seu asset. Todos os prazos, datas, pontos, grades e valores são **DEMONSTRAÇÃO**, não ofertas confirmadas. Campos opcionais permitem que data e prazo não existam.

### Modalidades e campos por item

- **Kit Oficial:** número de pedido/inscrição fictício obrigatório (`DEMO-INSCRICAO-001`), distância, tipo de kit quando configurado, local de retirada quando aplicável. Nunca exige matrícula APPAI.
- **APPAI:** matrícula APPAI (`DEMO-101`; não matrícula funcional/de serviço), distância, camiseta com número de peito e tamanho obrigatório, ou somente número sem tamanho. Local de retirada quando aplicável. Tamanhos e opções vêm da configuração de cada corrida.
- Modalidades não são globais. Circuito e Primavera exemplificam ambas; Desafio exemplifica somente APPAI; edição encerrada exemplifica somente Kit Oficial.
- Alterar modalidade limpa documentos e aceites específicos daquele item e reinicia os campos exclusivos; conserva distância/local se ainda válidos. Outros itens e dados pessoais permanecem intactos.

### Dados pessoais, uma vez

Nome completo fictício editável, CPF fixo `DEMO-CPF`, nascimento fictício editável, telefone/WhatsApp `DEMO-TELEFONE` e e-mail `participante@example.invalid`. Marcadores protegem a prévia da coleta desnecessária de identificadores reais. Não exigir CPF/RG/telefone reais. Nome e data são validados; não existe validação de identidade ou cadastro.

### Documentos

Não existe lista única rígida. Cada modalidade de cada corrida define seus requisitos. Identificação com foto é geral, reutilizável pela titular; comprovantes, declarações e autorizações são específicos do item. Autorização de uma corrida nunca atende a outra.

Componentes permitem usar exemplos, selecionar arquivo fictício local, substituir e remover, com status claro. Somente marcador genérico fica na memória: conteúdo e nome do arquivo não são guardados ou enviados. PDF/JPG/PNG até 5 MB; validação de tipo/tamanho não constitui análise documental real.

Exemplos: Circuito Oficial requer identidade + inscrição + autorização; Circuito APPAI requer identidade + autorização; Primavera Oficial apenas inscrição, APPAI apenas identidade; Desafio APPAI identidade + autorização + declaração demonstrativa.

### Condições

Aceite obrigatório contextual por corrida e ID de versão de exemplo. O Circuito demonstra a minuta sobre prazo de até dois meses após não comparecimento e possível doação posterior; texto explicitamente sujeito à validação jurídica/operacional. Outras corridas exibem condições diferentes, sem esconder diferenças em checkbox genérico. A prévia não registra momento jurídico do aceite. WordPress deverá preservar versão e momento no futuro.

### Pagamento e confirmação

Um resumo contém todos os itens e seus próprios valores. Totais calculados em centavos conforme método Pix/cartão e opção. R$ 26 Pix/R$ 30 cartão aparecem como referências ilustrativas em algumas configurações, sem regra universal; opção somente número exemplifica R$ 20/R$ 24 e camiseta do Desafio R$ 28/R$ 32. Valores desconhecidos são mostrados como a confirmar, sem serem tratados como zero definitivo.

Sem chave, QR Pix, formulário de cartão, transação ou confirmação bancária. Confirmação gera somente snapshot local `DEMO-PEDIDO-001`. Revisar a demonstração invalida esse snapshot; não cria duplicidade operacional ou histórico real de pedidos.

### Acompanhamento, números e vouchers

Exibe participante fictícia, pedido local, corridas/modalidades, simulação de pagamento único, situação documental, número de peito, disponibilidade do kit, retirada e voucher por item. Estados independentes: pagamento não implica atribuição de número, kit disponível ou retirado.

Cenário inicial: primeiro item mostra número `001 — EXEMPLO`; demais mostram ainda não informado. Seletor de cenário apenas alterna a visualização de uma primeira retirada concluída, sem funções administrativas ou registro real.

Número de peito identifica participante na corrida; voucher identifica solicitação de retirada por corrida; QR será mecanismo operacional futuro. Cada item tem voucher `DEMO-VOUCHER-<id>`, com marca original, indicação SEM VALIDADE/NÃO É COMPROVANTE e substituto SEM QR CODE. Não há PDF ou QR válido.

WhatsApp Business Platform depende de decisão comercial/técnica e custos. A prévia não promete recurso contratado ou ativado; acompanhamento pelo site independe dele.

## Visual, acessibilidade e qualidade

Manter React + TypeScript + Vite + Tailwind, pnpm/lockfile e componentes por seção/etapa. Separar tipos, fixtures, seleção, disponibilidade, validação, preços e cenários de status. Não criar dependências desnecessárias ou contratos de API. Apresentação poderá consumir dados substitutos sem reescrever a interface; o contrato real ainda não foi definido.

Fundo neutro, cards brancos, labels/legends, foco visível, teclado, erros acessíveis, estados vazios/selecionados/indisponíveis. Resumo da seleção em fluxo normal, sem cobrir controles no celular. Microinterações discretas e respeito a prefers-reduced-motion. Verificar 320–1440 px.

Crédito obrigatório em todo footer: **Desenvolvido por Douglas Borges - Smart Local**, link https://smartlocal.com.br, target _blank e rel noopener noreferrer.

Cloudflare Workers Static Assets em `dist`, fallback SPA e Wrangler preservados, sem Worker de servidor ou alteração de domínio. Metadata, canonical pela origem e noindex/robots bloqueado preservados enquanto houver conteúdo fictício.

## Entrega e pendências

Branch **feat/v2-preview**, criada da main sincronizada. **Nesta rodada não fazer commit, push, PR, merge ou deploy sem nova autorização.** Prévia publicada V1 permanece intacta.

Executar typecheck, lint, testes e build; inspecionar fluxos, erros, rotas e responsividade. Roteiro/resultados em [qa.md](qa.md). Arquitetura funcional futura em [integration.md](integration.md).

Renata ainda deve confirmar eventos, distâncias, grades, pontos, datas/prazos, documentos por modalidade, preços/regra Pix-crédito, texto de dois meses/doação, demais condições e custos WhatsApp. Segurança, armazenamento, papéis, checkout, relatórios e modelo funcional definitivo pertencem à fase WordPress.
