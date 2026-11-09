import { Link } from "react-router-dom";
import { useAccount } from "../../state/AccountContext";
export default function ResponsibleStep() {
  const { profile } = useAccount();
  return (
    <>
      <h1>Quem será responsável pelo pedido?</h1>
      <p>A conta autenticada identifica o titular desta solicitação.</p>
      <fieldset className="form-section">
        <legend>Dados do titular</legend>
        <label>
          Nome completo
          <input value={profile?.name ?? ""} readOnly />
        </label>
        <label>
          E-mail
          <input value={profile?.email ?? ""} readOnly />
        </label>
        <label>
          Telefone
          <input value={profile?.phone ?? ""} readOnly />
        </label>
        <label>
          CPF
          <input value={profile?.cpf ?? ""} readOnly />
        </label>
        <Link
          className="button secondary"
          to="/conta?continuar=%2Fsolicitacao%2Fresponsavel"
        >
          Editar meus dados
        </Link>
      </fieldset>
    </>
  );
}
