# Re Almeida Kits — V2 demonstrativa refinada

React + TypeScript + Vite + Tailwind, pnpm. Evolução preservada na branch `feat/v2-preview`, sem backend ou operações reais. **Não fazer commit, push, PR, merge ou deploy nesta rodada.** Main e V1 publicada permanecem inalteradas.

## Executar e validar

`pnpm install --frozen-lockfile` e `pnpm dev`; abrir http://localhost:5173/ . Validações: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`. Preview estático: `pnpm preview`. Dados somente em memória, apagados ao atualizar a página. Use apenas identidades e documentos fictícios.

## Pedido individual

1. No catálogo, selecionar Circuito Rio Antigo; a faixa fixa mostra seleção e estimativa. “Finalizar inscrição →” abre configuração do pedido.
2. Manter Somente para mim, continuar e conferir responsável demonstrativo.
3. No participante, opcionalmente usar dados do responsável. Marcar explicitamente Circuito, Kit Oficial, 5 km, Kit tradicional e Ponto A. Manter identificador DEMO de inscrição.
4. Documentos: autorizar reuso fictício da identidade ou usar exemplo novo, e usar exemplos nos documentos específicos. Aceitar as condições de exemplo.
5. Revisar e escolher Pix/cartão sem cobrança. Confirmar pagamento e finalizar abre sucesso separado; edição fica bloqueada.

## Três participantes e duas corridas

1. Selecionar Circuito Rio Antigo e Corrida da Primavera. Finalizar inscrição → Para mais pessoas → quantidade 3.
2. Conferir responsável. Abrir um painel por vez; nomes e CPFs são fictícios e distintos.
3. Pessoa 1: Circuito, Oficial, 5 km, Kit tradicional, Ponto A.
4. Pessoa 2: Circuito, APPAI, 10 km, somente número, Ponto B; matrícula DEMO própria se desejar alterar.
5. Pessoa 3: Circuito, APPAI, 5 km, camiseta M, Ponto A; Primavera, Oficial, 10 km. Identificadores DEMO permanecem por item.
6. Completar documentos de cada pessoa/prova e aceites gerais uma única vez por corrida. Identidade pode ser usada pela mesma titular; autorizações e comprovantes não se propagam a outras inscrições.
7. Revisar quatro retiradas agrupadas em três pessoas. Neste exemplo, total ilustrativo Pix R$98 / cartão R$114. Alterar antes da confirmação e conferir preservação dos outros dados.
8. Adicionar/remover pessoas, respeitando limite central em `src/config/preview.ts`. Alterar quantidade não reinicia o restante do pedido; reduzir descarta últimas pessoas.

## PDF, conclusão e acompanhamento

Após finalizar, a conclusão exibe pedido fictício, participantes, corridas e vouchers únicos. Baixar PDF gera e baixa um PDF local do voucher selecionado, com logo, opções, orientações e marca d’água DEMONSTRAÇÃO — SEM VALIDADE. Sem QR/validade operacional. Não há download ou visualização de anexos pessoais.

O botão de grupo WhatsApp só aparece com URL confirmada. As fixtures não têm URLs; a interface informa a indisponibilidade. Acompanhar pedido mostra status independentes por participante/corrida; primeiro item tem número 001 — EXEMPLO, demais pendentes. Seletor altera somente cenário ilustrativo de retirada.

Voltar do navegador ou abrir uma etapa após conclusão não permite editar: retorna ao sucesso. **Nova inscrição** inicia outro rascunho. Selecionar uma corrida aberta na home, catálogo ou detalhe depois de concluir também inicia automaticamente um novo pedido limpo, sem transportar dados/documentos/aceites e sem reset manual. Não há histórico do pedido anterior na prévia. Atualizar apaga a memória e mostra estado vazio, sem recuperar conta ou pedido.

## Estrutura e produção preservada

Configuração em `src/config`, tipos em `src/types`, fixtures em `src/data`, regras puras em `src/state`; componentes por seção, etapa, participante e acompanhamento. Sem novas dependências. Logo original e imagens conceituais preservados. Noindex/robots bloqueado e canonical por origem. Footer com crédito Smart Local mantido.

Wrangler mantém Worker `realmeidakits`, Static Assets `dist`, fallback SPA e workers.dev, sem domínio/backend. Script deploy disponível somente para autorização futura. Credenciais, arquivos locais, `.wrangler`, `dist` e `node_modules` ignorados.

[Escopo](docs/project.md), [integração futura](docs/integration.md) e [roteiro/resultados de QA](docs/qa.md). WordPress será administração; WooCommerce consolidará pagamento; futura conta pertence ao responsável. Segurança, documentos privados, permissões, edição controlada após pagamento e WhatsApp opcional exigem avaliação futura. Nenhuma integração ou API foi criada.

## QA final de navegação e validação

“Próximo participante” abre e focaliza o próximo cabeçalho; não aparece no último painel ou pedido de uma pessoa. Adicionar participante abre o novo painel. Ao continuar com erro, o campo pendente é focalizado inclusive em painel fechado, com mensagem específica associada; corrigir o campo não desloca o foco. Documentos indicam quantidade pendente. Aceites estão no pedido por corrida e versão demonstrativa, sem repetir por participante; mudar a condição ou retirar/reinserir a corrida exige novo aceite. Autorizações individuais continuam separadas.

Terminologia: Dados dos participantes → Confira seu pedido → Ir para pagamento → Pedido finalizado! → Acompanhar pedido / Voucher de retirada / Nova inscrição. As regras comerciais continuam sendo exclusivamente de retirada de kits.
