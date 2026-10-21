import { Action, PageTitle } from "../components/UI";
export default function InfoPage({ privacy = false }: { privacy?: boolean }) {
  return (
    <div className="container page narrow">
      <PageTitle
        eyebrow="INFORMAÇÕES DA PRÉVIA"
        title={
          privacy ? "Privacidade nesta demonstração" : "Documentos e retirada"
        }
      />
      <div className="panel">
        {privacy ? (
          <>
            <h2>Experimente com dados fictícios</h2>
            <p>
              Não informe CPF, senha, cartão ou documentos reais. A prévia não
              cria contas, não envia e-mails e não realiza pagamentos.
            </p>
            <p>
              As informações do formulário permanecem apenas na memória desta
              sessão. Recarregar a página apaga esses dados. Os arquivos
              selecionados não são lidos, enviados ou armazenados; só há
              indicação temporária da seleção.
            </p>
            <p>
              Este texto explica o comportamento do protótipo. A política de
              privacidade definitiva será elaborada e validada antes da operação
              real.
            </p>
          </>
        ) : (
          <>
            <h2>Cada corrida pode ter exigências diferentes</h2>
            <p>
              Cada corrida e modalidade define os documentos do exemplo. A
              identificação pessoal pode ser reutilizada; comprovantes e
              autorizações permanecem específicos da prova. Quando necessário,
              uma autorização específica também será solicitada.
            </p>
            <p>
              A autorização permite à Re Almeida retirar fisicamente o kit da
              participante. Não dá acesso ao gerenciamento de contas de outras
              pessoas.
            </p>
            <h3>Antes da versão funcional</h3>
            <p>
              Modelos definitivos, documentos exatos, locais, horários, preços e
              grupos serão confirmados por evento. Esta prévia não disponibiliza
              autorização jurídica pronta nem garante entrega.
            </p>
            <p>
              Escolha um evento demonstrativo para conhecer as etapas usando
              apenas os documentos fictícios fornecidos pela interface.
            </p>
          </>
        )}
        <Action to="/corridas">Explorar corridas de exemplo</Action>
      </div>
    </div>
  );
}
