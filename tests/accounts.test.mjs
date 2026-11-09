import { URLSearchParams } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validCpf,
  validPhone,
  personError,
} from "../src/state/identityRules.ts";
import { authReturn } from "../src/state/authRules.ts";
import { syntheticCpf } from "./fixtures/draft.ts";
test("CPF checks digits, formatting and repeated sequences", () => {
  const cpf = syntheticCpf(77);
  assert.ok(validCpf(cpf));
  assert.ok(
    validCpf(
      cpf.slice(0, 3) +
        "." +
        cpf.slice(3, 6) +
        "." +
        cpf.slice(6, 9) +
        "-" +
        cpf.slice(9),
    ),
  );
  assert.ok(!validCpf("11111111111"));
  assert.ok(!validCpf(cpf.slice(0, 10) + ((Number(cpf[10]) + 1) % 10)));
});
test("person validation rejects missing, malformed contact and impossible dates", () => {
  const person = {
    name: "DEMONSTRAÇÃO — teste",
    cpf: syntheticCpf(88),
    phone: "21999990001",
    email: "test@example.invalid",
    birthDate: "1990-01-01",
  };
  assert.equal(personError(person, true), "");
  assert.ok(personError({ ...person, birthDate: "2000-02-30" }));
  assert.ok(personError({ ...person, email: "wrong" }, true));
  assert.ok(!validPhone("00000000000"));
  assert.ok(validPhone("(21) 99999-0001"));
  assert.ok(personError({ ...person, name: "" }));
});
test("auth return validates state, expiration, redirect and one-use code shape", () => {
  const now = 12345678;
  const pending = {
    state: "a".repeat(64),
    verifier: "b".repeat(64),
    redirectUri: "http://localhost:5173/conta/retorno",
    created: now,
    returnTo: "/solicitacao/participantes",
  };
  const query = new URLSearchParams({
    code: "c".repeat(64),
    state: pending.state,
  });
  assert.equal(
    authReturn(query, pending, "http://localhost:5173", now).returnTo,
    pending.returnTo,
  );
  for (const patch of [
    { state: "wrong" },
    { created: now - 600001 },
    { created: now + 1 },
    { redirectUri: "https://evil.invalid/conta/retorno" },
    { verifier: "short" },
  ])
    assert.throws(() =>
      authReturn(query, { ...pending, ...patch }, "http://localhost:5173", now),
    );
  assert.equal(
    authReturn(
      query,
      { ...pending, returnTo: "//evil.invalid" },
      "http://localhost:5173",
      now,
    ).returnTo,
    "/conta",
  );
});
