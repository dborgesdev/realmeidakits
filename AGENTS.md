# Instruções para implementação — Re Almeida Kits

1. Leia `docs/project.md` integralmente. A V2 é demonstrativa, mas deve estar visualmente completa e navegável; não é backend operacional.
2. Preserve fatos reais e marcas originais. Não invente eventos, preços, depoimentos, equipe, pagamentos, cadastros ou imagens factuais; exemplos devem estar rotulados DEMONSTRAÇÃO.
3. Use React + TypeScript + Vite + Tailwind CSS + pnpm; mantenha `pnpm-lock.yaml`; bibliotecas apenas quando efetivamente necessárias.
4. Componentize **cada seção principal** em arquivo `.tsx` próprio, inclusive na home. Páginas e `App.tsx` compõem componentes. Separe dados/fixtures, regras de fluxo e apresentação.
5. Não inclua segredos, dados pessoais, CPF real ou anexos privados no projeto. Não simule pagamentos como realizados, e-mails enviados ou QR válido.
6. Garanta responsividade 320–1440 px, acessibilidade de formulários, contraste, foco visível, navegação por teclado, SEO técnico e assets otimizados.
7. Prepare build estático `pnpm build` (diretório `dist`) e Static Assets e fallback SPA no Cloudflare Workers; não exija servidor customizado.
8. Execute typecheck, lint, build e testes existentes; avalie telas, fluxos e erros antes de reportar concluído.
9. Trabalhe em branch `feat/v2-preview`; não faça commit, push, PR, merge ou deploy sem pedido explícito.
