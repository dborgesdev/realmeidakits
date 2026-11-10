import assert from "node:assert/strict";
import { test } from "node:test";
import { initialDraft } from "../src/state/draft.ts";
import {
  readDraft,
  writeDraft,
  clearStoredDraft,
} from "../src/state/draftStorage.ts";

test("the temporary draft is owner-bound, expires and omits personal data", () => {
  const records = new Map();
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key) => records.get(key),
      setItem: (key, value) => records.set(key, value),
      removeItem: (key) => records.delete(key),
    },
  });
  try {
    const draft = initialDraft();
    draft.selectedRaceIds = ["12", "19"];
    draft.preferredModality = "appai";
    draft.participants[0].person.name = "DEMONSTRAÇÃO";
    draft.participants[0].person.email = "qa@example.invalid";
    draft.participants[0].directoryId = 42;
    writeDraft(draft, 7);
    assert.deepEqual(readDraft(7).selectedRaceIds, ["12", "19"]);
    assert.equal(readDraft(7).preferredModality, "appai");
    assert.equal(readDraft(7).participants[0].person.name, "");
    assert.equal(readDraft(7).participants[0].directoryId, undefined);
    assert.deepEqual(readDraft(8).selectedRaceIds, []);
    assert.deepEqual(readDraft(null).selectedRaceIds, []);
    const [[key, value]] = records;
    assert.doesNotMatch(value, /DEMONSTRAÇÃO|example\.invalid|directoryId/);
    records.set(
      key,
      JSON.stringify({ ...JSON.parse(value), until: Date.now() - 1 }),
    );
    assert.deepEqual(readDraft(7).selectedRaceIds, []);
    clearStoredDraft();
    assert.equal(records.size, 0);
  } finally {
    delete globalThis.sessionStorage;
  }
});
