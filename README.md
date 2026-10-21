# Re Almeida Kits — V2 demonstrativa

Evolução local da V1 aprovada: React + TypeScript + Vite + Tailwind, pnpm, sem backend ou operações reais. Implementação em `feat/v2-preview`, a partir da main sincronizada. **Sem commit, push, PR, merge ou deploy nesta rodada.** A V1 publicada permanece intacta.

## Executar

`pnpm install --frozen-lockfile`, `pnpm dev`, abrir http://localhost:5173/ . Validação: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`. Preview estático: `pnpm preview`. Estado somente em memória, apagado ao atualizar a página.

## Roteiro de avaliação

1. Home preservada; CTA principal abre `/corridas`. Selecionar uma ou várias provas; edição encerrada deve permanecer desabilitada. Remover e adicionar não duplica itens.
2. Continuar em **Configurar corridas**. Para o exemplo de três provas:
   - Circuito Rio Antigo: Kit Oficial, 5 km, Kit tradicional, Ponto A.
   - Corrida da Primavera: APPAI, 10 km, camiseta M.
   - Desafio 10K da Cidade: APPAI, 5 km, somente número de peito.
3. Usar perfil fictício. Conferir dados pessoais uma vez; não informar CPF, telefone ou documentos reais.
4. Conferir inscrição/matrícula por corrida. APPAI usa `DEMO-101`, não matrícula funcional. Kit Oficial usa `DEMO-INSCRICAO-001`.
5. Usar documentos de exemplo, remover/substituir e conferir bloqueio de pendências. Identidade é compartilhada pela titular; autorizações e comprovantes são específicos de cada corrida.
6. Ler e aceitar as condições demonstrativas separadamente. Minuta de dois meses/doação está sujeita à validação.
7. Revisão consolidada, retornos para edição, Pix/cartão sem cobrança. Exemplo acima: R$ 72 no Pix e R$ 84 no cartão, sem serem preços definitivos.
8. Após confirmar, clicar **Acompanhar solicitação demonstrativa**. Uma corrida tem número `001 — EXEMPLO`; outras aguardam atribuição. Abrir voucher de cada prova e alternar cenário ilustrativo de retirada. Nenhuma ação operacional ocorre.
9. Atualizar `/acompanhamento` mostra estado vazio, pois não existe armazenamento ou conta. Links antigos V1 da solicitação levam aos detalhes da corrida. `/minha-conta` e `/admin-demo` continuam ausentes.

## Estrutura e limites

Tipos em `src/types`, fixtures em `src/data`, regras de seleção/disponibilidade, validação, preços e status em `src/state`. Componentes por seção/etapa, seleção e acompanhamento. Dados pessoais fictícios preenchidos uma vez; campos específicos e documentos por item. Conteúdo e nomes dos arquivos não são lidos/armazenados/enviados. Sem autenticação, pagamento, PDF/QR válido, notificações ou administração React.

O conceito visual orienta aparência; os documentos definem regras. Todas as datas, valores, exigências e condições das fixtures são ilustrativas. Fontes e pendências em [escopo](docs/project.md), [integração futura](docs/integration.md) e [QA](docs/qa.md).

## Publicação preservada, não executada

Cloudflare Workers Static Assets `dist`, fallback SPA em `wrangler.jsonc`, Worker `realmeidakits`, sem domínio personalizado. Script `pnpm deploy` disponível para etapa posterior autorizada. Credenciais, `.env` locais, `.dev.vars*`, logs, `.wrangler`, `dist` e `node_modules` ignorados. Canonical usa origem atual se VITE_SITE_URL estiver vazio; noindex/robots bloqueado enquanto houver conteúdo fictício.

A implementação futura usará WordPress como fonte das corridas e WooCommerce para um pedido com vários itens. Minha Conta, plugin operacional, armazenamento privado, papéis, vouchers e WhatsApp oficial dependem de avaliação posterior; nenhuma integração ou contrato de API foi criado nesta prévia.
