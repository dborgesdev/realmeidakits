# Solicitação, documentos e checkout WooCommerce

## Contrato vigente

Cada corrida tem um único preço do serviço de retirada, em centavos. Ele se aplica a cada combinação de participante e corrida, em qualquer modalidade ou opção. A REST pública expõe somente priceCents para o valor da corrida. Nulo significa a confirmar e bloqueia o checkout. O pagamento e as condições financeiras configuradas pertencem ao checkout nativo WooCommerce.

O cadastro lê a configuração anterior sem reescrever corridas em massa. Quando todos os preços antigos preenchidos forem iguais, o valor é reaproveitado. Se houver divergência, o painel mostra os valores anteriores e o preço fica a confirmar até que um operador informe o novo valor. Ao salvar a configuração nova, o plugin arquiva os valores anteriores em _rak_legacy_prices. Pedidos já existentes conservam seus próprios valores.

## Banco e implantação

- A versão 1.4.0 acrescenta a migração de esquema 4. Ela cria a tabela rak_requests com o prefixo da instalação, chave única por titular e rascunho, ID do pedido WooCommerce e snapshot da solicitação. Rascunhos, referências de arquivos e estados operacionais usam metadados privados do WordPress. O painel usa a permissão manage_rak_requests, atribuída inicialmente a administradores.
- Antes de publicar, faça backup consistente de banco, frontend, plugin e armazenamento privado. Atualize o ZIP do plugin e o frontend na mesma janela. A versão anterior da interface espera o contrato antigo de preços. Em reversão, restaure as duas versões juntas e trate os preços novos pela cópia de segurança. Mantenha a tabela e os arquivos privados de solicitações já registradas.
- Configure RAK_PRIVATE_DOCUMENT_ROOT com um diretório exclusivo, existente e gravável pelo PHP, fora do document root e da instalação WordPress. Aponte a configuração somente no servidor. RAK_PRIVATE_DOCUMENT_MAX_BYTES pode ajustar o limite padrão de 5 MiB até o teto de 20 MiB, respeitando upload_max_filesize e post_max_size. Confira se nenhuma outra aplicação, alias ou link simbólico expõe o diretório.
- Para homologar checkout, configure RAK_WOOCOMMERCE_SERVICE_PRODUCT_ID com um produto WooCommerce simples, virtual, publicado e sem controle de estoque. Use WooCommerce em BRL com checkout nativo acessível para os clientes e preços-base do serviço configurados no catálogo. Verifique a visibilidade da loja no WooCommerce. O modo Em breve pode substituir a página de pagamento por um aviso mesmo quando a URL responde com HTTP 200. RAK_ENABLE_WOOCOMMERCE_REQUESTS permanece desativado por padrão. Habilite somente no ambiente autorizado de testes e confira a tributação e as condições financeiras aplicáveis ao fluxo de pagamento de pedido já criado.
- No checkout nativo, configure o Mercado Pago em modo de teste pela administração do WooCommerce. Verifique os meios habilitados, as notificações e os estados retornados pelo gateway. O frontend apenas abre a URL nativa de pagamento do pedido existente. O status financeiro consultado vem do WooCommerce.
- Preserve bypass de cache compartilhado para /app/wp-json/re-almeida/v1/account/ e subrotas, bootstrap, conta, carrinho e checkout. Preserve Cookie, Set-Cookie, X-WP-Nonce e Cache-Control. Confira os cabeçalhos também com dois titulares autenticados.

## Operação e recuperação

O rascunho é gravado sob a sessão nativa e um número de versão. Após conflito, recarregue a versão do servidor. Dados pessoais e aceites ficam no WordPress. A seleção anônima continua temporária na aba. A nova solicitação explícita troca a chave do rascunho. Anexos da solicitação histórica são retidos mesmo após iniciar outro rascunho.

A criação recalcula a disponibilidade, preço, opções, titularidade, documentos e condições. Se o valor mudou em relação ao exibido, o backend pede revisão. Uma reserva durável antecede a criação do pedido WooCommerce. Se houver falha incerta entre reservar e vincular, a API bloqueia novas tentativas para aquele titular. Confira em Solicitações e no WooCommerce se existe um pedido com o metadado _rak_request_id. Reconcilie a reserva antes de permitir outra tentativa. Evite apagar reservas sem confirmar a situação do pedido associado.

No menu de solicitações, operadores autorizados podem baixar documentos, registrar análise, informar o número de peito e atualizar a retirada. Esses estados têm histórico separado do pagamento. O arquivo fica vinculado à inscrição em que foi anexado. O reaproveitamento entre inscrições ainda não está disponível. Defina a política de retenção antes de abrir a operação e confira arquivos órfãos em caso de falha no sistema de arquivos.

## Homologação restante

- Teste na HostGator com dois titulares e dados sintéticos. Verifique download autenticado, recusa a outro titular e acesso direto por HTTP no Apache.
- Confirme o checkout nativo e os estados aprovado, pendente, recusado, cancelado e reembolsado com Mercado Pago em teste. Verifique retorno do WooCommerce, cache, entrega de e-mail e logs.
- Confirme máscaras e acessibilidade no tema nativo WooCommerce. O React formata CPF, telefone e nascimento em DD/MM/AAAA.
- Defina a política de retenção e acesso da equipe, incluindo análise de documentos enviados. A validação de conteúdo usa MIME e assinatura de arquivo; uma eventual inspeção antimalware exige infraestrutura própria.

## Validação local

Foram executados typecheck, lint, os builds padrão e HostGator, 46 testes Node, 50 verificações de integração do WordPress, 34 verificações de CORS e 10 verificações de rascunho autenticado. A réplica descartável com WordPress e WooCommerce confirmou isolamento de titulares, restauração de rascunho, conflito de versão, upload privado, rejeição de MIME falso, revogação de anexos e retenção no histórico. O teste também confirmou que um total adulterado é recusado, um reenvio devolve o mesmo pedido pendente e a página nativa exibe o item do pedido. Nenhum pagamento foi efetuado.

O ZIP do frontend foi comparado byte a byte com os arquivos do build HostGator. O manifesto e o .htaccess estão incluídos. O pacote não contém a pasta app. As regras Apache foram verificadas pelo teste de configuração e ainda precisam ser exercitadas no servidor HostGator.

## Diagnóstico do armazenamento na HostGator (1.4.1)

Na versão 1.4.0, a mensagem de indisponibilidade aparecia se a consulta autenticada a GET /app/wp-json/re-almeida/v1/account/draft/documents falhasse ou se retornasse enabled false. O plugin exigia que RAK_PRIVATE_DOCUMENT_ROOT já apontasse para um diretório gravável e resolvível fora do document root e da instalação WordPress. Ele não criava o diretório.

1. Preserve o caminho e o conteúdo do armazenamento anterior se ele já existir. Para uma instalação sem configuração, confirme no cPanel a raiz pública real e informe no wp-config.php um caminho absoluto exclusivo fora dela. Exemplo de sintaxe com caminho fictício: `define('RAK_PRIVATE_DOCUMENT_ROOT', '/home/CONTA/rak-private-documents');`. O PHP pode criar o último componente com modo 0700 se o pai já existir e for gravável. Em alternativa, crie a pasta como usuário da conta. Confira o proprietário e o acesso do usuário PHP.
2. Abra Ferramentas → Saúde do site no WordPress e procure o teste de documentos privados. O teste verifica a resolução dos caminhos, permissões, Fileinfo, diretório temporário e a criação, gravação e remoção de um arquivo de prova. Confira no PHP do domínio se open_basedir permite a pasta privada e o diretório temporário. Se necessário, solicite ajuste à hospedagem.
3. Confira file_uploads, upload_tmp_dir, upload_max_filesize e post_max_size. O limite anunciado considera tanto os limites do PHP quanto o limite do plugin, com margem para o multipart. Em caso de HTTP 403 ou 406 no POST autenticado, confira horário, URL e identificação da regra com o suporte HostGator. Preserve o ModSecurity.
4. Em homologação autorizada, teste com PDF, JPEG e PNG sintéticos e duas contas. Confirme GET de configuração, POST, GET do token e DELETE com cookie e X-WP-Nonce. Valide persistência após nova sessão, recusa a outro titular e acesso direto por HTTP. Confirme que não há alias ou link simbólico público para a pasta. A aplicação recusa pastas públicas. Caso open_basedir impeça um caminho externo, solicite uma localização privada permitida antes de habilitar o upload.

A revisão 1.4.1 mantém o esquema e as referências existentes. Para reverter, restaure os pacotes anteriores preservando o wp-config.php, o banco e o diretório de documentos.

### QA 1.4.1

- Typecheck, lint, 46 testes Node, builds padrão e HostGator e comparação do ZIP com dist passaram.
- Na réplica WordPress, passaram 50 verificações de integração, 34 de CORS, 10 de rascunho e 3 cenários de armazenamento. Sem configuração ou com caminho público, o diretório não foi criado. Com caminho privado válido, o plugin criou o diretório e o teste de Saúde do site escreveu e removeu o arquivo de prova.
- A réplica HTTP confirmou PDF, JPG e PNG, limite excedido, extensão incompatível, conteúdo falso, isolamento entre titulares, recusa por URL direta, restauração em nova sessão, substituição, remoção, bloqueio de checkout sem anexo obrigatório e retenção após criar o pedido.
- A condição específica no PHP/Apache da HostGator ainda exige acesso ao diagnóstico do servidor. A verificação HTTP local não comprova o comportamento do Apache ou do ModSecurity em produção.

## Armazenamento protegido em wp-content (1.5.0)

O caminho externo testado na HostGator não é visível ao PHP web, mas o teste de leitura e escrita em wp-content passou. A versão 1.5.0 oferece modo protegido explícito para o layout /app/wp-content. O modo externo continua sendo o padrão. A pasta interna é criada no painel com modo 0700 quando ainda não existe. Os arquivos existentes e seus vínculos permanecem onde estão.

1. Faça backup do banco, wp-config.php, .htaccess da raiz e arquivos privados existentes. Atualize apenas o plugin pelo ZIP.
2. No wp-config.php em /app, acrescente `define('RAK_PRIVATE_DOCUMENT_STORAGE', 'protected');` antes de wp-settings.php. Mantenha a definição existente de RAK_PRIVATE_DOCUMENT_ROOT para leitura de anexos antigos do armazenamento externo. Deixe RAK_PRIVATE_DOCUMENT_HTTP_VERIFIED ausente durante o teste. Reabra o painel administrativo para o plugin preparar a pasta.
3. No .htaccess do document root do domínio, após RewriteEngine On e como primeira RewriteRule, sem RewriteCond associada, adicione `RewriteRule ^app/wp-content/rak-private-documents(?:/|$) - [F,NC]`. Preserve as demais regras e o .htaccess em /app.
4. Confira o .htaccess de wp-content/rak-private-documents. Se existir de uma tentativa anterior, faça backup e substitua o conteúdo dessa pasta dedicada pelas três linhas abaixo. O plugin aceita LF ou CRLF, com quebra de linha final.

   ```apache
   Require all denied
   Options -Indexes -ExecCGI
   SetHandler none
   ```

5. Coloque na pasta apenas um arquivo de texto sintético temporário com nome aleatório e conteúdo único, sem dados reais. Confirme pelo cPanel que o arquivo existe. Faça GET sem cookie e sem seguir redirecionamentos pelo caminho direto em /app/wp-content/rak-private-documents/<nome>, pelo domínio e por todos os aliases capazes de servir a instalação. Exija HTTP 403 e ausência do conteúdo sintético. Verifique também a URL da pasta. Remova o arquivo de prova. HTTP 200, 404, 5xx ou redirecionamento deixam a confirmação pendente.
6. Somente após a prova, acrescente `define('RAK_PRIVATE_DOCUMENT_HTTP_VERIFIED', true);` no wp-config.php. A constante registra confirmação manual. O plugin verifica as duas regras no disco em cada acesso, mas não consegue detectar alterações de roteamento, proxy ou configuração Apache que preservem esses arquivos. Remova a confirmação antes de mudanças nessa infraestrutura e repita a prova.
7. Recarregue Ferramentas → Saúde do site. Depois do resultado positivo, use dois titulares sintéticos para testar envio, rejeição de arquivo inválido, retomada, download, substituição, recusa a outro titular e conferência administrativa. Repita a prova HTTP se houver dúvida sobre aliases ou regras. Nenhum arquivo real deve ser usado na prova direta.

Para reverter o destino de novos envios, mude RAK_PRIVATE_DOCUMENT_STORAGE para external. Preserve a proteção Apache, a pasta interna e a confirmação verificada enquanto houver anexos internos a consultar na versão 1.5.0. Uma versão anterior do plugin não lê anexos internos. Preserve o banco e as duas pastas para voltar a usar a versão 1.5.0 ou migrar os arquivos de forma controlada.

### QA 1.5.0

Typecheck, lint, 46 testes Node, 99 verificações PHP existentes e os dois cenários novos do modo protegido passaram. Os testes novos cobrem provisionamento, regra principal ausente, confirmação pendente, proteção local alterada, leitura pelo titular e recusa a outro titular. Os testes de arquivos e regras locais não constituem prova HTTP em Apache. A prova na HostGator e a homologação autenticada de upload, retomada, substituição e conferência ainda devem ser executadas antes de usar documentos reais. O frontend não mudou de contrato e não foi recompilado.

## Ativar o checkout nativo (1.5.1)

A mensagem de checkout indisponível é um HTTP 503 do POST /app/wp-json/re-almeida/v1/account/orders. Ela indica que pelo menos um requisito para criar novos pedidos não foi atendido. O teste Checkout Re Almeida Kits em Ferramentas → Saúde do site aponta o primeiro requisito pendente. O diagnóstico exige permissão administrativa.

1. Instale o ZIP 1.5.1. Preserve as constantes e arquivos do armazenamento de documentos.
2. No WooCommerce, use BRL. Em Configurações → Avançado, confirme a página publicada e pública de checkout e mantenha configurado o endpoint de pagamento de pedido. A loja deve estar acessível aos clientes, com o modo Em breve desativado.
3. Crie ou identifique um produto publicado para o serviço de retirada. Use produto simples, virtual, sem gerenciamento de estoque e, se desejado, oculto no catálogo. O ID é o número do produto no painel. O plugin usa o preço da corrida para os itens do pedido. Revise a configuração tributária do produto e do WooCommerce para conferir o total nativo esperado.
4. No wp-config.php da instalação em /app, antes de carregar wp-settings.php, defina RAK_WOOCOMMERCE_SERVICE_PRODUCT_ID como o ID inteiro do produto e RAK_ENABLE_WOOCOMMERCE_REQUESTS como true. Não duplique definições. Recarregue a Saúde do site e corrija eventuais requisitos pendentes.
5. Configure em WooCommerce → Configurações → Pagamentos os meios de pagamento a oferecer. Para homologação financeira, use uma réplica ou ambiente autorizado com o gateway em modo de teste, credenciais de teste e dados sintéticos. Confirme que o gateway aparece para o pagamento de um pedido existente. Use apenas os instrumentos de teste do gateway. A abertura do checkout sem enviar pagamento também permite conferir pedido, total e reenvio sem cobrança.
6. Teste duas submissões do mesmo rascunho e confirme que ambas devolvem o mesmo número e a URL nativa de pagamento do pedido. Teste retomada no Acompanhamento. No sandbox, confira transações pendentes, aprovadas e recusadas e compare o estado no WooCommerce com o estado no acompanhamento. O retorno do navegador não confirma pagamento.

Para interromper a criação de novos pedidos, altere RAK_ENABLE_WOOCOMMERCE_REQUESTS para false. Pedidos já vinculados continuam disponíveis no acompanhamento e seguem as condições de pagamento efetivamente ativas no WooCommerce. Preserve o banco, o produto e os documentos ao reverter o plugin.

## Central operacional (1.6.0)

Atualize apenas o ZIP do plugin e preserve o wp-config.php, banco e armazenamento privado. Abra Re Almeida Kits → Solicitações com uma conta que tenha manage_rak_requests. A fila exige status WooCommerce processing ou completed, is_paid e data de pagamento nativa. Qualquer reembolso retira o pedido da fila ativa. Exceções financeiras preservam consulta e histórico. A central consulta o estado atual do WooCommerce a cada carregamento e revalida o pagamento ao editar.

Filtre pela corrida e, se necessário, pelo participante, titular, CPF, inscrição, modalidade, documentos e retirada. Os indicadores acompanham a corrida e a seleção em lote é por página. A exportação com filtros inclui todas as páginas. O XLSX grava valores como texto para manter zeros iniciais e impedir execução de fórmulas. O ZIP de anexos tem limite de 40 arquivos e 40 MiB. Ambas as exportações exigem diretório temporário PHP gravável fora da raiz pública. A fila percorre solicitações vinculadas em lotes de 100 e exibe até 30 linhas por página. Avalie a latência com o volume real antes de ampliar o uso.

O modal registra aprovação ou rejeição por documento. Rejeições exigem justificativa. A aprovação da inscrição confere se os arquivos obrigatórios configurados estão acessíveis. Os metadados de nome e data ficam disponíveis para uploads novos. Anexos anteriores podem não ter essas informações. O histórico combina auditoria operacional com notas internas do WooCommerce. A biblioteca de RG/CNH reutilizável entre inscrições continua fora desta mudança.

Homologue em réplica com dados sintéticos. Inclua um pedido com duas pessoas, pedidos pendente e pago, um reembolso, documento ausente, rejeição com justificativa, aprovação, número de peito e retirada em lote. Confira o Excel com filtros e em mais de uma página, os downloads privados, o acesso por uma conta sem a capacidade administrativa e a tabela em desktop e tablet. Para reverter, reinstale o pacote anterior e preserve os metadados. As análises e os campos novos permanecem no banco para uma reinstalação desta versão.

## Módulo documental (1.7.0)

Atualize o plugin e o frontend HostGator na mesma janela. Faça backup do banco, dos arquivos do frontend, do plugin e dos documentos privados. Preserve wp-config.php, as duas regras Apache e o diretório privado. O pacote do frontend deve ser extraído na raiz do domínio. Preserve /app e incorpore as regras do .htaccess do pacote às regras locais já existentes.

- Biblioteca de documentos e aba Documentos da corrida usam o mesmo formulário. Selecione ou envie somente modelos PDF em branco fornecidos pela responsável. A substituição cria uma nova versão. Corridas e pedidos conservam a versão associada. A criação pela aba tenta salvar a associação imediatamente em corrida existente. Em corrida nova ou com condição ainda não gravada, salve a corrida para publicar a associação.
- Em Re Almeida Kits → Configuração de solicitações, ajuste o limite entre 1 e 100. O padrão é 20. O WordPress envia o limite na inicialização da sessão e valida rascunhos no servidor. Ao reduzir o limite, rascunhos maiores continuam preservados e precisam ser reduzidos antes de avançar.
- Em Minha conta, o titular pode enviar JPG ou PNG do próprio RG ou CNH. A busca de disponibilidade é autenticada, limitada por conta e só considera participantes cadastrados e atribuídos ao rascunho salvo. A confirmação registra titular, origem, CPF e rascunho no servidor. O cliente recebe apenas a indicação de disponibilidade e a referência opaca da confirmação. A própria rota de download do rascunho não aceita abrir referências reutilizadas.
- O envio alternativo pertence à solicitação e preserva o documento original. Pedidos novos guardam a configuração documental usada no checkout. Quando um documento é rejeitado ou fica pendente em pedido operacional, o titular pode anexar outro em Minha conta ou Acompanhamento. A substituição conserva o histórico e o documento anterior. A central permite conferir anexos e justificativas sem alterar a situação financeira.
- Para homologar, use duas contas sintéticas e uma corrida de teste. Valide que a segunda conta consegue reutilizar a identificação da primeira, mas não recebe o arquivo. Envie um arquivo alternativo e confira que a identificação da primeira conta permanece. Teste modelo em branco, condição por modalidade, rejeição, substituição após pagamento de teste, histórico e limite configurável. Confira também o bloqueio HTTP direto no Apache e a atualização da página após logout e login.
- Para reverter, restaure juntos o plugin e o frontend anteriores. Preserve o banco, as opções, os metadados e arquivos privados. A versão anterior não interpreta referências de reutilização nem as substituições da 1.7.0. Se já houver solicitações novas, mantenha backup íntegro e coordene a reversão antes de processá-las.

### QA 1.7.0

Passaram typecheck, lint, 46 testes Node, build HostGator e a comparação do ZIP com o conteúdo de dist. A réplica WordPress passou 50 verificações de integração, 34 de CORS, 10 de rascunho autenticado, 36 de biblioteca e refinamento e a suíte da central operacional. O teste HTTP com duas contas sintéticas confirmou envio do RG/CNH próprio, disponibilidade para participante salvo, confirmação opaca, recusa de download cruzado, envio alternativo sem alterar a identificação da origem, retomada em nova sessão, documento específico e geração da URL nativa do WooCommerce. Nenhuma cobrança foi efetuada. A interação visual do modal e a substituição pós-pagamento pela interface ainda precisam de homologação em navegador, assim como o comportamento na HostGator.

## Solicitações independentes e catálogo de preços e retirada (1.8.0)

Atualize juntos o plugin e o frontend HostGator. Faça backup do banco, do plugin, do frontend e dos documentos privados. Preserve /app, wp-config.php e o bloqueio Apache do armazenamento. Nenhuma migração reescreve pedidos históricos.

- Em Minha conta, use Nova solicitação para limpar a seleção e iniciar outro rascunho. O histórico fica em Acompanhar pedidos. Um reenvio do mesmo rascunho ainda recupera o pedido correspondente.
- Cada par CPF normalizado e corrida é verificado no rascunho salvo e na finalização. A verificação não revela dados da outra conta. No servidor MySQL/MariaDB, GET_LOCK serializa a verificação e a gravação de novos pedidos. Pagos, em espera e pendentes dentro do prazo bloqueiam o par. Cancelados, com falha ou reembolsados integralmente saem da reserva. Um pedido pendente sem pagamento expirado é cancelado no WooCommerce antes de liberar uma nova contratação para o mesmo par. Usa-se o prazo de reserva do WooCommerce, com 60 minutos como padrão quando não configurado. Solicitações interrompidas sem vínculo exigem conferência para os pares afetados.
- Revise em Kits, camisetas e valores os preços de Kit Oficial, APPAI com camiseta e APPAI somente número. O preço único anterior é copiado como base de compatibilidade quando um campo ainda não existe. Valores vazios explícitos continuam a confirmar. A API conserva priceCents como referência do menor valor disponível e expõe os três preços reais. Opções de kit da organizadora podem ser cadastradas antes de habilitar modalidades. O adicional opcional é somado quando a opção é escolhida no Kit Oficial.
- Corridas novas apresentam PP, P, M, G, GG e XGG marcados. A grade existente permanece, incluindo tamanhos antigos que a operadora ainda utiliza. Os pedidos registram tamanho, modalidade, opção de kit, preço-base, adicional e o endereço escolhido no instante da confirmação.
- Em Re Almeida Kits → Locais de retirada, cadastre e mantenha endereços reutilizáveis. A aba Retirada da corrida permite selecionar um local ou cadastrar outro sem abandonar a edição. O local é salvo na biblioteca de imediato. Salve a corrida para confirmar sua associação. Alterar o endereço central não modifica cópias de corridas nem pedidos anteriores.

Homologue com dados sintéticos em duas contas, incluindo uma solicitação nova após um pedido anterior, um CPF já usado na mesma corrida, outro CPF na mesma corrida, o mesmo CPF em outra corrida e um pendente expirado. Confira o total no checkout, o snapshot histórico, a edição de endereços e a preservação documental. Em reversão, pause novos pedidos antes de reinstalar o plugin e o frontend anteriores. Restaure a configuração anterior de preços para o código antigo interpretar corretamente o catálogo e mantenha os registros e documentos dos pedidos existentes.

### QA 1.8.0

Passaram typecheck, lint, 47 testes Node, build HostGator, verificação byte a byte do pacote frontend, sintaxe PHP e as suítes PHP de integração, CORS, rascunho, central e inscrições. O teste de inscrições verificou pagamento confirmado, pedidos cancelados e expirados, mesmo CPF em outra corrida, outro CPF na mesma corrida, preço anterior, adicional, grade e histórico de versões de endereço. O teste HTTP local com dois titulares confirmou reutilização de identificação, recusa de download cruzado, retomada e checkout WooCommerce. Nenhuma cobrança foi realizada.

Ainda requerem homologação na HostGator o bloqueio simultâneo no MySQL/MariaDB, a resposta do gateway a notificações tardias de pedidos expirados e a interação visual das telas administrativas e de nova solicitação.

## Inscrição direta e recuperação de RG/CNH (1.8.1)

Atualize juntos o plugin e o frontend HostGator. Preserve /app, o wp-config.php, os arquivos privados e as regras Apache. O frontend deixa de restaurar um rascunho enviado como inscrição editável. Quando encontra esse estado na inicialização, solicita ao servidor um novo identificador e preserva a seleção iniciada no navegador. O reset conserva o pedido e seus documentos. Acompanhamento continua em Minha conta.

A busca por CPF inclui o RG/CNH próprio já vinculado ao histórico de pedidos quando o titular ainda não cadastrou um arquivo separado em Minha conta. A busca continua restrita a participantes do rascunho autenticado. Envios para terceiros permanecem vinculados à solicitação de origem. Um documento rejeitado ou ilegível não é oferecido para reutilização. A confirmação conserva a origem e satisfaz a exigência somente enquanto a referência estiver válida. O cliente nunca recebe os dados do arquivo de outra conta.

Na homologação, parta de uma conta com pedido anterior, abra outra corrida e confira que o formulário abre direto. Tente o mesmo CPF na mesma corrida e remova só a atribuição indicada. Use um RG/CNH sintético enviado pelo próprio titular em pedido anterior, reutilize-o em outra corrida pela mesma conta e por uma segunda conta, teste novo login e confirme que o original é inacessível à segunda conta. Preserve o banco e os arquivos se precisar voltar aos pacotes 1.8.0.
