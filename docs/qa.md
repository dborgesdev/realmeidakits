# QA — Re Almeida Kits V2 demonstrativa

Validação local em **20/10/2026**, branch `feat/v2-preview`, criada da main sincronizada (`94d2dfa2f8706300a4aa57a8b952ca84a48650cb`). Nenhum commit, push, PR, merge, deploy ou alteração de domínio nesta rodada. V1 publicada preservada.

## Roteiro de aceite

1. Abrir `/`, conferir Hero, seis assets, identidade e seções preservadas. CTA principal abre `/corridas`; selecionar diretamente na home também é possível.
2. Selecionar Circuito Rio Antigo, Corrida da Primavera e Desafio 10K da Cidade. Remover/adicionar um item e conferir quantidade/estimativa, sem duplicação. Edição encerrada não permite seleção.
3. Configurar Circuito: Kit Oficial, 5 km, Kit tradicional, Ponto A. Primavera: APPAI, 10 km, camiseta M. Desafio: APPAI, 5 km, somente número de peito. Conferir tamanho condicional e ausência de Kit Oficial no Desafio.
4. Usar identificação fictícia e conferir dados pessoais uma vez. Alterar nome de exemplo e validar sua presença na revisão, sem informar dados reais.
5. Na etapa documental, conferir campos exclusivos: inscrição do Kit Oficial, matrícula APPAI com legenda correta. Identificação pessoal aparece uma vez; autorizações do Circuito e Desafio são distintas. Testar ausência, remover, substituir e preencher exemplos.
6. Tentar seguir sem aceite; deve bloquear. Ler e aceitar condições próprias de cada corrida, incluindo minuta de dois meses/doação sujeita à validação.
7. Conferir resumo dos três itens e retornar para editar. Totais ilustrativos do roteiro: Pix **R$ 72**, cartão **R$ 84**. Não há cobrança nem dados bancários.
8. Concluir; abrir acompanhamento pelo CTA. Primeiro item exibe número 001 — EXEMPLO, demais aguardam atribuição. Alternar cenário de primeira retirada e verificar que os outros itens não mudam. Abrir voucher específico de cada prova: SEM VALIDADE e SEM QR CODE.
9. Repetir com uma corrida: Primavera Oficial, 5 km, documento de inscrição, condição, Pix **R$ 26** e confirmação. Sem matrícula APPAI, tamanho ou pickup desnecessários.
10. Acesso direto/atualização: detalhes e catálogo renderizam normalmente; solicitação/acompanhamento sem memória apresentam estado vazio seguro. Link antigo `/solicitacao/circuito-rio-antigo/dados` redireciona ao detalhe atual da corrida, sem 404.

## Verificações executadas

- `pnpm typecheck`: passou. `pnpm lint`: passou. `pnpm test`: 13 testes passaram. `pnpm build`: passou; saída estática em dist (JS 319,50 kB / 99,82 kB gzip; CSS 24,60 kB / 6,42 kB gzip). `git diff --check`: passou. Nenhuma nova dependência adicionada; lockfile, assets e Wrangler inalterados.
- **13 testes** de regras/configuração: seleção única/múltipla e remoção, não duplicação, status/prazo inclusive limite exato, modalidade/distância/kit/grade/pickup por corrida, limpeza de documentos/aceites ao mudar modalidade, dados pessoais fictícios, documentos gerais versus específicos, termos por prova/versão, totais em centavos por método/opção e valores pendentes, guardas de etapas, status/vouchers independentes, invalidação do pedido ilustrativo e MIME/tamanho. Testes usam prazos controlados para não vencerem junto das fixtures visuais.
- Navegador local: roteiro misto de três corridas completo até acompanhamento, total Pix R$ 72 e cartão R$ 84; roteiro de uma corrida Oficial concluído no Pix R$ 26.
- Bloqueios observados para documentos ausentes e condições não aceitas; remoção e substituição do comprovante testadas. Identidade geral aparece uma vez, autorizações específicas permanecem independentes.
- Retorno da revisão por teclado para documentos, configuração preservada ao revisar, remoção de corrida atualiza quantidade; opções de outra prova preservadas ao adicionar novas corridas.
- Acompanhamento: número de peito atribuído em uma prova, pendente nas outras; cenário de retirada altera somente primeira prova. Voucher aberto com identificadores de pedido e item distintos, sem QR operacional.
- Responsividade: home, catálogo com seleção, opções de três corridas, documentos e acompanhamento/voucher medidos em **320, 375, 768, 1024 e 1440 px**. Largura de conteúdo igual à largura útil, sem overflow horizontal. Título do acompanhamento em 320 px foi ajustado e revalidado.
- Capturas em `docs/qa/v2/`: catálogo, opções, documentos e acompanhamento desktop/mobile. Assets e capturas anteriores da V1 preservados.
- Console da aplicação durante os fluxos locais: nenhum erro capturado.
- Footer único compartilhado por todas as rotas com crédito exato e link Smart Local, nova aba e rel noopener noreferrer.
- Canonical pela origem, metadata, noindex e robots bloqueado preservados. Configuração Workers Static Assets, `dist` e fallback SPA mantida; nenhum código de servidor adicionado.

## Não implementado e limites

Sem login, senha, sessão autenticada, administração React, backend, API WordPress/WooCommerce, armazenamento persistente, análise/transmissão documental, pagamentos reais, PDF/QR válido, e-mail ou WhatsApp automático. O seletor local valida tipo/tamanho sem ler arquivos; nesta revisão visual foram usados os botões de exemplos, não anexos reais. Testes de arquivo cobrem MIME e limite.

Não houve auditoria completa WCAG, leitor de tela, dispositivos físicos, matriz de navegadores ou validação da V2 em domínio público. A validação de rotas foi local; Wrangler e fallback não foram publicados nesta rodada. Recarregar apaga a memória propositalmente. Preços, datas, grades e condições permanecem fixtures; decisões reais da Renata e arquitetura operacional pendentes estão em project.md e integration.md.
