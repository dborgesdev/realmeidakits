# WordPress/WooCommerce — decisões e avaliação futura

## Decisões registradas

- Administração definitiva no wp-admin do WordPress, com WooCommerce e funcionalidades personalizadas conforme necessidade.
- Prioridade para personalização de Minha Conta do WooCommerce em `app.realmeidakits.com.br`.
- Painel administrativo e área da corredora demonstrativos removidos do React. Não substituir por login fictício ou links que prometam funcionalidades ainda indisponíveis.
- React V1 valida somente site público e jornada demonstrativa de retirada. Não é backend operacional nem define a arquitetura da aplicação futura.

## Avaliações pendentes

1. Inventariar WordPress/WooCommerce, hospedagem e recursos existentes; avaliar extensões realmente necessárias e possibilidade de personalização de Minha Conta antes de desenhar sua interface.
2. Definir relação entre site público e aplicação no subdomínio, navegação, sessão, autenticação e conta individual por CPF. Não presumir SSO ou compartilhamento de sessão.
3. Modelar corridas, modalidades, requisitos por evento, preços, disponibilidade, solicitações e estados operacionais. Conferir formulários e áudios antes de fechar campos.
4. Definir anexos protegidos, retenção, permissões, validação, acesso e eventual reutilização pela titular; autorização específica não é automaticamente reutilizável.
5. Avaliar checkout Pix/cartão, confirmação no servidor, falhas, cancelamentos/estornos e condições para emissão de voucher PDF/QR válido.
6. Definir baixa de retirada, prevenção de duplicidade, número de peito, auditoria, exportação Excel e e-mail após retirada.
7. Validar grupos WhatsApp, comunicações, consentimentos e política jurídica com a responsável.
8. Só após essas decisões especificar integrações e contratos, quando necessários. Nenhum endpoint, payload, plugin, webhook ou provedor está contratado/definido por esta V1.

A decisão por personalização de Minha Conta é prioritária; a arquitetura e a interface dependem dessa avaliação. Não implementar autenticação, upload remoto ou checkout como parte da prévia.
