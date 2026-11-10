# Autenticação de mesma origem

O React abre a página nativa de conta do WooCommerce. Os formulários nativos processam cadastro, login, recuperação e alterações de senha. O retorno usa uma rota relativa permitida, passada aos formulários de login e cadastro. O painel nativo oferece link para a área React de participantes.

O bootstrap `/app/wp-admin/admin-ajax.php?action=rak_session` exige `X-RAK-Session: 1`, rejeita navegação de outra origem declarada pelo navegador, remove CORS e desabilita a cache. Retorna URLs das páginas configuradas e o nonce REST apenas para clientes autenticados. O nonce fica em memória. As chamadas privadas enviam `X-WP-Nonce`. O WordPress valida cookie e nonce, e o plugin aplica a permissão de cliente e o escopo do titular. O logout encerra a sessão atual do WordPress.

O cadastro nativo valida nome, CPF, nascimento e telefone com as regras existentes e reserva o CPF antes de criar a conta. Metadados de perfil e cobrança são sincronizados nos formulários atendidos. CPF já vinculado permanece protegido. Um titular legado sem CPF pode completar a identidade pelo React. Participantes continuam nas tabelas existentes, com escopo por titular, limite de 20 e verificação de versão para edição concorrente.

O navegador guarda um rascunho mínimo por aba, vinculado ao titular e com expiração de 30 minutos. Consulte a [homologação da autenticação](qa-auth-hostgator.md). O React recupera perfil e participantes após o login. O seletor dentro da solicitação permite ajustar corridas sem perder o rascunho em memória. Uma navegação completa para outra página mantém o contexto de seleção e descarta dados ainda não persistidos.

O código de servidor PKCE permanece disponível durante a transição. Após homologação, `RAK_LEGACY_PKCE=false` desativa as rotas e o CORS legados, preservando os registros históricos. Revise permissões de cadastro de outros plugins antes de habilitar canais adicionais.
