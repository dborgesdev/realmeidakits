import { test } from "node:test";
import assert from "node:assert/strict";
import {
  persistParticipants,
  normalizePerson,
} from "../src/state/persistParticipants.ts";
import { makeParticipant } from "../src/state/draft.ts";
import { syntheticCpf } from "./fixtures/draft.ts";
import { formatIdentity } from "../src/state/identityMasks.ts";

const demo = (number) => ({
  ...makeParticipant(number),
  person: {
    name: "DEMONSTRAÇÃO " + number,
    cpf: syntheticCpf(number + 400),
    birthDate: "1990-01-01",
    phone: "+55 (21) 99999-0001",
    email: " QA@EXAMPLE.INVALID ",
  },
});
test("Continuar persists participants sequentially, normalizes pasted data and reuses saved identities", async () => {
  const people = [demo(1), demo(2)],
    applied = [],
    calls = [];
  const save = async (person, id, version) => {
    calls.push({ person, id, version });
    return { id: calls.length, version: 1, person };
  };
  await persistParticipants(people, [], save, (slot, saved) =>
    applied.push({ slot, saved }),
  );
  assert.equal(calls.length, 2);
  assert.equal(applied.length, 2);
  assert.equal(calls[0].person.email, "qa@example.invalid");
  assert.equal(calls[0].person.phone, "21999990001");
  const saved = applied.map(({ saved }) => saved);
  await persistParticipants(
    people.map((p, i) => ({
      ...p,
      directoryId: saved[i].id,
      directoryVersion: 1,
    })),
    saved,
    save,
    () => {},
  );
  assert.equal(calls.length, 2);
});
test("participant failure preserves successful bindings and prevents advancing past failed persistence", async () => {
  const people = [demo(3), demo(4)],
    applied = [];
  let calls = 0;
  await assert.rejects(
    persistParticipants(
      people,
      [],
      async (person) => {
        calls++;
        if (calls === 2) throw new Error("Falha de conexão");
        return { id: 1, version: 1, person };
      },
      (slot, saved) => applied.push({ slot, saved }),
    ),
    /conexão/,
  );
  assert.equal(applied.length, 1);
  assert.equal(people[1].person.name, "DEMONSTRAÇÃO 4");
});
test("invalid CPF is rejected before any participant write and masks accept pasted international phone", async () => {
  let calls = 0;
  await assert.rejects(
    persistParticipants(
      [{ ...demo(5), person: { ...demo(5).person, cpf: "00000000000" } }],
      [],
      async () => {
        calls++;
      },
      () => {},
    ),
    /CPF/,
  );
  assert.equal(calls, 0);
  assert.equal(
    formatIdentity("phone", "+55 (21) 99999-0001"),
    "(21) 99999-0001",
  );
  assert.equal(normalizePerson(demo(5).person).email, "qa@example.invalid");
});
