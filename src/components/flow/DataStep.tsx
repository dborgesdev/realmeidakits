import type { Race } from "../../data/events";
import { useDemo } from "../../state/DemoContext";
export default function DataStep({ event }: { event: Race }) {
  const { draft, setDraft } = useDemo();
  const update = (values: Partial<typeof draft>) =>
    setDraft({ ...draft, ...values, confirmed: false });
  return (
    <>
      <h1>Confira os dados da participante</h1>
      <p>
        DEMONSTRAÇÃO · Use somente informações fictícias. Os dados ficam apenas
        na memória desta página.
      </p>
      <fieldset className="form-section">
        <legend>Dados individuais</legend>
        <label>
          Nome de demonstração
          <input
            required
            minLength={3}
            maxLength={80}
            autoComplete="off"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            Identificador de CPF
            <input readOnly value="DEMO-CPF" aria-describedby="cpf-help" />
          </label>
          <label>
            E-mail do perfil fictício
            <input readOnly value="participante@example.invalid" />
          </label>
        </div>
        <p className="field-help" id="cpf-help">
          Identificador ilustrativo, sem validação de CPF. Não informe dados
          pessoais reais.
        </p>
        <div className="form-grid">
          {event.birthDateRequired && (
            <label>
              Nascimento de exemplo
              <input
                type="date"
                required
                min="1900-01-01"
                max={new Date().toISOString().slice(0, 10)}
                value={draft.birthDate}
                onChange={(e) => update({ birthDate: e.target.value })}
              />
            </label>
          )}
          {event.phoneRequired && (
            <label>
              Identificador de telefone
              <input readOnly value={draft.phone} />
            </label>
          )}
        </div>
        <p className="field-help">
          Nascimento e telefone aparecem conforme a configuração ilustrativa da
          corrida. Os requisitos reais ainda serão validados.
        </p>
      </fieldset>
      {draft.modality === "oficial" ? (
        <fieldset className="form-section">
          <legend>Kit oficial</legend>
          <p>
            Este caminho é para quem já possui inscrição na corrida. Na próxima
            etapa, confira os comprovantes exigidos neste exemplo. Não há venda
            de inscrição ou de kit.
          </p>
        </fieldset>
      ) : (
        <fieldset className="form-section">
          <legend>Dados APPAI</legend>
          <label>
            Matrícula demonstrativa
            <input
              required
              pattern="DEMO-[0-9]{3,6}"
              title="Use DEMO- seguido de 3 a 6 dígitos"
              aria-describedby="membership-help"
              value={draft.membership}
              onChange={(e) => update({ membership: e.target.value })}
            />
          </label>
          <p className="field-help" id="membership-help">
            Use DEMO-101 ou outro identificador DEMO- seguido de 3 a 6 dígitos.
          </p>
          <fieldset>
            <legend>O que deseja solicitar?</legend>
            <label className="radio">
              <input
                type="radio"
                name="kit"
                checked={draft.kit === "camiseta"}
                onChange={() => update({ kit: "camiseta" })}
              />
              Camiseta com número de peito
            </label>
            <label className="radio">
              <input
                type="radio"
                name="kit"
                checked={draft.kit === "numero"}
                onChange={() => update({ kit: "numero" })}
              />
              Somente número de peito
            </label>
          </fieldset>
          {draft.kit === "camiseta" && (
            <label>
              Tamanho da camiseta
              <select
                required
                value={draft.size}
                onChange={(e) => update({ size: e.target.value })}
              >
                <option value="">Selecione um tamanho</option>
                {["PP", "P", "M", "G", "GG"].map((size) => (
                  <option key={size}>{size}</option>
                ))}
              </select>
              <span className="field-help">
                Grade ilustrativa; disponibilidade a confirmar.
              </span>
            </label>
          )}
        </fieldset>
      )}
    </>
  );
}
