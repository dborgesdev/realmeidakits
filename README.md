# Re Almeida Kits — V2 demonstrativa refinada

React + TypeScript + Vite + Tailwind, pnpm. Evolução preservada na branch `feat/v2-preview`, sem backend ou operações reais. **Não fazer commit, push, PR, merge ou deploy nesta rodada.** Main e V1 publicada permanecem inalteradas.

## Executar e validar

`pnpm install --frozen-lockfile` e `pnpm dev`; abrir http://localhost:5173/ . Validações: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`. Preview estático: `pnpm preview`. Dados somente em memória, apagados ao atualizar a página. Use apenas identidades e documentos fictícios.

## Pedido individual

1. No catálogo, selecionar Circuito Rio Antigo; a faixa fixa mostra seleção e estimativa. “Finalizar inscrição →” abre configuração do pedido.
2. Manter Somente para mim, continuar e conferir responsável demonstrativo.
3. Na participante, opcionalmente usar dados do responsável. Marcar explicitamente Circuito, Kit Oficial, 5 km, Kit tradicional e Ponto A. Manter identificador DEMO de inscrição.
4. Documentos: autorizar reuso fictício da identidade ou usar exemplo novo, e usar exemplos nos documentos específicos. Aceitar as condições de exemplo.
5. Revisar e escolher Pix/cartão sem cobrança. Confirmar pagamento e finalizar abre sucesso separado; edição fica bloqueada.

## Três participantes e duas corridas

1. Selecionar Circuito Rio Antigo e Corrida da Primavera. Finalizar inscrição → Para mais pessoas → quantidade 3.
2. Conferir responsável. Abrir um painel por vez; nomes e CPFs são fictícios e distintos.
3. Pessoa 1: Circuito, Oficial, 5 km, Kit tradicional, Ponto A.
4. Pessoa 2: Circuito, APPAI, 10 km, somente número, Ponto B; matrícula DEMO própria se desejar alterar.
5. Pessoa 3: Circuito, APPAI, 5 km, camiseta M, Ponto A; Primavera, Oficial, 10 km. Identificadores DEMO permanecem por item.
6. Completar documentos e aceites de cada pessoa/prova. Identidade pode ser usada pela mesma titular; autorizações e comprovantes não se propagam a outras inscrições.
7. Revisar quatro retiradas agrupadas em três pessoas. Neste exemplo, total ilustrativo Pix R$98 / cartão R$114. Alterar antes da confirmação e conferir preservação dos outros dados.
8. Adicionar/remover pessoas, respeitando limite central em `src/config/preview.ts`. Alterar quantidade não reinicia o restante do pedido; reduzir descarta últimas pessoas.

## PDF, conclusão e acompanhamento

Após finalizar, a conclusão exibe pedido fictício, participantes, corridas e vouchers únicos. Baixar PDF gera e baixa um PDF local do voucher selecionado, com logo, opções, orientações e marca d’água DEMONSTRAÇÃO — SEM VALIDADE. Sem QR/validade operacional. Não há download ou visualização de anexos pessoais.

Grupo WhatsApp permanece desabilitado com explicação porque não existem URLs confirmadas nas fixtures. Acompanhar pedido mostra status independentes por participante/corrida; primeiro item tem número 001 — EXEMPLO, demais pendentes. Seletor altera somente cenário ilustrativo de retirada.

Voltar do navegador ou abrir uma etapa após conclusão não permite editar: retorna ao sucesso. **Nova solicitação** inicia outro rascunho. Atualizar apaga a memória e mostra estado vazio, sem recuperar conta ou pedido.

## Estrutura e produção preservada

Configuração em `src/config`, tipos em `src/types`, fixtures em `src/data`, regras puras em `src/state`; componentes por seção, etapa, participante e acompanhamento. Sem novas dependências. Logo original e imagens conceituais preservados. Noindex/robots bloqueado e canonical por origem. Footer com crédito Smart Local mantido.

Wrangler mantém Worker `realmeidakits`, Static Assets `dist`, fallback SPA e workers.dev, sem domínio/backend. Script deploy disponível somente para autorização futura. Credenciais, arquivos locais, `.wrangler`, `dist` e `node_modules` ignorados.

[Escopo](docs/project.md), [integração futura](docs/integration.md) e [roteiro/resultados de QA](docs/qa.md). WordPress será administração; WooCommerce consolidará pagamento; futura conta pertence ao responsável. Segurança, documentos privados, permissões, edição controlada após pagamento e WhatsApp opcional exigem avaliação futura. Nenhuma integração ou API foi criada.
