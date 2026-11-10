import {
  formatIdentity,
  normalizeIdentity,
} from "../src/state/identityMasks.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validCpf,
  validPhone,
  personError,
} from "../src/state/identityRules.ts";
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

test("identity masks limit national digits and convert displayed birth dates", () => {
  assert.equal(formatIdentity("cpf", "12345678901234"), "123.456.789-01");
  assert.equal(formatIdentity("phone", "4333334444"), "(43) 3333-4444");
  assert.equal(formatIdentity("phone", "43999999999"), "(43) 99999-9999");
  assert.equal(formatIdentity("birthDate", "2000-02-29"), "29/02/2000");
  assert.equal(normalizeIdentity("birthDate", "29/02/2000"), "2000-02-29");
});
