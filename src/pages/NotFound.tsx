import { Action, PageTitle } from "../components/UI";
export default function NotFound() {
  return (
    <div className="container page">
      <PageTitle
        eyebrow="404 · CAMINHO NÃO ENCONTRADO"
        title="Vamos voltar para a pista?"
      >
        A página procurada não está disponível.
      </PageTitle>
      <Action to="/">Voltar ao início</Action>
    </div>
  );
}
