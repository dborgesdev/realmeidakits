import { useEffect, useState } from "react";
import { useAccount } from "../../state/AccountContext";

type IdentityStatus = {
  registered: boolean;
  status: "received" | "rejected" | null;
  maxBytes: number;
};

export default function PersonalIdentity() {
  const { request } = useAccount();
  const [identity, setIdentity] = useState<IdentityStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    request<IdentityStatus>("/account/identity-document")
      .then((result) => {
        if (active) setIdentity(result);
      })
      .catch((cause: Error) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [request]);

  async function upload(file: File) {
    setError("");
    if (
      !identity ||
      file.size < 1 ||
      file.size > identity.maxBytes ||
      !/\.(jpe?g|png)$/i.test(file.name)
    ) {
      setError("Envie uma foto JPG ou PNG dentro do limite indicado.");
      return;
    }
    setBusy(true);
    const body = new FormData();
    body.set("file", file);
    try {
      setIdentity(
        await request<IdentityStatus>(
          "/account/identity-document",
          "POST",
          body,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível enviar a identificação.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" aria-busy={busy}>
      <h2>Meu RG ou CNH</h2>
      <p>
        Cadastre uma foto do seu RG ou da sua CNH. A identificação pode ser
        reutilizada em solicitações para o seu CPF. A confirmação de
        reutilização não dá acesso ao arquivo.
      </p>
      {identity && (
        <p role="status">
          {identity.status === "rejected"
            ? "Identificação rejeitada. Envie uma nova foto."
            : identity.registered
              ? "Identificação registrada."
              : "Nenhuma identificação cadastrada."}
        </p>
      )}
      <label>
        {identity?.registered
          ? "Substituir identificação"
          : "Enviar identificação"}
        <input
          type="file"
          accept=".jpg,.jpeg,.png"
          disabled={busy || !identity}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) void upload(file);
          }}
        />
      </label>
      {identity && (
        <p className="field-help">
          JPG ou PNG até {(identity.maxBytes / 1048576).toLocaleString("pt-BR")}{" "}
          MB.
        </p>
      )}
      {busy && <p role="status">Enviando identificação…</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
