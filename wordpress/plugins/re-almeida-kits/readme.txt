=== Re Almeida Kits ===
Requires at least: 6.7
Requires PHP: 8.3
Stable tag: 1.8.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Cadastro de corridas no wp-admin, páginas públicas, API e integração com contas WooCommerce.
Inclui rascunhos, documentos privados e integração opcional de pedidos com o checkout WooCommerce.

== Instalação ==
1. Plugins > Adicionar plugin > Enviar plugin.
2. Selecione re-almeida-kits.zip, instale e ative.
3. Abra Re Almeida Kits > Adicionar corrida.
4. Configure ao menos uma modalidade e uma distância correspondente.
5. Publique e confira /corridas e /app/wp-json/re-almeida/v1/corridas na arquitetura HostGator.
6. Configure Minha conta no WooCommerce para cadastro, login e recuperação de senha.

== Atualização ==
Faça backup do banco e do plugin antes de atualizar.
Envie um novo ZIP pela mesma tela e escolha substituir o plugin instalado.
O diretório re-almeida-kits deve ser mantido.
Migrações incrementais preservam configurações e corridas.
Desativação e exclusão do plugin não apagam os dados cadastrados.
Não há atualização automática por servidor externo.

== Administração ==
Somente administradores recebem a permissão manage_re_almeida_kits.
O formulário exige JavaScript e usa a biblioteca de mídia do WordPress.
Preços vazios significam a confirmar. Valores são armazenados em centavos.
Prazos usam o fuso configurado no WordPress.
Não cadastre documentos pessoais: somente exigências públicas.
Textos das condições possuem histórico privado e versão incremental.

== Changelog ==

= 1.8.1 =
Nova inscrição direta e reutilização de identificação do histórico do próprio titular.

= 1.8.0 =
Novas solicitações, preços por modalidade e biblioteca de locais de retirada.

= 1.7.0 =
Biblioteca documental, identificação reutilizável e correção de anexos por solicitação.

= 1.6.0 =
Central operacional por participante, análise de documentos e exportação XLSX.

= 1.5.1 =
Diagnóstico do checkout WooCommerce e retomada de pedidos existentes.

= 1.5.0 =
Armazenamento protegido em wp-content com habilitação explícita após prova HTTP.

= 1.4.4 =
Compara o acesso à pasta privada com uma prova descartável em wp-content.

= 1.4.3 =
Detalha o diagnóstico administrativo do armazenamento privado.

= 1.4.2 =
Valida o diretório privado existente mesmo quando open_basedir restringe o pai.

= 1.4.1 =
Diagnóstico do armazenamento privado, criação segura do diretório e validação de uploads.

= 1.4.0 =
Rascunho privado por titular com controle de versão.

= 1.3.1 =
Acesso nativo à conta no modo Em breve, retorno seguro e cache privado.

= 1.3.0 =
Catálogo e detalhes em PHP, sitemap dinâmico e controles React com assets do manifesto Vite.
Contas WooCommerce com cookies nativos e nonce REST. Esquema 3 e registros existentes preservados.
Após a homologação da sessão nativa, RAK_LEGACY_PKCE=false desativa as rotas e o CORS de transição.

= 1.2.0 =
Contas customer, CPF único, autenticação por código PKCE de uso único, sessões revogáveis e participantes privados por titular.
Migração 3 cria tabelas próprias sem modificar corridas, condições ou pedidos WooCommerce.
Login e recuperação usam autenticação e e-mail nativos WordPress; nenhum segredo administrativo no React.

= 1.1.1 =
* CORS de leitura do catálogo permite Vite local em loopback, portas 5173–5199, sem credenciais.
* Sem alterações na persistência ou no esquema 2.
= 1.1.0 =
Oito abas acessíveis, bibliotecas versionadas de documentos/condições, modelos PDF públicos e duplicação segura como rascunho.
Migração incremental preserva corridas e associa exigências legadas sem alterar textos/versões anteriores.
Modelos públicos aprovados são mantidos na mídia para preservar referências históricas.

= 1.0.0 =
Cadastro completo de corridas, validação, condições versionadas e API de consulta.
