# WordPress/WooCommerce — evolução funcional após a V2

Atualizado em 20/10/2026. Este documento registra direção e decisões pendentes, não contratos de API, schema definitivo ou funcionalidades já implementadas.

## Direção aprovada

- WordPress será a fonte das corridas e o ambiente operacional; wp-admin com WooCommerce e funções específicas, preferencialmente em plugin próprio após validação da arquitetura.
- WooCommerce será responsável pelo carrinho, checkout e pedidos reais. **Um pedido poderá conter várias corridas da mesma participante**, cada uma mantendo modalidade, distância, kit, local, documentos/aceites e registro independente de retirada.
- Priorizar personalização de Minha Conta em app.realmeidakits.com.br para acompanhamento. Arquitetura e interface dependem de avaliação das possibilidades de integração. A tela React V2 é apenas prévia, não definição final dessa área.
- Conta individual por CPF, sem cadastrar outras participantes na mesma conta. Dados pessoais poderão ser reutilizados pela titular em solicitações futuras.
- Administração React, autenticação, backend, uploads reais, pagamentos e comunicações não fazem parte da V2.

## Capacidades futuras a especificar e implementar no WordPress

1. Cadastro/edição de corridas, fotos, modalidades disponíveis, distâncias, tamanhos, tipos de kit e pontos de retirada.
2. Preços por corrida/modalidade/opção/método, disponibilidade e encerramento com fuso e decisão no servidor; impedir duplicação da mesma participante na mesma prova conforme regra final.
3. Ativação/desativação de documentos por evento/modalidade. Armazenamento privado, validação, controle de acesso e retenção. Documento geral pode ser reutilizado pela titular quando permitido; autorização específica não deve ser reutilizada automaticamente entre provas.
4. Condições específicas com versão e momento de aceitação, sem esconder diferenças entre itens. Confirmar juridicamente regra de dois meses e doação antes de operação.
5. Checkout único com itens separados; avaliar provedor Pix/cartão e confirmações verificadas no servidor. Cancelamento parcial, estorno/crédito, preço por método, expiração e pedidos abandonados ainda exigem decisão.
6. Solicitações/retiradas por corrida com estados independentes do pagamento. Definir análise documental, kit disponível e baixa, sem inferir um estado a partir de outro.
7. Atribuição manual de números de peito no WordPress. Participante pode ter números distintos em provas distintas; número de peito não substitui voucher.
8. Vouchers por item e validação operacional do QR, autorização de acesso, prevenção de duplicidade de retirada e auditoria. Emissão/invalidade deve seguir condições ainda a formalizar.
9. Consultas operacionais, exportação Excel, relatórios de solicitações concluídas, pendentes e abandonadas; definir critérios e proteção dos dados exportados.
10. Acesso principal da Renata e perfil operacional restrito para sua filha, pelo princípio de menor permissão. Escopo de cada papel e ações auditáveis ainda por validar; nenhum usuário real criado no React.
11. E-mail de confirmação com número de peito após retirada, conforme requisito histórico, com provedor e eventos a definir.
12. WhatsApp Business Platform oficial como integração **opcional pendente de avaliação de custos de configuração, integração e mensagens**. Não contratada/ativada nesta V2. Acompanhamento no site deve funcionar independentemente de notificações.

## Avaliações pendentes

Inventário da instalação WordPress/WooCommerce e hospedagem HostGator; plugins realmente necessários; relação entre domínio público e subdomínio; sessão/autenticação e proteção de CPF; retenção documental e política jurídica; regra comercial de valores, prazos e não comparecimento; cancelamentos/estornos; condições de emissão de vouchers; interface final Minha Conta e divisão de responsabilidades dos perfis.

A separação de fixtures, tipos e regras na V2 facilita substituir dados ilustrativos. Isso não define endpoint, payload, webhook, SSO, schema ou plugin contratado. Especificar contratos e estrutura de banco somente depois da avaliação funcional e de segurança. Não implementar essas integrações na prévia.
