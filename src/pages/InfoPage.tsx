import { Action, PageTitle } from "../components/UI";
export default function InfoPage({ privacy = false }: { privacy?: boolean }) {
  return (
    <div className="container page narrow">
      <PageTitle
        eyebrow="INFORMAÇÕES"
        title={privacy ? "Privacidade" : "Documentos e retirada"}
      />
      <div className="panel">
        {privacy ? (
          <>
            <h2>Dados desta sessão</h2>
            <p>
              As informações preenchidas permanecem na memória do navegador e
              são apagadas ao recarregar a página. Pedidos, envio de documentos
              e pagamentos ainda não estão disponíveis.
            </p>
            <p>
              Os modelos para download são públicos. Não compartilhe documentos
              preenchidos ou assinados pela biblioteca pública de mídia.
            </p>
          </>
        ) : (
          <>
            <h2>Confira as exigências de cada corrida</h2>
            <p>
              Documentos, modalidades, modelos de autorização, horários e
              orientações são apresentados conforme o cadastro da corrida.
            </p>
            <p>
              A autorização permite a retirada física do kit pelo participante.
              O serviço não vende inscrição na prova.
            </p>
          </>
        )}
        <Action to="/corridas">Ver corridas</Action>
      </div>
    </div>
  );
}
