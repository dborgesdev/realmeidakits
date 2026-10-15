# Re Almeida Kits — V1 demonstrativa

Prévia React + TypeScript + Vite + Tailwind. Site público e jornada de retirada, sem backend, autenticação, cobrança, e-mail ou armazenamento de documentos. Estado em memória, perdido ao recarregar. Use somente dados fictícios.

## Executar e validar

`pnpm install` e `pnpm dev`. Verificações: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`. Build estático em `dist/`; `pnpm preview` para conferir produção.

## Roteiro

- Home `/`, catálogo `/corridas` e detalhes `/corridas/circuito-rio-antigo`: exemplos rotulados, sem datas ou preços inventados.
- Solicitar retirada: modalidade, identificação fictícia, dados, documentos, revisão, pagamento simulado e voucher sem validade.
- Kit oficial: dados individuais e comprovantes, sem campos APPAI. APPAI: matrícula `DEMO-101`, camiseta com tamanho ou somente número de peito sem tamanho.
- Circuito Rio Antigo exemplifica nascimento/telefone e autorização exigidos; Corrida da Primavera exemplifica ausência dessas exigências. Configurações ilustrativas, não requisitos reais confirmados.
- Usar documentos de exemplo e concordar com autorização quando exigida; testar pendências, retorno para editar e bloqueio de avanço.
- `/orientacoes`, `/privacidade` e 404. `/minha-conta` e `/admin-demo` removidas.

Seções e etapas componentizadas em `src/components`, fixtures em `src/data`, estado e regras em `src/state`. CPF, telefone e e-mail usam identificadores de exemplo, sem dados pessoais reais. Arquivos não são lidos nem enviados; somente marcadores genéricos em memória.

## Escopo futuro e referências

Administração definitiva no wp-admin WordPress/WooCommerce. Área da corredora prioriza a personalização de Minha Conta em `app.realmeidakits.com.br`, com arquitetura/interface ainda por avaliar. Nenhum contrato de API definido. Ver [escopo](docs/project.md), [integração futura](docs/integration.md) e [validações](docs/qa.md).

O conceito visual define aparência; documentos definem negócio. Fotos são conceituais. Marca original `logo-corredor-original.jpg` preservada no cabeçalho, rodapé e voucher. Eventos, valores, contatos e requisitos definitivos dependem de validação.

## Publicação

Cloudflare Workers: `pnpm deploy` (novo build e publicação), saída `dist`, Static Assets e fallback `single-page-application` em `wrangler.jsonc`. Worker `realmeidakits`, inicialmente apenas `workers.dev`, sem domínio personalizado. `pnpm exec wrangler whoami` verifica a sessão; se necessário, autenticar pelo fluxo oficial `pnpm exec wrangler login`, nunca por tokens no chat. `vercel.json` permanece como configuração alternativa de SPA. Configure `VITE_SITE_URL` para canonical conforme `.env.example`. A prévia tem `noindex,nofollow` e robots bloqueado; sitemap omitido por conter exemplos. Rever SEO/indexação na fase funcional. Não é necessário servidor customizado.

Trabalhar em `feat/v1-site`. Não fazer commit, push, PR ou merge sem pedido explícito.

A referência visual fica em `docs/visual-concept.png` e não é publicada como asset. Credenciais Wrangler, `.dev.vars*`, `.env` locais, logs, `dist` e `node_modules` são ignorados pelo Git. Após integrar a PR, atualizar a `main` e executar `pnpm deploy`; alterações de código permanecem na branch de implementação.
