# Re Almeida Kits — QA final da V2 demonstrativa

Atualizado em 21/10/2026, sobre o baseline `e43a57e8f0614a377e6a569778f4ac34c55a63bd`. As decisões desta revisão **substituem expressamente** as regras anteriores de uma participante por pedido e de conta individual impedindo pedidos para terceiros.

## Objetivo e limites

Evoluir a V1 e a V2 existentes, preservando identidade, imagens e componentes. Um responsável organiza um pedido individual ou em grupo, com várias participantes e corridas, e um pagamento consolidado apenas simulado. O serviço apresentado é retirada de kits, sem venda de inscrições. O CTA aprovado “Finalizar inscrição →” identifica a continuidade da solicitação.

Sem backend, autenticação, consulta de CPF, upload remoto, persistência, pagamento, análise de documentos, envio de mensagens, QR operacional ou administração React. Estado apenas na memória; atualizar a página apaga a sessão. Não usar dados, CPFs ou documentos reais. Fatos e regras vêm dos documentos; conceitos visuais não transformam exemplos em fatos reais da Renata.

Branch existente `feat/v2-preview`. O QA foi concluído antes da publicação. Em 21/10/2026, o usuário autorizou expressamente commit, push, PR, merge na main e deploy da V2 no Worker existente https://realmeidakits.smartlocal.workers.dev/, após validações. O domínio definitivo permanece pendente. Repositório https://github.com/dborgesdev/realmeidakits . Futura aplicação https://app.realmeidakits.com.br/ ; hospedagem prevista HostGator Plano M.

## Jornada e páginas

### Ajuste local dos CTAs por modalidade — 21/10/2026

Rodada posterior à publicação da V2, implementada em `feat/v2-preview`. Após avaliação local, o usuário autorizou commit, push, PR, merge na main e deploy no Worker existente em 21/10/2026. Domínio definitivo permanece pendente.

Hero mantém foto, identidade e composição, com os atalhos “Sou associado à APPAI” (primário vermelho) e “Já comprei meu kit com a organização” (secundário branco/outline), nesta ordem. Descrição esclarece que não há venda de inscrições oficiais. Mobile empilha botões com texto flexível e toque de pelo menos 52px.

`Draft.preferredModality` é uma preferência opcional para novas configurações, centralizada nas regras/contexto. Links `?modalidade=appai|oficial` do Hero e da seção Modalidades são consumidos no catálogo e removidos da URL. Novas atribuições participante/corrida usam a preferência se oferecida; caso contrário, usam a primeira modalidade válida. O catálogo direto não define preferência global obrigatória e mantém a seleção normal editável. Cada participante pode alterar sua modalidade sem afetar os demais. Retornar pela home ou escolher outro atalho não sobrescreve campos, documentos ou itens já preenchidos. Nova inscrição, atualização e seleção direta após concluir descartam a preferência anterior; clicar em um atalho após concluir cria rascunho limpo com a nova preferência explícita. Nenhuma nova rota, formulário separado, integração ou regra de elegibilidade.

- Home preserva hero e seções componentizadas, com entrada pelo catálogo ou seleção dos cards.
- `/corridas` e `/corridas/:slug`: seleção global sem duplicação, faixa fixa contextual somente com seleção e antes da finalização. Desktop exibe quantidade e referência mínima ilustrativa para uma pessoa por corrida, claramente diferente do total definitivo; após configurar todos os participantes, mostra o total real da simulação; mobile prioriza quantidade/CTA e expande detalhes. O total definitivo do exemplo depende das atribuições e opções. Espaço inferior observado dinamicamente e safe area evitam ocultar o fim da página.
- Detalhe usa imagem original conceitual em destaque com overlay e conteúdo extenso em superfície sólida.
- `/solicitacao/:stage`: **pedido → responsavel → participantes → documentos → condicoes → revisao → pagamento**. Quantidade individual ou grupo; responsável separado; atribuição explícita das corridas a cada participante; campos pessoais uma vez por pessoa. Sete etapas com indicador. Links antigos de etapas são redirecionados; links V1 com slug levam à corrida.
- `/conclusao`: tela distinta de sucesso “Pedido finalizado!”, identificador fictício, resumo agrupado, vouchers, grupos quando disponíveis, acompanhamento e nova inscrição. Nenhum formulário ou ação comum de edição.
- `/acompanhamento`: responsável e participantes com status por pessoa/corrida; sem login ou consulta de identidade. Sem snapshot apresenta estado vazio.
- `/orientacoes`, `/privacidade` e 404. Sem painel administrativo ou área de conta completa em React.

## Responsável, participantes e inscrições para retirada

Limite inicial centralizado em `src/config/preview.ts`: **20 participantes**. Quantidade inicial de 2 até o limite para grupo; inclusão e remoção posteriores preservam as demais pessoas. Reduzir quantidade remove as últimas pessoas e seus itens; adicionar gera identidade fictícia nova, sem recuperar dados descartados. Nenhum nome de equipe.

Responsável: nome fictício editável, e-mail `responsavel@example.invalid`, telefone e identificação DEMO fixos. Futuro titular da conta e transação. Participante: nome, CPF fictício único `DEMO-CPF-001` etc., nascimento e telefone de exemplo. A ação explícita “Esta pessoa sou eu” copia nome e contato do responsável somente para a pessoa escolhida, mantendo sua identidade demonstrativa. Não há cópia automática entre pessoas.

Cada combinação participante + corrida aparece uma vez. Selecionar corridas no catálogo não as atribui automaticamente ao grupo. Cada pessoa precisa de pelo menos uma atribuição, que mantém modalidade, distância, kit, tamanho condicional, retirada, valor, documentos, condições e estados próprios. Accordion abre uma pessoa por vez, com progresso contextual à etapa: dados/opções completos ou pendentes; na etapa documental, quantidade de documentos pendentes. “Próximo participante” fecha o atual, abre o próximo, rola ao cabeçalho e focaliza seu botão, respeitando scroll-margin e movimento reduzido. Não aparece para uma única pessoa ou no último painel. Adicionar participante abre e focaliza o novo painel.

Ao tentar continuar com pendências, a regra identifica o primeiro campo/grupo relevante, abre o painel correspondente e move o foco até o controle, com mensagem específica, aria-invalid e aria-describedby. O formulário usa validação dirigida para incluir painéis fechados; resumo acessível permite retornar à pendência. Digitar não reposiciona o foco; corrigir o campo remove seu erro visível. Labels visuais não repetem a corrida quando o agrupamento já a identifica; controles mantêm nomes acessíveis completos quando necessário. Remover uma corrida do catálogo remove apenas seus itens de todas as pessoas, mantendo identidades.

## Corridas e modalidades

Fixtures em `src/data/events.ts`; tipos em `src/types/domain.ts`. Preservadas as três provas conceituais e uma edição encerrada. Datas, valores, pontos, condições, tamanhos e eventos são DEMONSTRAÇÃO; não constituem oferta real. Imagens conceituais e `logo-corredor-original.jpg` preservados. Data e prazo opcionais. Disponibilidade depende de status e prazo, incluindo igualdade no encerramento; validação futura autoritativa no WordPress.

- Kit Oficial: número demonstrativo de inscrição/pedido `DEMO-INSCRICAO-001`, distância, tipo de kit e local quando configurados; sem matrícula APPAI.
- APPAI: matrícula APPAI `DEMO-101` editável por inscrição, não matrícula funcional; camiseta com número exige tamanho da grade da corrida; somente número não exige tamanho. Valores e opções não são globais.
- Mudar modalidade reinicia documentos e campos exclusivos daquele item; mantém distância/local se válidos, sem afetar outra pessoa ou prova.
- Circuito e Primavera têm ambas; Desafio somente APPAI. Requisitos distintos: Circuito Oficial identidade/inscrição/autorização; Circuito APPAI identidade/autorização; Primavera Oficial inscrição, APPAI identidade; Desafio identidade/autorização/declaração.

## Documentos e condições

Documento pessoal pertence à participante. A primeira pessoa representa cenário fictício predefinido de documento existente: “Já existe um documento cadastrado para esta participante.” Reuso depende de checkbox explícito de autorização; substituição, atualização e remoção continuam disponíveis. Outras pessoas começam pendentes. Não existe busca de CPF, exposição, visualização ou download de anexos pessoais pelo responsável.

Documentos específicos e autorizações pertencem à inscrição para retirada, sem reaproveitamento automático entre provas ou pessoas. Selecionar exemplo ou arquivo local armazena somente marcador genérico; conteúdo e nome do arquivo não são lidos, enviados ou guardados. PDF/JPG/PNG até 5 MB. Isso não representa validação documental.

A pessoa responsável aceita cada condição **uma única vez por corrida selecionada no contexto do pedido**, independentemente da quantidade de participantes. `Draft.acceptedConditions` e o snapshot final guardam registros por ID da corrida e versão demonstrativa da condição. A versão combina a identificação e o conteúdo exato da minuta: mudar ID ou texto torna o aceite anterior inválido. Adicionar outro participante, mudar opções ou modalidade sem mudar as condições da corrida preserva os aceites válidos. Retirar uma corrida do catálogo remove seus aceites; reinseri-la exige novos aceites. Cada condição da mesma corrida exige sua própria confirmação, sem duplicar checkbox por pessoa.

Esse aceite geral não substitui documentos e autorizações individuais exigidos pela inscrição para retirada. A etapa é organizada por corrida e informa os participantes vinculados. Não permitir finalização com condição obrigatória pendente. Minuta do Circuito sobre até dois meses após não comparecimento e possível doação posterior permanece sujeita à validação jurídica e operacional. A prévia não registra um aceite jurídico real.

## Revisão, simulação e bloqueio

Revisão e pagamento agrupados por participante; um total soma todos os itens em centavos por método Pix/cartão. Referências ilustrativas preservadas: R$26/30 em algumas opções, número R$20/24 e camiseta Desafio R$28/32. Valores ausentes aparecem a confirmar. Edição de participantes, opções, documentos e condições permitida antes da finalização.

“Confirmar pagamento e finalizar” informa expressamente ausência de cobrança. Sem QR Pix, chave, cartão ou confirmação bancária. Cria snapshot local profundamente copiado e congelado `DEMO-PEDIDO-001`; todas as mutações comuns são bloqueadas no contexto e nas regras. Acesso às etapas por URL ou voltar do navegador redireciona para conclusão. Iniciar **Nova inscrição** libera um novo rascunho. Também é possível voltar à home, catálogo ou detalhe e selecionar uma corrida aberta: essa ação cria automaticamente um rascunho limpo, sem reabrir o snapshot anterior. Participantes preenchidos, documentos, opções e aceites do pedido anterior não são herdados. Corridas encerradas continuam indisponíveis, inclusive após concluir. A tela anterior de conclusão deixa de estar disponível ao iniciar outro pedido: não existe histórico persistente nesta prévia. Recarregar também apaga toda a memória, sem recuperar pedido anterior.

## Vouchers, PDF e acompanhamento

Um voucher por participante/corrida: `DEMO-VOUCHER-<participante>-<corrida>`. Exibe marca original, identidade fictícia, modalidade, kit, tamanho quando aplicável, distância, pedido e orientações. Marca d’água e aviso “DEMONSTRAÇÃO — SEM VALIDADE”; sem QR ou prova operacional.

Botões Baixar PDF, Entrar no grupo de WhatsApp e Acompanhar pedido. **Baixar PDF gera e baixa um PDF A4 individual diretamente no navegador**, com a marca JPEG original incorporada, fonte padrão WinAnsi, informações da inscrição e marca d’água. Sem biblioteca adicional, backend ou leitura de anexos privados. O documento não é autorização operacional. A geração é separada em `src/state/voucherPdf.ts`, testada estruturalmente e conferida por extração de texto e renderização.

URL de grupo é opcional e só deve ser configurada quando confirmada; nenhuma URL inventada. Sem URL confirmada, o botão de entrar no grupo não é exibido e uma explicação permanece visível. Links HTTPS WhatsApp válidos abrem em nova aba com proteção de opener. Não há envio de mensagem.

Acompanhamento por pessoa/prova distingue financeiro, documentos, número de peito, kit e retirada. Primeiro item mostra `001 — EXEMPLO`, demais aguardam atribuição. Seletor muda somente cenário ilustrativo de retirada, sem atualizar snapshot ou executar operação. Pagamento não implica número, disponibilidade ou retirada. Documentos do exemplo completos não são documentos analisados/aprovados.

## Qualidade e implantação preservada

React + TypeScript + Vite + Tailwind + pnpm, lockfile preservado; sem novas dependências. Seções e etapas em arquivos próprios; configuração, fixtures e regras separadas da apresentação. Formulários off-white, branco, grafite/ardósia, ajuda areia e conclusão verde discreto; marca vermelha nas ações e erros. Hierarquia título bold, subtítulo semibold, labels medium e ajuda regular. Labels, teclado, foco, erros, estados textuais e reduced motion; responsividade alvo 320–1440px.

Footer mantém “Desenvolvido por Douglas Borges - Smart Local”, https://smartlocal.com.br , nova aba e `noopener noreferrer`.

Wrangler preservado: Worker `realmeidakits`, Static Assets `dist`, fallback SPA, workers.dev e nenhum backend/domínio. Preview com noindex, robots bloqueado e canonical por origem/configuração. Typecheck, lint, testes, build e QA registrados em [qa.md](qa.md).

## Pendências funcionais

Confirmar com Renata eventos reais, preços, distâncias, grades, pontos, datas, documentos, condições e minuta jurídica. WordPress/WooCommerce, conta do responsável, segurança documental, papéis, relatórios, pagamentos e procedimento de edição após pagamento dependem de avaliação futura, conforme [integration.md](integration.md). WhatsApp oficial opcional sujeito à aprovação e custos. Nenhum contrato de API, esquema SQL ou integração criado nesta fase.

## Terminologia e ações aprovadas

“Inscrições abertas/encerradas”, “Finalizar inscrição”, “Escolha suas corridas”, “Dados dos participantes”, “Confira seu pedido”, “Ir para pagamento →”, “Pedido finalizado!”, “Acompanhar pedido”, “Voucher de retirada” e “Nova inscrição”. Linguagem neutra para participantes e pessoa responsável. O serviço continua sendo retirada de kits, não venda de inscrição oficial.

Avançar/concluir: primário vermelho. Voltar, Próximo participante, edição relevante, vouchers e Nova inscrição: secundários neutros com borda. Revisão reúne edição da pessoa responsável, participantes, documentos e condições em grupo único; não repete links equivalentes em cada subtotal. Conclusão mantém Acompanhar pedido como ação principal, com Ver vouchers e grupos e Nova inscrição secundários.
