# WordPress/WooCommerce — direção futura

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

Condições por inscrição com versão e momento de aceite; validar minuta de dois meses/não comparecimento/doação. Definir emissão e invalidação de vouchers, QR operacional, prevenção de retirada duplicada e trilha de auditoria. Conta principal da Renata e perfil operacional restrito da filha devem seguir menor privilégio e escopos validados. Não criar usuários reais na prévia.

## Operação e comunicação pendentes

Relatórios e exportações Excel de pedidos concluídos, pendentes e abandonados; filtros e proteção a definir. E-mail histórico com número após retirada depende de provedor e eventos confirmados. Grupo de cada corrida configurado no WordPress somente quando confirmado.

WhatsApp Business Platform oficial permanece **opcional e pendente de aprovação da cliente**, avaliação de custos de configuração, integração e mensagens. Não ativado/contratado na V2. Acompanhamento no site deve funcionar sem notificações. Sem envio automático nesta fase.

Inspecionar infraestrutura real, plugins existentes, domínio/subdomínio, sessões, segurança, checkout e divisão de papéis antes de definir contratos. As fixtures e regras desacopladas da prévia não constituem contrato de integração.
