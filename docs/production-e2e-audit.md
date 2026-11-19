# Auditoria E2E em produção em 19/11/2026

## Ambiente e alcance

A auditoria acessou `https://realmeidakits.com.br/` em Chromium pelo navegador do Codex. O acesso por terminal falhou na resolução DNS. A entrega local usa a branch `feat/hostgator-unified-architecture`, plugin **1.11.0**, esquema **6**, frontend HostGator **1.11.0** e child theme **1.2.0**. O frontend publicado carregava `index-CtLhuN3l.js` e `index-CR5ijWl7.css`, correspondentes aos nomes com hash do manifesto HostGator **1.10.0**. As versões publicadas do plugin, do WooCommerce e do tema ainda precisam ser conferidas no painel.

A autorização foi atualizada para usar uma só conta em três corridas de demonstração. Foi localizada a **Corrida Exemplo #1** com solicitações abertas, identificador público `46`. As outras corridas visíveis não foram identificadas como demonstração.

## Produção

| Cenário | Resultado observado |
| --- | --- |
| Home e listagem pública | Ordem mostrada nas duas telas: Runlloween (30/11/2026), Corrida Exemplo #1 (31/12/2030), Circuito Running Music (20/11/2026). A ordem não correspondia à data da corrida. |
| Detalhes da corrida | Data do evento e data-limite aparecem como campos distintos. A corrida de exemplo aceitou a seleção. |
| Cadastro e sessão | Criada a conta **Demonstração Auditoria Re Almeida**, pelo endereço autorizado no chat. O cadastro abriu sessão e voltou à corrida escolhida. O e-mail de definição de senha foi indicado pelo formulário. O recebimento na caixa postal e o login posterior com senha permanecem sem verificação. |
| Recuperação de senha | Formulário publicado acessível e renderizado em 375 px com marca, navegação e rodapé. Envio e redefinição permanecem sem verificação. |
| Solicitação | A conta avançou por Pedido, Responsável e Participantes. Reutilizou os dados do titular, vinculou a corrida de exemplo, selecionou 5k e informou a inscrição de demonstração `DEMONSTRACAO-AUDITORIA-A`. A tela Documentos informou “Rascunho salvo”. |
| Documentos | A corrida exige autorização individual e RG ou CNH. A interface publicada limitava a identificação a JPG ou PNG. Não houve confirmação de upload. O seletor interrompeu duas tentativas de automação com o arquivo sintético. |
| Jornadas A, B e C | Checkout, pedido, gateway, notificações, documentos administrativos, voucher e retirada ficaram pendentes em produção. Faltam confirmação do modo de teste, acesso administrativo e duas corridas adicionais identificadas como demonstração. |

Nenhuma cobrança foi iniciada. A conta, o cadastro do participante e o rascunho são os registros verificados. O identificador interno da conta e a auditoria de persistência no banco exigem acesso administrativo.

## Diagnóstico e correções locais

| Área | Causa, impacto e correção |
| --- | --- |
| Catálogo | A consulta original retornava IDs crescentes. A listagem PHP e a leitura de todas as páginas pelo React agora ordenam pela data do evento. O filtro de corridas passadas é preservado. Corridas sem data vêm ao fim e empates mantêm a ordem por ID. |
| Identificação | Uma restrição exclusiva por extensão existia no titular, no rascunho e na substituição de pedido. Esses pontos agora usam a validação privada comum de MIME, extensão, conteúdo e tamanho. O acesso administrativo continua sujeito a autenticação, capacidade, nonce e cabeçalhos de proteção. |
| Voucher | O PDF passa a exibir `V-<id>` com a identidade já persistida, inclusive para PDFs baixados novamente. A consulta autenticada resolve a mesma ficha. O QR e o token de confirmação continuam os mesmos. |
| CPF na conferência | O servidor aceita CPF inteiro com ou sem máscara, valida os dígitos e compara o CPF exato do participante, inclusive em snapshots que guardam a identidade só no cadastro do pedido. A pesquisa pode retornar vários vouchers e não devolve o CPF. A pesquisa e a consulta por código compartilham o limite de 60 consultas por janela de cinco minutos para o usuário e IP. |
| WooCommerce | O child theme já incluía header/footer na página e no checkout. Foi incluído template explícito de confirmação em blocos. Os blocos financeiros e hooks nativos são preservados. O pedido Re Almeida apresenta corrida, participante e ação de acompanhamento ao próprio titular. A origem do layout publicado do checkout e a eventual repetição de parcelamento pelo Mercado Pago seguem pendentes de reprodução. |
| Minha conta e Meus pedidos | Atalhos para as seções da conta, pedidos agrupados por participante/corrida, estado financeiro destacado e botão de continuação baseado na URL fornecida pelo backend. Revisão, substituição e voucher mantêm as ações condicionadas ao estado. |

## Regressão local e evidências

- Typecheck, lint, 52 testes Node, sintaxe PHP, build HostGator e inventário de arquivos com SHA-256 verificados. O ZIP instalável também foi conferido pelos testes de pacote.
- WordPress e WooCommerce 9.9.5 em loopback com SQLite. Catálogo (50 verificações), rascunhos (10), histórico de identificação e Central aprovados. As 49 verificações de vouchers exercitaram CPF com e sem máscara, múltiplos resultados, correspondência do código ao QR, REST com nonce e capacidade, PDF autenticado, e-mails interceptados e confirmação concorrente.
- A suíte funcional aprovou 55 verificações. Chromium exercitou cadastro, sessão, persistência do participante, checkout e confirmação em 320, 375, 768, 1024 e 1440 px. A confirmação distinguiu pagamento confirmado de pedido pendente. Os pagamentos foram representados por estados locais do WooCommerce.
- No Chromium local, o leitor decodificou o QR do PDF sintético e mostrou o estado usado, inválido e erro de rede. A câmera física permanece pendente.
- O HTTP local verificou RG/CNH em PDF, rejeição de MIME falso, substituição multipart, login com retorno ao PDF, e rotas REST/Ajax. A réplica não usa gateway e intercepta e-mails. As evidências de navegador em `.local-tools/production-qa/` e `.local-tools/voucher-qa/` usam registros de demonstração e ficam fora dos pacotes.

## Instalação e reversão

1. Registre as versões publicadas e faça backup do banco, plugin, tema, frontend, Apache e armazenamento privado. Preserve as personalizações do Editor do Site.
2. Em janela autorizada, instale `wordpress/releases/re-almeida-kits.zip`, confira o SHA-256 e confirme o esquema 6. Esta rodada não acrescenta migração.
3. Atualize a pasta do child theme `wordpress/themes/re-almeida-kits`. Se o checkout ou a confirmação usarem um template salvo pelo Editor do Site, confira a precedência antes de alterar a personalização. O tema-pai Twenty Twenty-Five precisa estar instalado.
4. Extraia `wordpress/releases/frontend-hostgator-1.11.1.zip` na raiz, inclusive `.vite/manifest.json`. Preserve `/app/` e `.htaccess`. Confirme a ordem e confira a configuração de cache de sessão e checkout.
5. Antes de homologar, confira o modo de teste do Mercado Pago no painel e vincule cada jornada a uma corrida de demonstração. Verifique primeiro o checkout e a origem da informação de parcelamento antes de considerar qualquer filtro de deduplicação. Execute os webhooks, estados WooCommerce, SMTP, cron, armazenamento privado e retirada concorrente em MySQL/MariaDB.
6. Para reverter, pause testes e novas retiradas. Restaure os arquivos anteriores dos três componentes juntos e conserve o banco, arquivos privados, auditoria e assets usados pelo pacote anterior. Confira eventos financeiros, documentais e de retirada produzidos no intervalo antes de retomar a operação.

## Limpeza autorizada dos registros de teste

Confirme no painel a conta com o endereço informado no chat e o nome **Demonstração Auditoria Re Almeida**. Inventarie seus participantes, rascunho, referências privadas e, se as próximas jornadas forem executadas, os IDs de solicitações, pedidos, vouchers e notificações. Faça backup e confira a titularidade e a marcação de demonstração de cada item. Confirme que eventuais pedidos correspondem somente ao sandbox, confira entregas e interrompa notificações agendadas de teste antes da remoção. Utilize as rotinas de remoção apropriadas ao WordPress/WooCommerce, preservando referências de anexos compartilhadas, trilhas de auditoria e registros legítimos. Verifique o resultado pelas telas administrativas depois da limpeza. Nesta rodada a limpeza permanece pendente de autorização.
