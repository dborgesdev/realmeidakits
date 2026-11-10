# WordPress/WooCommerce — integração e histórico

> Registro histórico. Consulte a [arquitetura vigente](project.md), a [autenticação](wordpress-authentication.md) e o [procedimento HostGator](wordpress-deployment.md).

> **Escopo vigente — 05/11/2026, Bloco C:** contas customer, autenticação, CPF único e até 20 participantes por titular persistidos no WordPress. Acesso entre domínios por código PKCE de uso único; senhas ficam no fluxo WordPress e o bearer somente na memória do React. Catálogo real com pnpm dev. Checkout, pedidos e uploads privados permanecem futuros. Plugin **1.2.0 / esquema 3**, sem deploy nesta rodada. As notas abaixo preservam o histórico.

> **Escopo vigente — 30/10/2026:** V2 de desenvolvimento consome exclusivamente a API pública https://app.realmeidakits.com.br/wp-json/re-almeida/v1 com `pnpm dev`, sem modos/env de integração, fixtures no aplicativo ou avisos de demonstração. Formulários vazios; sem upload privado, envio de pedido ou pagamento implementado. Plugin **1.1.1** libera leitura local em loopback/portas 5173–5199; atualização no servidor é necessária. Worker publicado e main preservados. Os registros abaixo descrevem etapas históricas e não substituem esta orientação. [Setup](wordpress-setup.md) e [QA atual](qa-block-b.md).

> Atualização de 29/10/2026: refinamento entregue no plugin **1.1.0 / esquema 2**, com oito abas, bibliotecas versionadas de documentos/condições, PDFs públicos em branco e duplicação revisada. API e React integrados, mantendo demo padrão e bloqueio de pedidos/pagamentos operacionais. Consulte [implementação](wordpress-implementation.md), [operação](wordpress-setup.md) e [QA](qa-block-b.md). A descrição histórica da V2 abaixo não limita o backend expressamente solicitado nesta evolução.

> Atualização de 27/10/2026: cadastro de corridas, API de consulta e seleção de fonte React implementados no [Bloco B](wordpress-block-b.md). Este documento mantém o histórico e a direção dos módulos operacionais ainda futuros; afirmações abaixo de inexistência de API dizem respeito à rodada demonstrativa de 21/10.

Atualizado em 21/10/2026. Esta revisão **substitui** a restrição anterior de uma participante por pedido e conta restrita a solicitações próprias. A V2 é somente demonstrativa; não define API, tabelas SQL, payloads, endpoints ou interface definitiva.

## Modelo conceitual aprovado

| Entidade                | Responsabilidade                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Responsável             | Conta autenticada, pedidos, autorizações e contatos. Titular da transação; pode também ser participante.                                                      |
| Participante            | Identidade individual, CPF, dados e documentos pessoais próprios. Pode integrar várias corridas.                                                              |
| Pedido                  | Responsável, participantes vinculados, valores, pagamento consolidado e estado financeiro.                                                                    |
| Inscrição para retirada | Uma participante + uma corrida; modalidade, kit, distância, tamanho, local, documentos específicos, condições, número de peito, voucher e estado operacional. |
| Corrida                 | Nome/imagem, modalidades, valores, abertura/encerramento, documentos, condições, locais e grupo WhatsApp opcional confirmado.                                 |

Pedido pode misturar várias participantes e corridas. Impedir duplicação participante/corrida; limite inicial de 20 participantes configurável. A modelagem final deve considerar a relação entre pessoas, conta responsável e inscrições sem confundir titularidade dos documentos com pagamento.

## Administração, conta e pagamentos

WordPress é fonte e administração das corridas/solicitações. Painel definitivo **wp-admin** com WooCommerce e funções personalizadas necessárias, preferencialmente plugin próprio após avaliação. WooCommerce cuida do checkout/pagamento consolidado; avaliar itens vinculados a inscrições individuais, valores por método, pagamentos verificados no servidor, expiração, cancelamentos parciais, estornos e abandono.

Priorizar personalização de Minha Conta do WooCommerce em app.realmeidakits.com.br para o responsável. Interface, autenticação e integração serão definidas após inspecionar instalação e hospedagem HostGator Plano M. Não há admin/login/conta real React.

Após pagamento confirmado, alterações relevantes exigem procedimento operacional controlado, autorização, registro e eventual ajuste financeiro. Não permitir simples edição livre; procedimento ainda não implementado. Números de peito atribuídos separadamente por prova; pagamento não significa documentos aprovados, número atribuído, kit disponível ou retirada concluída.

## Segurança e documentos

CPF é identificador, **não credencial**. Consultar apenas CPF não pode revelar existência ou conteúdo de documentos de terceiros. Reuso exige autenticação, autorização e validação adequadas, com privacidade e finalidade definidas. Documento pessoal pertence à participante; comprovante/autorização específicos pertencem à inscrição e condições da prova. Não expor download/visualização de anexos privados na interface do responsável sem política específica autorizada. Definir armazenamento privado, retenção, revogação, permissões, auditoria e proteção de exportações.

Aceite geral realizado pela pessoa responsável uma única vez por condição/corrida no contexto do pedido. Preservar identificação e versão da condição, data/momento, vínculo com pedido/corrida e identificação dos participantes aos quais se aplica. Adicionar participante a uma corrida já aceita não exige repetição visual do mesmo aceite, desde que a condição continue aplicável e válida. Alterar a versão aplicável exige novo aceite. Autorizações individuais do atleta ou de responsável legal continuam documentos separados e obrigatórios quando configurados; o aceite geral não as substitui. Na prévia a versão é demonstrativa (ID + conteúdo exato), sem registro jurídico de data.

Validar a minuta de dois meses/não comparecimento/doação. Definir emissão e invalidação de vouchers, QR operacional, prevenção de retirada duplicada e trilha de auditoria. Conta principal da Renata e perfil operacional restrito da filha devem seguir menor privilégio e escopos validados. Não criar usuários reais na prévia.

## Operação e comunicação pendentes

Relatórios e exportações Excel de pedidos concluídos, pendentes e abandonados; filtros e proteção a definir. E-mail histórico com número após retirada depende de provedor e eventos confirmados. Grupo de cada corrida configurado no WordPress somente quando confirmado.

WhatsApp Business Platform oficial permanece **opcional e pendente de aprovação da cliente**, avaliação de custos de configuração, integração e mensagens. Não ativado/contratado na V2. Acompanhamento no site deve funcionar sem notificações. Sem envio automático nesta fase.

Inspecionar infraestrutura real, plugins existentes, domínio/subdomínio, sessões, segurança, checkout e divisão de papéis antes de definir contratos. As fixtures e regras desacopladas da prévia não constituem contrato de integração.

## Novo pedido e limites da prévia

Após concluir, o snapshot permanece imutável. Selecionar uma corrida aberta na home, catálogo ou detalhe inicia automaticamente outro rascunho, sem transportar dados pessoais, documentos ou aceites anteriores. A prévia não mantém histórico e não exige reset manual. Na versão real, a criação de outro pedido deve preservar os pedidos anteriores na conta autenticada da pessoa responsável; arquitetura e permissões ainda dependem da avaliação da instalação WooCommerce. Nenhuma nova API ou persistência foi criada nesta rodada.
