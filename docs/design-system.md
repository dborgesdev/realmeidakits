# Identidade visual e homologação

A referência de dashboard orienta a hierarquia de navegação, etapas, campos e ações. A referência de inscrição orienta as curvas no fundo e as superfícies brancas. O fluxo real mantém sete etapas, o catálogo publicado e a marca original. As duas referências foram usadas somente para composição visual.

## Design system

A fonte de verdade é [public/design/tokens.css](../public/design/tokens.css). Apache serve o mesmo arquivo para React, páginas PHP de corridas e WordPress. Montserrat compõe títulos e Nunito Sans, textos e controles. Os WOFF2 latinos são locais e suas licenças OFL ficam ao lado dos arquivos.

A paleta usa #E10600 como vermelho de marca e #C90803 para ações com texto branco. Preto #111111 e cinza #525252 sustentam a leitura. Superfícies brancas, bordas cinzas, curvas de baixa opacidade e sombras moderadas separam conteúdo e fundo. Ações secundárias usam contorno vermelho, links são sublinhados e o foco é azul. Campos e botões principais usam 52 px. A escala de espaçamento parte de 4 px. A etapa atual tem número, cor e nome, com um resumo compacto em telas estreitas. As transições respeitam a preferência por movimento reduzido.

## Inventário

| Superfície | Rotas e estados |
| --- | --- |
| React público | Início, catálogo indisponível ou carregando, orientações, privacidade e página inexistente. |
| Corridas em PHP | Catálogo, detalhe, corrida aberta ou encerrada e ausência de corridas; seleção interativa em React. |
| Solicitação em React | Corridas e quantidade, responsável, participantes e opções, documentos, condições, revisão e encaminhamento ao pagamento. Inclui seleção vazia, erros de validação, conflito CPF/corrida e estados de gravação. |
| Conta e acompanhamento em React | Acesso à conta nativa, participantes, identificação, documentos do pedido, histórico, acompanhamento e conclusão. |
| WordPress e WooCommerce | Login, registro, recuperação e redefinição, conta e seus endpoints, pedidos, checkout clássico ou Blocks e páginas de pagamento e confirmação. O child theme estiliza a saída instalada, com os formulários, estados e regras do WooCommerce. |

A inscrição oficial na prova continua sendo um conceito distinto do serviço de retirada. O texto de confirmação nativo diferencia pagamento confirmado de pedido recebido aguardando pagamento. Os formulários, contratos, regras de duplicidade e reutilização documental continuam nos componentes e no plugin existentes.

## Atualização e reversão

1. Em homologação, guarde cópias dos assets da raiz, do plugin e do tema ativo. Confirme que Twenty Twenty-Five está instalado.
2. Gere o pacote da raiz com `pnpm build:hostgator` e confira `dist/.htaccess`, `dist/.vite/manifest.json` e `dist/design/`. Para uma prévia sem indexação use `pnpm build`.
3. Publique a raiz no ambiente de homologação preservando `/app/`. Atualize o plugin com `wordpress/releases/re-almeida-kits.zip` e confira o SHA-256. Instale o ZIP do child theme e ative-o somente em homologação.
4. Confira as partes de cabeçalho e rodapé. Personalizações de templates já salvas pelo Editor do site podem ter precedência sobre os arquivos do tema. Confirme o tipo de checkout existente e os estilos do gateway instalado.
5. Para reverter, reative o tema anterior, restaure o plugin anterior e recoloque os assets anteriores da raiz, incluindo o manifesto e o Apache. Use as cópias da mesma versão.

## Pendências de homologação

Confira no WooCommerce configurado o login, registro, recuperação, pedido recebido, pagamento pendente, falha, cancelamento e campos e iframes do gateway. Valide também dados reais da corrida, armazenamento privado, retomada e reutilização documental com contas de teste. O relatório de consolidação funcional registra separadamente as limitações conhecidas do PHP local.

## Verificação desta revisão

Typecheck, lint, 47 testes Node, build HostGator e sintaxe PHP do child theme e do template de corridas passaram. O pacote do plugin foi regenerado e conferido pelo teste de integridade. Os pacotes da raiz e do child theme foram inspecionados para confirmar a estrutura de instalação.

A página inicial, o catálogo PHP e a área de conta React não apresentaram rolagem horizontal em 320, 375, 390, 768, 1024 e 1440 px. A inspeção visual usou uma réplica isolada, com catálogo e sessão controlados para o teste. O WordPress local carregou a classe e o cabeçalho do child theme, mas a réplica não exibiu o formulário nativo do WooCommerce. A jornada autenticada completa, o checkout com gateway, o zoom a 200% e uma auditoria integral de conformidade WCAG 2.2 AA continuam pendentes.

No menu mobile, Tab alcançou o controle com foco visível, Espaço abriu o menu e Escape fechou e devolveu o foco ao botão. Na primeira abertura da página, a aplicação mantém a ordem natural de Tab, começando pelo link de salto ao conteúdo.

## Refinamento de formulários e corridas — 10/11/2026

Os formulários de conta e solicitação adotam 24 px entre campos relacionados e 36 px entre grupos. O seletor nativo de arquivos é compartilhado pela identificação pessoal, pelos documentos do rascunho e pela substituição de documentos de um pedido. Os blocos mostram instruções, modelo disponível, formato, limite quando informado e estado do envio.

No início e no catálogo, o link do título ocupa toda a superfície do card. O botão de seleção fica em uma camada independente e mantém sua ação por teclado. O detalhe mantém os fatos cadastrados sobre a corrida e o serviço de retirada. Uma corrida continua listada até o fim da data da prova no fuso America/Sao_Paulo, inclusive quando o prazo de solicitação já encerrou. Sem data cadastrada, ela permanece listada. O filtro não muda o cadastro, a página direta, a API nem os pedidos existentes.

O botão de contato usa o número oficial informado (+55 21 99412-3883). A configuração fica em public/design/whatsapp.js, compartilhada por React, templates de corrida e child theme. Em páginas com formulário, o contato fica no fim da página para manter os campos e botões livres. Nas demais telas, fica no canto inferior direito e sobe quando a barra de seleção aparece. Os grupos de corrida mantêm seus links próprios.

Validação do refinamento: typecheck, lint, 48 testes Node, build HostGator e sintaxe dos três arquivos PHP públicos passaram. O navegador conferiu abertura do detalhe pela superfície do card, seleção independente, acesso anônimo e nome/erro de formato no seletor de arquivos em 320 e 1440 px. A réplica WordPress completa excedeu o tempo de resposta na primeira tentativa. A inspeção final usou os templates PHP reais com fixtures de demonstração isoladas. Nenhum arquivo foi enviado.
