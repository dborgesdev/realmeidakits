import type { Draft } from "../types/domain";
import { initialDraft, makeParticipant } from "./draft.ts";

const key = "rak_request_draft_v1";
const lifetime = 30 * 60_000;

export function readDraft(owner: number | null): Draft {
  const draft = initialDraft();
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? "null");
    if (
      !value ||
      value.owner !== owner ||
      !Number.isFinite(value.until) ||
      value.until <= Date.now() ||
      value.until > Date.now() + lifetime
    )
      return draft;
    if (Array.isArray(value.ids)) {
      draft.selectedRaceIds = [
        ...new Set<string>(
          value.ids
            .filter(
              (id: unknown): id is string =>
                typeof id === "string" && /^[1-9][0-9]{0,19}$/.test(id),
            )
            .slice(0, 100),
        ),
      ];
    }
    if (value.modality === "appai" || value.modality === "oficial")
      draft.preferredModality = value.modality;
    if (
      Number.isInteger(value.count) &&
      value.count >= 1 &&
      value.count <= 100
    ) {
      draft.participants = Array.from({ length: value.count }, (_, index) =>
        makeParticipant(index + 1),
      );
      draft.nextParticipantNumber = value.count + 1;
      draft.prepared = value.prepared === true;
    }
  } catch {
    // The request still works in memory if browser storage is unavailable.
  }
  return draft;
}

export function writeDraft(draft: Draft, owner: number | null) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        owner,
        until: Date.now() + lifetime,
        ids: draft.selectedRaceIds,
        modality: draft.preferredModality,
        count: draft.participants.length,
        prepared: draft.prepared,
      }),
    );
  } catch {
    // Browser storage is optional.
  }
}

export function clearStoredDraft() {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Browser storage is optional.
  }
}
