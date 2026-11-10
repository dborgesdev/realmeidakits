# Re Almeida Kits

Frontend React/TypeScript estático na raiz da HostGator. WordPress e WooCommerce em `/app/` administram corridas, contas e participantes. O plugin entrega o HTML de `/corridas` e dos detalhes, com controles React para seleção e solicitação.

- `pnpm install --frozen-lockfile` instala as dependências.
- `pnpm typecheck`, `pnpm lint` e `pnpm test` verificam o projeto.
- `pnpm build` gera `dist/` para homologação com indexação desabilitada.
- `pnpm build:hostgator` gera a distribuição destinada ao domínio canônico.
- `pnpm plugin:zip` gera o ZIP do plugin e seu SHA-256.

Para usar `pnpm dev` com dados e sessão reais, configure uma [réplica de mesma origem](docs/wordpress-deployment.md#desenvolvimento-e-homologação). Consulte o [projeto](docs/project.md), a [autenticação](docs/wordpress-authentication.md) e a [publicação e reversão](docs/wordpress-deployment.md).

A solicitação permanece um rascunho. Upload privado, pedidos, vouchers operacionais, checkout integrado e pagamentos seguem fora do escopo.
