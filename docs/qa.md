# QA — refinamento da V2

Validação local em **21/10/2026**, branch existente `feat/v2-preview`, baseline `22393609538378128a37c04d124c4a95e5b11ce0`. Esta revisão substitui o roteiro anterior limitado a uma participante. Sem commit, push, PR, merge ou deploy. V1 pública e main preservadas.

## Roteiros de avaliação

Os roteiros completos de **pedido individual** e **três participantes/duas corridas** estão no [README](../README.md). Resumo:

1. Selecionar uma ou várias corridas, expandir detalhes/estimativa na faixa fixa e acionar Finalizar inscrição →. Corrida encerrada permanece desabilitada.
2. Individual: Primavera Oficial, 5 km, responsável demonstrativo, atribuição explícita à pessoa, comprovante de exemplo e aceite. Pix R$26/cartão R$30. Opcionalmente copiar nome/telefone do responsável por ação explícita.
3. Grupo: Circuito e Primavera, quantidade três; primeira pessoa Circuito Oficial 5 km/tradicional/Ponto A; segunda Circuito APPAI 10 km/somente número/Ponto B; terceira Circuito APPAI 5 km/camiseta M/Ponto A e Primavera Oficial 10 km. Quatro inscrições: Pix **R$98**, cartão **R$114**.
4. Cada pessoa tem identidade própria, documentos pessoais e documentos específicos por prova. Primeira pessoa pode autorizar reuso de documento fictício existente. Sem autorização, não é usado automaticamente. Substituir/remover mantém o escopo. Nenhum anexo privado pode ser visualizado ou baixado pelo responsável.
5. Tentar avançar com campos, documentos ou aceites pendentes. Configurar demais pessoas pelo accordion e conferir que escolhas anteriores permanecem. Adicionar/remover, reduzir/aumentar quantidade e chegar ao máximo centralizado de 20.
6. Revisar por pessoa e total do pedido. Editar antes da finalização. Confirmar pagamento e finalizar encerra formulário e abre conclusão separada, sem cobrança.
7. Após concluir, voltar no navegador não reabre edição; etapas são guardadas e snapshot congelado. Nova solicitação limpa o pedido. Atualizar apaga toda memória; não existe recuperação de pedido/conta.
8. Baixar PDF de cada inscrição: arquivo individual com logo, pessoa, corrida, opções, ID e marca d’água DEMONSTRAÇÃO — SEM VALIDADE; sem QR operacional. Grupos sem link confirmado ficam desabilitados. Acompanhar pedido mostra status e voucher por pessoa/corrida.
9. Abrir detalhes e atualizar rotas internas. Sem estado, formulários/acompanhamento mostram saída segura para seleção. Conferir teclado, foco, responsividade e console.

## Verificações executadas nesta revisão

- **Typecheck, lint, 18 testes e build de produção passaram.** Build final: JS 334,12 kB / 104,00 kB gzip; CSS 29,97 kB / 7,67 kB gzip. `git diff --check` passou; verificação dirigida de padrões de credenciais não encontrou ocorrências nas fontes/documentos/testes. A suíte usa prazos controlados para não depender do vencimento das fixtures.
- Regras cobertas: pedido individual/grupo; limite 20 e quantidades inválidas; alteração/remoção preservando pessoas restantes; identidade distinta; atribuição explícita, mistura de provas e várias provas por pessoa; não duplicação; campos condicionais APPAI/Oficial; modalidades e grade por corrida; documentos gerais versus específicos e cenário fictício de documento existente; condições por prova; totais em centavos/Pix/cartão/valores ausentes; snapshot profundamente copiado e congelado, mutações bloqueadas, novo rascunho; vouchers e estados independentes; segurança e ausência de grupos não configurados; MIME/tamanho; estrutura PDF e offsets xref; Workers Static Assets/SPA sem backend/domínio.
- Navegador local: grupo de três pessoas e duas corridas concluído com quatro inscrições e totais R$98/R$114, incluindo Oficial, APPAI camiseta M e somente número sem tamanho. Documento pendente bloqueou avanço. Reuso fictício autorizado na primeira pessoa; demais documentos preenchidos individualmente, sem propagação automática.
- Navegador local: pedido individual Primavera Oficial concluído Pix R$26; dados do responsável copiados por ação explícita somente para pessoa escolhida; comprovante substituído; revisão com total; conclusão sem ações de edição.
- Quantidade 20 exibida na interface com 20 painéis e Adicionar participante desabilitado; redução posterior para uma pessoa manteve responsável e permitiu concluir sem reinício.
- Voltar após conclusão manteve tela de sucesso sem formulário. Nova solicitação liberou catálogo e novo estado.
- PDF **baixado pelo botão real no navegador** como `DEMO-VOUCHER-p1-primavera.pdf`. Conferido com pypdf: uma página, marca d’água e participante/ID corretos. Renderizado com Poppler e inspecionado: logo original proporcional, acentos portugueses, campos, quebra de linhas, orientações e aviso sem validade legíveis. Outro exemplo APPAI camiseta também foi renderizado. Sem bibliotecas novas no app. A tentativa preliminar de impressão foi substituída por geração/download direto; não é o comportamento final.
- Acompanhamento individual e voucher aberto; alternar cenário mudou somente estado ilustrativo de retirada. Estados de grupo e unicidade de vouchers também cobertos pelos testes de regras.
- Formulário, detalhe e acompanhamento/voucher medidos em **320, 768 e 1440px**, sem overflow horizontal. Faixa de seleção em 320px passou a layout compacto de quantidade/CTA e expansão separada; altura recolhida medida 119px, espaço inferior dinâmico e safe area. Desktop com estimativa visível, mobile com detalhes expansíveis. Imagens carregadas sem ausências nos estados inspecionados.
- Teclado: Tab a partir do CTA alcançou link seguinte com outline sólido; labels, botões de accordion, inputs nativos e condições acessíveis pelo teclado. Indicador anuncia etapa atual e concluídas; reduced motion preservado. Não foi feita auditoria WCAG completa nem teste com leitor de tela.
- Console inspecionado no fluxo individual/acompanhamento/detalhe: nenhum erro ou aviso da aplicação capturado.
- Capturas desta rodada em `docs/qa/v2-refinement/`; capturas históricas V1/V2 anteriores preservadas. Logo, imagens públicas, lockfile e Wrangler preservados, sem novas dependências.
- Preview estático do build em localhost:4173: nove rotas (home, catálogo, detalhe, pedido, participantes, conclusão, acompanhamento, orientações e privacidade) responderam HTTP 200 com HTML SPA. Logo, imagem hero, CSS e JS do build responderam HTTP 200. Isso valida o preview local; não equivale a deploy no Cloudflare.
- Footer obrigatório, noindex/robots bloqueado e canonical preservados. Nenhum domínio, servidor customizado ou integração adicionados.

## Limites e pendências

Não há autenticação, consulta de CPF, backend, persistência, análise/transmissão de anexos, pagamento, confirmação bancária, QR válido, notificações ou administração real. Campos demonstrativos não comprovam identidade. Botões de exemplos foram usados na revisão visual; tipo/tamanho de arquivo cobertos pela suíte, sem anexos privados.

A validação de navegador foi executada por interação assistida, sem suíte E2E persistente ou CI de screenshots. Não cobre dispositivos físicos, matriz de navegadores, leitor de tela ou produção pública da V2. PDF usa fonte padrão com caracteres latinos; símbolos fora dessa codificação podem ser substituídos. Eventos e valores seguem ilustrativos. Critérios reais de segurança, operação, jurídico e WordPress/WooCommerce seguem pendentes em [integration.md](integration.md).
