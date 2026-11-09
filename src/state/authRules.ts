export function authReturn(
  query: URLSearchParams,
  pending: unknown,
  origin: string,
  now = Date.now(),
) {
  if (!pending || typeof pending !== "object")
    throw new Error("Retorno expirado ou inválido. Entre novamente.");
  const record = pending as Record<string, unknown>;
  const code = query.get("code"),
    state = query.get("state");
  if (
    !code ||
    !state ||
    !/^([a-f0-9]{64})$/.test(code) ||
    state !== record.state ||
    typeof record.verifier !== "string" ||
    !/^([a-f0-9]{64})$/.test(record.verifier) ||
    typeof record.created !== "number" ||
    record.created > now ||
    now - record.created > 600000 ||
    record.redirectUri !== origin + "/conta/retorno"
  )
    throw new Error("Retorno expirado ou inválido. Entre novamente.");
  const returnTo =
    typeof record.returnTo === "string" &&
    /^\/solicitacao\/(pedido|responsavel|participantes|documentos|condicoes|revisao|pagamento)$/.test(
      record.returnTo,
    )
      ? record.returnTo
      : "/conta";
  return {
    code,
    verifier: record.verifier,
    redirectUri: record.redirectUri as string,
    returnTo,
  };
}
