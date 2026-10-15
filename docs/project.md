# Re Almeida Kits — Escopo da V1 demonstrativa

Revisado em 15/10/2026 conforme as decisões de escopo do usuário.

## Objetivo e limites

Validar uma experiência pública visualmente completa, navegável e responsiva de solicitação de **retirada de kits de corrida**. Não é venda de inscrições ou kits. A V1 React não contém painel administrativo, área da corredora, backend, autenticação, pagamento real, envio de e-mail ou armazenamento de documentos. `/admin-demo` e `/minha-conta` foram removidas e exibem a página 404.

A futura administração será o **wp-admin do WordPress**, com WooCommerce e funcionalidades personalizadas quando necessário. Para a área da corredora, priorizar a personalização de **Minha Conta do WooCommerce em app.realmeidakits.com.br**. Arquitetura e interface serão definidas após avaliação das possibilidades de integração; não há contrato de API definido nem integração implementada nesta etapa. Ver [decisões pendentes](integration.md).

## Hierarquia de referências

Os documentos do projeto definem regras de negócio. O conceito visual define aparência, composição e linguagem visual. Datas, nomes de provas, contatos, valores e outros exemplos da imagem não são informações reais da Renata. Decisões atuais do usuário prevalecem sobre o escopo anterior. Dados não confirmados devem ficar pendentes ou explicitamente rotulados DEMONSTRAÇÃO.

Fontes históricas: proposta WhatsApp de 25/09/2026 e aceite; adições de 29/09 e confirmação de 30/09; esclarecimentos de 23/09; conversas de hospedagem de outubro e marcas originais de 30/09. Não publicar dados pessoais, documentos ou credenciais desses materiais.

## Fatos e regras confirmadas

- Marca Re Almeida Assessoria / Re Almeida Kits; serviço de retirada de kits para participantes.
- Site público: https://realmeidakits.com.br/ . Aplicação futura WordPress/WooCommerce: https://app.realmeidakits.com.br/ . Hospedagem contratada: HostGator Plano M.
- Repositório: https://github.com/dborgesdev/realmeidakits . Trabalhar em `feat/v1-site`, sem commit, push, PR ou merge sem pedido explícito.
- Preservar ambas as marcas originais. Usar `logo-corredor-original.jpg` na interface conforme decisão do usuário; não redesenhar.
- Modalidades: **Kit oficial** e **Associado à APPAI**.
- Solicitação individual; a futura conta é individual por CPF. Autorização significa retirada física pela Re Almeida, não gerenciamento de contas alheias.
- Documentos e autorização variam conforme corrida/modalidade. Não presumir reutilização de autorização específica por prova.
- Operação futura contempla configuração de preços, Pix/cartão, voucher PDF com QR, grupo WhatsApp por corrida quando existente, gestão, baixa e prevenção de duplicidade. Exportação Excel e e-mail com número de peito após retirada também são requisitos futuros, fora da V1.

## Páginas e jornada da V1

- `/`: home com Header, Hero, Events, HowItWorks, Modalities, Guidance, FAQ, FinalCTA e Footer, cada seção principal em arquivo próprio. Navegação e CTAs levam somente às funcionalidades disponíveis.
- `/corridas` e `/corridas/:slug`: exemplos rotulados, sem datas, locais, preços ou disponibilidade reais inventados. Requisitos exibidos são configurações ilustrativas.
- `/solicitacao/:slug/:stage`: modalidade → identificação fictícia → dados → documentos → revisão → pagamento simulado → confirmação ilustrativa. A seleção da corrida ocorre antes dessas sete etapas.
- `/orientacoes`, `/privacidade` e 404 personalizada. O texto de privacidade descreve a prévia e não se apresenta como política jurídica final.

A identificação usa perfil de demonstração, sem login, senha ou conta. Nome editável fictício; CPF representado pelo identificador fixo `DEMO-CPF`; e-mail `participante@example.invalid`. Nenhum CPF real é necessário. Estado somente em memória, perdido ao recarregar.

### Campos e regras por modalidade

**Base individual:** nome, identificador de CPF, nascimento e telefone quando exigidos. A prévia exemplifica nascimento/telefone condicionais nas configurações de corrida, sem afirmar requisitos reais dos eventos. Telefone é fixo `DEMO-TELEFONE`; nascimento é data fictícia editável. E-mail do perfil é ilustrativo e não recebe mensagens.

**Kit oficial:** participante já inscrita; não solicitar matrícula APPAI nem tamanho de camiseta. Conferir comprovante de inscrição e documento com foto quando exigidos; autorização apenas quando configurada.

**APPAI:** matrícula obrigatória fictícia (`DEMO-` e 3 a 6 dígitos), dados individuais e escolha entre camiseta com número de peito (tamanho obrigatório) ou somente número de peito (sem exigir tamanho). Grade PP/P/M/G/GG apenas ilustrativa, não oferta confirmada. Documentos seguem configuração demonstrativa da corrida; requisitos específicos definitivos da modalidade ainda dependem da conferência dos formulários originais.

As fixtures atuais exigem comprovante de inscrição e documento com foto; Circuito Rio Antigo e Desafio 10K da Cidade exemplificam autorização, nascimento e telefone exigidos; Corrida da Primavera exemplifica ausência dessas exigências. Todos são exemplos, não regras de eventos reais.

### Documentos, revisão e confirmação

PDF/JPG/PNG até 5 MB no seletor local. Não ler conteúdo, transmitir, armazenar arquivos ou registrar nomes pessoais de arquivos; apenas marcador genérico em memória. Oferecer documentos de exemplo prontos. Bloquear revisão sem os documentos específicos e a concordância de autorização exigida.

Validar campos antes de avançar; impedir acesso direto a etapas posteriores com requisitos pendentes. Permitir voltar e corrigir sem perder o estado na sessão. Revisão apresenta dados mascarados, modalidade, documentos e valor a confirmar. Alterações nos dados invalidam a conclusão anterior.

Pagamento Pix/cartão apenas selecionável para ilustrar a etapa, sem chave, dados bancários, formulário de cartão ou confirmação de cobrança. Confirmação não cria pedido/reserva. Voucher mostra evento, participante fictícia, modalidade, pagamento apenas simulado e retirada a confirmar. Avisos **DEMONSTRAÇÃO / SEM VALIDADE / NÃO É COMPROVANTE** e substituto visual **SEM QR CODE**. Nenhum PDF válido, QR operacional ou link de grupo inventado.

## UX, visual e acessibilidade

Preservar o conceito esportivo aprovado, fotografia conceitual, marca original, acentos da identidade e linguagem direta para pessoas com pouca familiaridade digital. Não apresentar imagens conceituais como provas ou pessoas reais da operação.

Formulários sobre fundo neutro claro, card branco destacado, títulos hierárquicos, campos identificáveis, legendas e agrupamentos lógicos, indicador de etapas, ajuda e erros claros. Ação principal visível e retorno disponível. Labels associados, foco visível, teclado, contraste e alvos confortáveis. Responsividade entre 320 e 1440 px, sem overflow horizontal.

## Implementação e SEO

React + TypeScript + Vite + Tailwind CSS; pnpm e lockfile. Separar páginas, componentes por seção/etapa, fixtures e regras. Dependências somente necessárias. Assets otimizados em `public/`; lazy loading abaixo da dobra. Não incluir segredos ou anexos privados.

Build estático `pnpm build` em `dist/`, publicação Cloudflare Workers com Static Assets e fallback SPA em `wrangler.jsonc`, sem servidor customizado ou backend. Script `pnpm deploy` executa build e Wrangler. `vercel.json` preservado como alternativa. Domínio definitivo não será configurado nesta publicação; utilizar `workers.dev`. A prévia React é independente da futura implementação WordPress/WooCommerce; não presumir reutilização do frontend como aplicativo definitivo.

Title, description, canonical configurável, OG/Twitter, favicon original. Toda a prévia permanece `noindex,nofollow` e robots bloqueado; sem sitemap de eventos fictícios ou JSON-LD factual inventado. Rever indexação no lançamento funcional.

## Validação e pendências

Executar typecheck, lint, testes disponíveis e build; verificar navegação, formulários, duas modalidades, documentos condicionais, voucher, erros, teclado e responsividade. Resultados em [qa.md](qa.md).

Campos exatos dos formulários Google e detalhes dos 19 áudios ainda não transcritos continuam pendentes; não afirmar que foram conferidos. Antes da fase funcional validar eventos atuais, fotos oficiais, valores, grade, endereços/horários, grupos, contatos, regras de cancelamento/estorno, textos jurídicos e provedor de pagamento.

Integração, segurança, armazenamento protegido, autenticação e interface Minha Conta serão avaliados posteriormente. Nenhuma decisão pendente autoriza inventar endpoints, plugins contratados ou contratos de API.
