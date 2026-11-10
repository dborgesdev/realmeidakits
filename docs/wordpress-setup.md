# Instalação e operação inicial — Re Almeida Kits

O plugin 1.3.1 mantém o esquema 3. Confira [pré-requisitos, atualização e reversão](wordpress-deployment.md) antes de instalar. Use a atualização nativa pelo ZIP, preservando o plugin e os dados existentes. Depois de atualizar, confira o menu Re Almeida Kits e reabra uma corrida já cadastrada.

## Contas e participantes

1. Em Minha conta no WooCommerce, habilite o formulário nativo de cadastro. Ele solicita nome, CPF, nascimento, telefone e e-mail. O WooCommerce trata senhas e recuperação.
2. Clientes existentes usam o mesmo cadastro. CPF vinculado é protegido. Conflitos de identidade legados exigem revisão autorizada.
3. O titular administra até 20 participantes pela área React. Cadastros são privados e não criam login para o participante. Na solicitação, selecione um cadastro existente ou grave um novo antes de continuar.
4. Use **Editar acesso e senha** para os dados nativos. Consulte a [autenticação](wordpress-authentication.md) para detalhes de sessão e sincronização.

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
https://ORIGEM/app/wp-json/re-almeida/v1/corridas
https://ORIGEM/app/wp-json/re-almeida/v1/corridas/SLUG
```

Lista: `{data,page,totalPages,total}`; detalhe: `{data}`. Rascunhos, privadas e senha não aparecem. Encerradas permanecem consultáveis, sem seleção. Confira documentos, instruções, `requiresUpload`, `purpose`, `version`, `template` e condições/versionamento. Modelo ausente não deve produzir botão de download. URL emitida usa `/app/wp-admin/admin-post.php?action=rak_public_model&attachment=ID`; abra sem login e confira PDF/download. Não há escrita pública, anexos pessoais nem histórico administrativo na API.

## Conferir frontend

Use a [réplica de mesma origem](wordpress-deployment.md#desenvolvimento-e-homologação). Compare catálogo e detalhe HTML com o cadastro, incluindo imagens, valores do serviço, modalidades, modelos e condições. Verifique a atualização após salvar no WordPress e a navegação sem JavaScript. As solicitações continuam como rascunho, com opções em memória.
