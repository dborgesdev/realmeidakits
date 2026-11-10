# Homologação da autenticação na HostGator

## Diagnóstico

- **Cadastro em branco.** A consulta anônima à página Minha conta em produção retornou HTTP 200 com o template WooCommerce “Em breve”, sem formulário de login, cadastro ou campos do plugin. O cabeçalho observado foi Cache-Control max-age=60. O plugin 1.3.1 exclui apenas Minha conta do template “Em breve” e mantém os formulários nativos e a configuração de cadastro do WooCommerce.
- **Login sem retorno.** A implementação anterior dependia do campo oculto emitido no template de conta. Esse campo não existia na resposta pública observada. Também não havia redirecionamento para quem já chegava ao WooCommerce com uma sessão válida. A integração passou a validar a rota relativa no servidor, usar os filtros nativos de retorno e redirecionar clientes já autenticados no acesso normal à página de conta. Depois de recuperação ou definição de senha, o link do painel para o React permite retomar o destino registrado na aba.
- **Sessão confundida com visitante.** O React verificava a sessão inicialmente, mas o fluxo enviava ao login também quando a verificação falhava. Um nonce rejeitado limpava a sessão React sem tentar obtê-lo novamente. O bootstrap também respondia com nonce nulo para qualquer usuário WordPress fora do perfil cliente. A correção separa esses casos, verifica o cookie novamente após 401 ou nonce inválido e evita repetir automaticamente uma escrita. Um 403 genérico continua sendo uma recusa. A causa específica para a sessão autenticada relatada em produção depende de reproduzir com um titular autorizado e conferir papel, cookie e rede.

## Cache e rascunho

O bootstrap anônimo retornou private, no-store e Cloudflare DYNAMIC. Os endpoints privados consultados como visitante retornaram 401 com no-store, private e Cloudflare DYNAMIC. O checkout e a recuperação estavam com private, no-cache, max-age=0. A evidência anônima não comprova o comportamento com cookies nem as regras internas do provedor. O plugin aplica no-store também às páginas nativas de conta, carrinho e checkout, mantendo a política do catálogo e dos assets.

O rascunho temporário é por aba e expira após 30 minutos. Guarda IDs públicos de corridas, modalidade inicial, quantidade e progresso da preparação, com uma chave de titular para impedir reuso por outra conta. Logout explícito limpa o rascunho. Seleções abertas no formato da versão anterior não são importadas na atualização. Dados pessoais, referências de participantes, matrículas, opções individuais, documentos e aceites ficam em memória. Participantes já cadastrados são carregados novamente do WordPress. Uma nova aba independente inicia outra seleção. Abas duplicadas podem receber uma cópia da seleção, que permanece sujeita à verificação do titular.

## Atualização e verificação manual

1. Faça backup do plugin instalado, do document root e das regras Apache. Instale o ZIP do plugin 1.3.1 por substituição, preservando o diretório, o banco e o esquema 3. Na página Minha conta, confirme o shortcode ou template nativo, o formulário e a opção de criação de contas do WooCommerce. Mantenha a política atual de visibilidade do restante da loja e o PKCE de transição.
2. Transfira primeiro os assets versionados do novo frontend. Atualize o HTML, o manifesto, o robots e as regras da raiz após conferir a configuração existente. Preserve app/ e seus arquivos. Use o [procedimento de implantação e reversão](wordpress-deployment.md).
3. Na HostGator e no Cloudflare, confira bypass de cache para Minha conta e seus endpoints, carrinho, checkout, bootstrap e REST privada. Confira respostas de dois titulares com e sem cookie. Verifique o cookie WordPress no mesmo domínio HTTPS e caminho que cubra tanto /app/wp-admin/admin-ajax.php quanto /app/wp-json/. Confirme que X-RAK-Session e X-WP-Nonce chegam ao servidor. Limpe apenas entradas antigas de cache privado, se existirem.
4. Com dois titulares autorizados e dados sintéticos, valide login a partir de uma solicitação, sessão já ativa, cadastro, expiração, logout, alternância de abas, recarga e isolamento. Teste cadastro e edição de participante, limite de 20, bloqueio de CPF duplicado e tentativas de acesso por ID de outro titular. Confira console, rede e logs PHP em desktop e mobile, com teclado.
5. Use uma caixa de homologação controlada. Crie uma conta com os avisos nativos habilitados, solicite recuperação, verifique assunto, remetente e domínio dos links, abra o link, redefina a senha e entre novamente. Confira os logs do plugin de e-mail e do provedor para entrega, rejeições ou filas. Não envie a clientes reais nem exponha chaves ou URLs de recuperação nos registros de QA.

## Testes executados

- Typecheck, lint, 45 testes Node, build padrão e build HostGator.
- Sintaxe PHP 8.3.36 e suítes locais com 34 verificações de CORS, 47 de integração, 36 de refinamento e 48 de contas.
- WordPress 6.7.10 e WooCommerce 9.9.5 em loopback com “Em breve” ativado. Formulários nativos, no-store na conta, retorno após cadastro/login e com sessão já ativa, rejeição de destino externo, CPF duplicado, nonce inválido, persistência e isolamento de participantes, logout, edição nativa e redefinição com e-mail interceptado.
- Chrome headless local em 320 e 1440 px. Cadastro sintético, retorno autenticado à solicitação, dados do titular, seleção múltipla, teclado e ausência de erros JavaScript no percurso.
- Produção consultada somente com GETs anônimos. O fluxo autenticado, o cache com cookies, o envio real de e-mail, a configuração administrativa e os logs hospedados dependem do roteiro manual.

## Arquivos desta correção

- React em src/state/AccountContext.tsx, src/state/RequestContext.tsx, src/state/draftStorage.ts, src/data/accountClient.ts e src/pages/{AccountPage,RequestPage}.tsx.
- WordPress em includes/NativeSession.php, includes/WooCommerce.php, re-almeida-kits.php e readme.txt, dentro de wordpress/plugins/re-almeida-kits. Pacote e checksum em wordpress/releases.
- Regressão de armazenamento em tests/draft-storage.test.mjs.
