# Instruções para implementação — Re Almeida Kits

1. Leia `docs/project.md` integralmente. A arquitetura vigente é React estático no Apache e WordPress/WooCommerce em `/app/`, com contas e participantes reais. O React usa sessão nativa e nonce REST. Upload privado, pedidos, vouchers operacionais e pagamentos seguem pendentes.
2. Preserve fatos e marcas originais. Não invente eventos, preços, depoimentos, equipe, pagamentos, cadastros ou imagens factuais. Identifique exemplos de QA como DEMONSTRAÇÃO e mantenha-os fora do aplicativo.
3. Use React + TypeScript + Vite + Tailwind CSS + pnpm. Mantenha `pnpm-lock.yaml` e adicione bibliotecas somente quando necessárias.
4. Componentize cada seção principal em arquivo próprio. Páginas e `App.tsx` compõem componentes. Separe dados, regras e apresentação. As páginas públicas de corridas são servidas em PHP com controles React isolados.
5. Não inclua segredos, dados pessoais, CPF real ou anexos privados no projeto. Não simule pagamentos, envio de e-mail ou QR válido.
6. Garanta responsividade de 320 a 1440 px, acessibilidade, contraste, foco visível, teclado, SEO técnico e assets otimizados.
7. Gere `dist/` com `pnpm build` para homologação ou `pnpm build:hostgator` para produção. Preserve o manifesto e a configuração Apache.
8. Execute typecheck, lint, testes e build. Verifique telas, fluxos e erros. Registre o que depende da hospedagem.
9. Trabalhe em `feat/hostgator-unified-architecture`. Não faça commit, push, PR, merge ou deploy sem pedido explícito.
