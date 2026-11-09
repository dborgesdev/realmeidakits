# Re Almeida Kits — desenvolvimento integrado ao WordPress

Branch: `feat/v2-preview`. Catálogo exclusivo do plugin WordPress Re Almeida Kits, sem fixtures no aplicativo e sem deploy nesta rodada.

## Desenvolvimento local

```sh
pnpm dev
```

A fonte pública padrão é definida em `src/config/catalog.ts`:

```text
https://app.realmeidakits.com.br/wp-json/re-almeida/v1
```

Não são necessários modos, flags ou arquivos .env de integração. `.env.example` contém somente a URL canônica opcional. Respostas vazias mostram catálogo vazio; erros mostram a falha e ação de tentar novamente. Não há proxy ou fallback para exemplos.

## Atualização necessária no WordPress

Instale o [ZIP 1.2.0](wordpress/releases/re-almeida-kits.zip) em **Plugins → Adicionar plugin → Enviar plugin → Substituir o atual pelo enviado**. Faça backup antes; não desinstale. O pacote inclui contas reais e CORS automático para localhost, 127.0.0.1 e [::1], portas 5173–5199, somente leitura do catálogo e sem credenciais.

Instale o plugin **1.2.0** antes de testar os endpoints novos no WordPress hospedado. Use HTTPS no WordPress e mantenha os endpoints próprios e admin-post.php acessíveis sem cache. As origens do site/Worker atual e localhost já estão autorizadas. Não são necessárias chaves administrativas, JWT secret ou cookies de terceiros. Nenhuma alteração no servidor hospedado foi realizada nesta rodada.

## Contas e participantes — Bloco C

Em **Minha conta**, crie sua conta ou entre com e-mail/senha no domínio WordPress. Cadastro e recuperação usam o WordPress; dados do titular e até 20 participantes ficam armazenados no servidor e reaparecem após sair/entrar. CPF é validado e único entre titulares, incluindo contas legadas. Participantes não recebem contas automaticamente.

No fluxo de solicitação, selecione um participante salvo ou cadastre e salve seus dados antes de continuar. Perfil permite editar nome, nascimento e telefone; CPF/e-mail de acesso exigem atendimento para alteração. Nenhum pedido ou cobrança é criado.

## Jornada atual

Dados de corridas, imagens, modalidades, distâncias, preços do serviço de retirada, documentos, modelos, condições e orientações vêm do WordPress. Formulários de responsável/participantes começam vazios, com opções independentes por pessoa/corrida. Cadastros de titular e participantes são persistidos no WordPress. Opções da solicitação ainda são rascunho em memória, sem pedido persistido.

As etapas de documentos permitem consultar exigências e baixar modelos públicos. Upload pessoal, envio de pedido, pagamento e acompanhamento ainda estão indisponíveis. Não há arquivos de exemplo, cadastro/pagamento fictício nem confirmação de operação inexistente. Condições têm uma seleção por corrida, abrangendo seus participantes; não há registro jurídico persistente nesta entrega.

## Validação

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Build estático em `dist`; Worker/Static Assets e fallback SPA preservados. Nada foi publicado. Fixtures ficam em `tests/fixtures`; `pnpm-lock.yaml` preservado e sem novas dependências.

[Operação do plugin](docs/wordpress-setup.md) · [Implementação](docs/wordpress-implementation.md) · [Instalação/homologação](docs/wordpress-deployment.md) · [QA e limites](docs/qa-block-b.md).
