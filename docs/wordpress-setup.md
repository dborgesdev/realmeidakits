# Instalação e operação inicial — Re Almeida Kits

Revisão: 05/11/2026. Plugin **1.2.0**, esquema **3**. Pronto para homologação; nenhuma instalação em produção realizada.

## Instalar ou atualizar pelo wp-admin

1. Prepare homologação e backup restaurável do banco, plugins e uploads. Requer WordPress >= 6.7, PHP >= 8.3 e Fileinfo para PDFs.
2. Como administrador, abra **Plugins → Adicionar plugin → Enviar plugin**.
3. Selecione `wordpress/releases/re-almeida-kits.zip` e **Instalar agora**. Na atualização, escolha **Substituir o atual pelo enviado**, mantendo a pasta `re-almeida-kits`. Não desinstale.
4. Ative e confira versão **1.2.0**, menu **Re Almeida Kits** e bibliotecas de documentos e condições. WooCommerce não é obrigatório para o catálogo.
5. Reabra uma corrida existente e confira dados/API. Migração automática e incremental preserva IDs e versões anteriores. Em bases maiores, ocorre em lotes de 25 nas próximas requisições. [Detalhes e reversão](wordpress-deployment.md).

## Contas e participantes — Bloco C

1. Instale o ZIP **1.2.0** sem desinstalar o plugin anterior. A migração 3 cria tabelas próprias para identificação, participantes e sessões, preservando corridas/bibliotecas. WooCommerce deve disponibilizar a função customer; o catálogo continua independente.
2. Abra **Minha conta → Criar minha conta**. O cadastro e a senha são preenchidos no domínio WordPress. Informe nome, CPF, nascimento, telefone com DDD, e-mail e senha de 12–128 caracteres. CPF com dígitos inválidos ou já vinculado a outra conta é recusado, inclusive quando está formatado nos metadados legados.
3. Clientes existentes entram por e-mail/senha; dados incompletos são solicitados antes de liberar acesso. Não são criadas contas duplicadas nem unidas contas automaticamente. Conflitos legados exigem correção administrativa autorizada.
4. Em **Minha conta**, edite nome, nascimento e telefone. CPF/e-mail de acesso ficam protegidos; alterações desses identificadores exigem atendimento. A recuperação usa **Esqueci minha senha**, formulário e link de redefinição nativos WordPress, enviados por wp_mail/GoSMTP/Brevo configurados.
5. Cadastre até 20 participantes distintos, com CPF próprio por registro. Eles ficam privados ao titular e podem ser selecionados nas solicitações futuras; cadastrar participante não cria login para ele. Edições concorrentes antigas recebem conflito e exigem recarregar o cadastro.
6. Na etapa de participantes, selecione cadastro existente ou preencha e use **Salvar cadastro do participante**. Não é possível avançar com alterações cadastrais ainda não gravadas. Campos de modalidade, distância, retirada e inscrição pertencem à combinação participante/corrida; o pedido/checkout ainda não é enviado.
7. **Sair da conta** revoga o acesso e encerra a sessão WordPress no retorno. Entrar novamente recupera perfil/participantes do servidor. Recarregar restaura acesso pela sessão nativa WordPress quando válida; nenhum bearer, CPF ou perfil fica em localStorage/sessionStorage. SessionStorage guarda somente PKCE transitório, indicação de sessão e IDs de corridas selecionadas para atravessar o retorno de login.

## Cadastrar e reutilizar documentos

1. Abra **Re Almeida Kits → Biblioteca de documentos → Adicionar**. Informe nome, finalidade, instruções, se exige envio e estado ativo. Identificador estável é gerado pelo plugin.
2. Para autorização, escolha/envie um **PDF público em branco** na mídia nativa e confirme explicitamente que não contém dados pessoais. Limite do plugin: 5 MB; servidor pode impor limite menor. Não use autorizações assinadas na mídia pública.
3. Salve e reabra. Confira versão e modelo. O PDF pode ser baixado pela URL pública validada. URLs externas arbitrárias não são aceitas.
4. Na corrida, aba **Documentos**, selecione o item e use **Associar item selecionado**. Ajuste obrigatoriedade, modalidade, escopo pessoal/por corrida e instruções específicas. Repita em outra corrida.
5. Exigências específicas também podem ser criadas na corrida e salvas na biblioteca pela ação da linha. Modelos novos exigem confirmação de publicação na biblioteca.

Remover a associação afeta somente aquela corrida. Editar/desativar a biblioteca cria versão e preserva snapshots antigos. Para aplicar versão nova, remova/reassocie explicitamente e confira as instruções antes de salvar. Desvincular permite edição local independente. PDFs aprovados têm exclusão permanente protegida para conservar downloads históricos; substituir usa outro anexo. Desativar não revoga PDFs públicos já associados.

## Cadastrar e reutilizar condições

Em **Biblioteca de condições**, informe nome, texto validado e estado ativo. Salve e associe pela aba **Condições**; também é possível salvar uma condição da corrida na biblioteca. Histórico registra versões. Editar biblioteca não reescreve corridas existentes: reassocie para adotar nova versão. Use somente textos jurídicos aprovados.

React pede cada condição **uma vez por corrida no pedido**, abrangendo todos os participantes vinculados. Corridas diferentes mantêm aceites próprios. A seleção de condições permanece no rascunho: ainda não existe envio de pedido ou registro jurídico persistente.

## Primeira corrida

1. **Re Almeida Kits → Adicionar corrida**; use nome DEMONSTRAÇÃO em homologação.
2. **Informações gerais:** nome, descrição, slug, imagem opcional, data/horário e local confirmados. Confira fuso WordPress.
3. **Inscrições:** disponibilidade e prazos opcionais; encerramento posterior à abertura.
4. **Modalidades e distâncias:** habilite Oficial/APPAI, exigências correspondentes e ao menos uma distância por modalidade habilitada.
5. **Kits, camisetas e valores:** opções, grade quando há camiseta, foto autorizada e preços do **serviço de retirada**. Vazio significa a confirmar; não copie valores fictícios.
6. **Retirada:** pontos e orientações separados do local da prova.
7. **Documentos** e **Condições:** associe bibliotecas ou crie itens específicos e confira versões.
8. **Comunicação:** orientações e grupo WhatsApp confirmado, quando existir.
9. Salve rascunho e reabra. Alterne abas; erros abrem a aba pertinente e focalizam o campo. Publique somente dados autorizados. Salvar título não comprova que uma configuração rejeitada foi salva.

Na lista, **Duplicar como rascunho** reaproveita configurações recorrentes. Nome, datas/prazos, imagem, local, valores e WhatsApp precisam de revisão; cópia nasce indisponível e sem preços. Preencha, confirme revisão e só então publique.

## Conferir API e download

Consulte na origem de homologação:

```text
https://ORIGEM/wp-json/re-almeida/v1/corridas
https://ORIGEM/wp-json/re-almeida/v1/corridas/SLUG
```

Lista: `{data,page,totalPages,total}`; detalhe: `{data}`. Rascunhos, privadas e senha não aparecem. Encerradas permanecem consultáveis, sem seleção. Confira documentos, instruções, `requiresUpload`, `purpose`, `version`, `template` e condições/versionamento. Modelo ausente não deve produzir botão de download. URL emitida usa `/wp-admin/admin-post.php?action=rak_public_model&attachment=ID`; abra sem login e confira PDF/download. Não há escrita pública, anexos pessoais nem histórico administrativo na API.

## Desenvolvimento React

Execute somente **pnpm dev**. O catálogo usa diretamente https://app.realmeidakits.com.br/wp-json/re-almeida/v1, definido em src/config/catalog.ts. Não configure fonte demo, modos WordPress ou arquivos .env de teste. As configurações antigas locais foram retiradas do caminho de execução; dados de exemplo permanecem apenas nos testes.

Atualize o plugin para **1.2.0**: a leitura pública permite automaticamente HTTP/HTTPS em localhost, 127.0.0.1 e [::1], portas 5173–5199. Não exige filtro PHP a cada execução. Sem wildcard, credenciais ou permissões de escrita/administração. Nenhum proxy adicionado.

A homologação hospedada do Bloco C exige atualizar este ZIP e conferir login/cadastro/redefinição com os e-mails reais de homologação autorizados. O GoSMTP/Brevo existente é reutilizado. [Resultados locais e limites](qa-block-b.md).

Após atualizar, confira catálogo/detalhe, imagens, preços, modalidades e documentos/condições contra o cadastro. Dados cadastrais vêm da conta e do diretório persistido no WordPress. Opções da solicitação continuam em memória. Envio de arquivo, pedido e pagamento continuam indisponíveis; não há marcadores fictícios nem confirmação de operação inexistente. Modelos públicos em branco têm download funcional.

Worker e versão publicada preservados; sem commit, push, merge ou deploy. Build desta branch representa a integração nova e não deve ser publicado sem autorização.
