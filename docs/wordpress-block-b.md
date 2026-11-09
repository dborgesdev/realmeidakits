# Bloco B — cadastro de corridas e catálogo WordPress

Implementação local de 27/10/2026, na branch `feat/v2-preview`. Esta especificação substitui os trechos históricos de `project.md` e `integration.md` que diziam que nenhuma API existia. O restante da jornada continua demonstrativo. Não houve commit, publicação, instalação na HostGator ou alteração de infraestrutura.

> Especificação histórica do Bloco B 1.0.0. A versão atual é **1.1.1 / esquema 2**, com oito abas, bibliotecas, snapshots, PDF público, duplicação e CORS de leitura local. Desde 30/10/2026, pnpm dev usa exclusivamente a API real; demo não é mais uma fonte da aplicação. Campos REST novos são aditivos. Para o contrato e operação atuais consulte [implementação](wordpress-implementation.md), [setup](wordpress-setup.md) e [QA](qa-block-b.md).

## Entrega original e limites

Plugin `wordpress/plugins/re-almeida-kits`, versão 1.0.0, esquema 1. Cadastro completo no **wp-admin → Re Almeida Kits**, com lista e inclusão/edição nativas e dez seções expansíveis. Sem ACF ou dependências PHP. Não requer WooCommerce para administrar corridas; declara compatibilidade HPOS por não acessar tabelas de pedidos. Não altera Checkout Blocks, gateway, SMTP ou cron.

Inclui modalidades independentes, distâncias ordenáveis, kits e preços, opções APPAI, tamanhos configuráveis, mídia nativa, pontos de retirada, exigências documentais, condições com histórico e comunicação. Linhas têm identificadores estáveis gerados na inclusão; botões permitem subir, descer e remover com confirmação. Não há dados semeados, preços demonstrativos importados nem eventos criados automaticamente.

O React mantém a identidade, home, hero, páginas, navegação, formulários e cenários anteriores. O catálogo é centralizado em `CatalogContext`; consultas HTTP, tipos externos, normalização e regras ficam separados. No modo WordPress, as opções reais podem ser consultadas e configuradas na jornada de demonstração, mas a conclusão de pagamento fica bloqueada. Não há autenticação, pedido real, anexos privados, análise documental, QR, voucher real ou Mercado Pago neste bloco.

## Persistência e evolução

| Armazenamento | Conteúdo |
| --- | --- |
| CPT `corrida` | Título, slug, descrição, thumbnail, status e revisões nativas |
| Meta protegida `_rak_race` | Objeto estruturado de configuração, registrado via `register_post_meta`, sem exposição no REST nativo |
| Meta protegida `_rak_condition_history` | Mapa por ID da condição e versão, com o texto exato de cada versão |
| Option `rak_schema_version` | Versão do esquema para migrações idempotentes |
| Option `rak_plugin_version` | Versão instalada |
| Capability `manage_re_almeida_kits` | Concedida apenas ao papel administrador na migração inicial |
| Transient por usuário/corrida | Tentativa inválida e mensagem, validade de 30 minutos, somente recuperação administrativa |

`Schema::sections()` define todos os campos e orienta tanto a apresentação administrativa quanto a validação autoritativa. Valores em transporte e armazenamento são **centavos inteiros**, limitados a 99.999.999; `null` significa a confirmar, e zero é permitido. O painel converte reais com vírgula/ponto e até duas casas. Kits podem ter preços próprios Pix/cartão; sem kit configurado usa-se o preço padrão da modalidade Oficial. Não há cálculo de tarifas ou estoque.

Datas/horários são opcionais; quando informados, têm validação estrita. Abertura precisa anteceder encerramento. Prazos são convertidos do fuso do WordPress para ISO 8601 com offset; recomenda-se `America/Sao_Paulo`. Antes da abertura retorna `unavailable`; na abertura, `open`; no encerramento exato, `closed`. Controle manual `closed` ou `unavailable` prevalece. O React também reavalia limites temporais ao selecionar e validar.

Configuração inválida mantém a configuração pública e o status anterior. Em um cadastro novo, mantém rascunho e impede publicação sem configuração. Nome/descrição são salvos pelo editor nativo; o aviso distingue o salvamento dos dados básicos da configuração rejeitada. A tentativa fica recuperável no mesmo usuário por 30 minutos. Há validação no navegador, foco no primeiro controle inválido, mensagens no servidor e alerta de saída com mudanças pendentes. JavaScript é necessário para editar a configuração estruturada.

Cada edição de texto de condição incrementa a versão; salvar sem alterar não incrementa. Desativar/remover uma condição não apaga seu histórico. **Revisões nativas do post não restauram automaticamente a configuração estruturada.** Em módulo futuro, o aceite deve gravar também texto/versionamento no próprio pedido, data e responsável. Não depender da configuração mutável para reconstruir aceites antigos.

Atualizações usam migrações incrementais. Sem rotina destrutiva na desativação/exclusão. Futuras alterações de esquema devem incrementar `SCHEMA_VERSION`, migrar sem apagar dados e manter compatibilidade do contrato `v1` ou criar `v2`. Não há atualizador remoto: substituir pelo ZIP no WordPress.

## Contrato REST v1

Base: `https://app.realmeidakits.com.br/wp-json/re-almeida/v1`.

| Operação | Resposta |
| --- | --- |
| `GET /corridas?page=1&per_page=20` | `{ data: Race[], page: number, totalPages: number, total: number }` |
| `GET /corridas/{slug}` | `{ data: Race }` |

Página inicia em 1, `per_page` de 1 a 100, ordenação estável por ID crescente. O cliente percorre todas as páginas e rejeita resultados duplicados/incompletos ou mudanças de paginação. Uma lista vazia é sucesso, com `data: []`, `total: 0`, `totalPages: 0`. Não filtra encerradas. Não há escrita pública; `POST` não tem rota e responde 404.

Campos públicos da corrida:

| Campo | Formato/regra |
| --- | --- |
| `id`, `slug`, `name`, `description` | Strings; descrição em texto, sem HTML executável |
| `image` | `null` ou `{url, width, height, alt}`, tamanho WordPress `large` |
| `raceDate`, `raceTime`, `location` | Data `YYYY-MM-DD`, hora `HH:mm`, texto; vazio quando ausente |
| `opensAt`, `closesAt` | ISO 8601 com offset ou string vazia |
| `status` | `open`, `closed` ou `unavailable`, calculado no servidor |
| `modalities` | Lista somente de modalidades habilitadas |
| `conditions` | Lista ativa com `{id, text, version, active: true}` |
| `guidance`, `contact`, `whatsappUrl` | Texto público e URL confirmada opcional; nunca contatos privados |

Cada modalidade possui `id` (`oficial`/`appai`), `label`, `requireRegistration`, `requireMembership`, `distances: string[]`, `pickups`, `kitTypes`, `prices`, `shirtPrices`, `numberPrices`, `shirtEnabled`, `numberEnabled`, `sizes`, `shirtImage`, `documents`.

Preços: `{pix: integer|null, card: integer|null}`. Kits: `{id, label, prices}`. Pontos: `{id, label, modality, address, at, guidance}`; não confundem endereço de retirada com local da corrida. Exigências: `{id, label, modality, scope: personal|race, required: boolean, guidance}`. Imagem de camiseta tem o mesmo formato da imagem da corrida. A normalização mantém somente os dados do domínio, filtra exigências opcionais na validação obrigatória e preserva distâncias/locais/preços por modalidade. A imagem da camiseta aparece ao escolher camiseta.

Erros seguem o formato WordPress `{code, message, data: {status, ...}}`: parâmetro inválido 400, corrida não publicada/inexistente/protegida por senha 404, acesso à rota core do CPT sem capacidade 403. Configuração legada/corrompida publicada aparece com `configurationError: true` e `status: unavailable`; o cliente a trata explicitamente como dados inválidos e não oferece fixtures substitutas. Respostas de sucesso são `Cache-Control: no-store`; o cache da hospedagem deve respeitar isso para não congelar disponibilidade. O painel não expõe o histórico ou metadados internos no contrato.

Fixture de contrato em `tests/fixtures/wordpress-race.json` foi obtida da projeção real do plugin no teste local. Identifica somente DEMONSTRAÇÃO e não é importada no ambiente real.

## Segurança, permissões e CORS

Operações nativas usam capacidades do CPT; salvamento adicional exige capacidade própria, nonce por corrida e ignora autosaves/revisões. Dados são sanitizados, datas, modalidades, tamanhos, imagens e integridade das listas são validados. Imagens devem ser anexos reais de imagem da biblioteca. URLs de comunicação exigem HTTPS e hosts WhatsApp conhecidos. Não há consultas SQL manuais.

O REST nativo `/wp/v2/corrida` permanece disponível a administradores autenticados para ferramentas WordPress e é vedado a visitantes. A API própria expõe somente uma projeção pública de corridas publicadas e sem senha, inclusive quando a requisição vem de administrador. Rascunhos e privadas recebem 404 no detalhe.

CORS nos endpoints próprios remove os cabeçalhos permissivos padrão do WordPress, não permite credenciais e autoriza somente `https://realmeidakits.com.br` para `GET, OPTIONS`. Não é mecanismo de autenticação: o catálogo é público mesmo fora de navegadores. A origem da prévia não é liberada por padrão. Para homologar a integração, adicionar **explicitamente** uma origem confirmada via filtro em configuração local/mu-plugin:

```php
add_filter('rak_public_origins', static function ($origins) {
    $origins[] = 'https://realmeidakits.smartlocal.workers.dev';
    return $origins;
});
```

Não usar `*`, refletir origens arbitrárias ou liberar credenciais. O React consulta com `credentials: omit`; não carrega tokens, cookies administrativos ou senhas.

## Seleção da fonte React

O padrão é `VITE_DATA_SOURCE=demo`, inclusive quando a variável está ausente. `.env.example` documenta:

```dotenv
VITE_DATA_SOURCE=demo
VITE_WORDPRESS_API_URL=https://app.realmeidakits.com.br/wp-json/re-almeida/v1
```

Somente após instalar e validar o plugin e CORS em homologação, selecionar `wordpress` e reconstruir o frontend. Variáveis Vite são públicas e de build; nunca colocar segredos nelas. URL da API exige HTTPS e não admite usuário/senha, query ou fragmento. A única exceção a HTTPS é HTTP de loopback (`localhost`, `127.0.0.1`, `[::1]`) para testes locais. Valor de fonte desconhecido é erro de configuração, sem trocar silenciosamente para demo.

Carregamento, vazio, falha de conexão, configuração inválida e dados incompletos têm estados explícitos. Há timeout de 12 segundos por consulta, cancelamento e opção de tentar novamente. Erro não habilita seleção nem mistura fixtures. Corridas sem imagem mostram uma mensagem discreta dentro da composição existente. Encerradas seguem com detalhes e seleção bloqueada. Estado da solicitação continua somente em memória; atualizar apaga o rascunho. No modo WordPress não é possível concluir pagamento ou gerar voucher de evento real.

## Instalar, atualizar e reverter

1. Confirmar backup restaurável do banco e diretório do plugin, HTTPS e ambiente de homologação.
2. Gerar o pacote com `pnpm plugin:zip` (PowerShell). O script inclui apenas bootstrap, `includes/*.php`, `assets/*.js`, `assets/*.css` e `readme.txt`, sob uma única raiz `re-almeida-kits/`. Gera checksum SHA-256.
3. No WordPress, **Plugins → Adicionar plugin → Enviar plugin**. Selecionar `wordpress/releases/re-almeida-kits.zip`.
4. Instalar e ativar. Em atualização, selecionar **Substituir o atual pelo enviado**; manter o mesmo diretório. A versão aparece na tela de plugins.
5. Confirmar menu **Re Almeida Kits** e acesso para o administrador autorizado. Outros papéis não recebem acesso automaticamente.
6. Cadastrar corrida de teste identificada como **DEMONSTRAÇÃO** em homologação; configurar modalidade e distância, opções realmente disponíveis, deixar valores em branco até confirmação. Salvar, reabrir e conferir todos os campos. Publicar apenas o teste permitido no ambiente de homologação.
7. Consultar a listagem e detalhe REST. Conferir rascunho/privada/senha excluídos; alterar prazos e testar limites. Conferir separação por modalidade e imagens reais.
8. Validar CORS, ligar somente o build de homologação React em `wordpress` e testar estados. A prévia pública permanece em `demo` até aprovação de mudança.
9. Para reverter, reenviar ZIP anterior compatível e restaurar backup se houver migração incompatível. A versão 1 somente adiciona capability/opções e metadados; desativar remove o comportamento do plugin, preservando os dados. Não apagar manualmente tabelas/metadados.

O script empacota a árvore local; não instala, publica, faz push ou deploy.

## Arquitetura das próximas etapas

Manter corridas no CPT. Avaliar tabelas relacionais para participantes, vínculos responsável/participante, inscrições para retirada, documentos privados, aceites e auditoria. Usar chaves estáveis e restrição única pedido/participante/corrida; limite inicial 20 configurável. CPF obrigatório brasileiro e individual, nunca credencial; sem identificação alternativa ou equipe nesta versão.

Responsável autenticado via WordPress/WooCommerce, checkout e Minha Conta em `app.realmeidakits.com.br` são a primeira opção. Não presumir cookies entre subdomínios. Antes de criar endpoints de escrita, definir sessão, CSRF, origem, autorização por entidade e proteção contra acesso a pedido/documento alheio. Uma alternativa posterior é BFF na mesma origem pública com credenciais servidor a servidor e sessão segura; não colocar tokens administrativos no navegador. Essa alternativa não é requisito do build estático atual.

Usar APIs CRUD do WooCommerce para pedidos HPOS e compatibilidade Checkout Blocks. Valores finais devem ser recalculados no servidor, com snapshot das opções/condições. Pagamento confirmado por evento autoritativo do WooCommerce poderá liberar voucher individual, condicionado também à revisão dos documentos. Planejar QR validado no servidor, operação atômica contra retirada duplicada e auditoria. Não emitir voucher nem simular pagamento real antes dessas etapas.

Documentos precisam de armazenamento privado, autorização de download, política de retenção e descarte, auditoria, backups protegidos e revisão LGPD. Não usar mídia pública WordPress para documentos pessoais. Conferência permanece manual; sem consulta de CPF, reconhecimento ou validação automática de assinatura. Gateway Mercado Pago e mensagens automáticas continuam fora do bloco.

## Infraestrutura ainda a homologar

Não foram acessados wp-admin/servidor da cliente nem usados seus dados de acesso. Permanecem pendentes: versão real WordPress/WooCommerce/banco, PHP e extensões na HostGator, backups/restauração, certificado HTTPS, REST/rewrites, permissões, cache, cron/Action Scheduler, SMTP, HPOS/Checkout Blocks com os plugins instalados. Não mudar configurações já adequadas sem evidência de necessidade. Resultados locais e limites estão em `docs/qa-block-b.md`.

Referências oficiais: [metadados WordPress](https://developer.wordpress.org/reference/functions/register_meta/), [rotas REST](https://developer.wordpress.org/reference/functions/register_rest_route/), [compatibilidade HPOS](https://developer.woocommerce.com/docs/features/orders/high-performance-order-storage/recipe-book/).

## Fechamento da entrega — 28/10/2026

A implementação descrita acima foi preservada. A retomada final concluiu documentação e verificações, sem alterações funcionais. Consulte [setup](wordpress-setup.md), [implementação](wordpress-implementation.md), [implantação](wordpress-deployment.md) e [QA final](qa-block-b.md) para os resultados efetivos e limites da homologação. O ZIP original corresponde aos fontes e não foi regenerado.
