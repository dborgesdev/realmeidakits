=== Re Almeida Kits ===
Requires at least: 6.7
Requires PHP: 8.3
Stable tag: 1.2.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Cadastro de corridas no wp-admin e API pública de leitura.
Não cria pedidos, pagamentos, documentos pessoais nem vouchers operacionais.

== Instalação ==
1. Plugins > Adicionar plugin > Enviar plugin.
2. Selecione re-almeida-kits.zip, instale e ative.
3. Abra Re Almeida Kits > Adicionar corrida.
4. Configure ao menos uma modalidade e uma distância correspondente.
5. Publique e confira /wp-json/re-almeida/v1/corridas.

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
