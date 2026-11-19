import type { Participant, Person } from "../types/domain";
import type { SavedParticipant } from "../data/accountClient";
import { personError, digits, normalizePhone } from "./identityRules.ts";

export function normalizePerson(person: Person): Person {
  return {
    ...person,
    name: person.name.trim(),
    cpf: digits(person.cpf),
    phone: normalizePhone(person.phone),
    email: person.email.trim().toLowerCase(),
  };
}

export async function persistParticipants(
  people: Participant[],
  directory: SavedParticipant[],
  save: (
    person: Person,
    id?: number,
    version?: number,
  ) => Promise<SavedParticipant>,
  applied: (slot: string, saved: SavedParticipant) => void,
) {
  for (const person of people) {
    const data = normalizePerson(person.person);
    const error = personError(data);
    if (error) throw new Error(error);
    const current =
      directory.find((entry) => entry.id === person.directoryId) ??
      directory.find((entry) => entry.person.cpf === data.cpf);
    if (
      current &&
      Object.entries(data).every(
        ([key, value]) => current.person[key as keyof Person] === value,
      )
    ) {
      applied(person.id, current);
      continue;
    }
    const saved = await save(
      data,
      current?.id,
      person.directoryId ? person.directoryVersion : current?.version,
    );
    applied(person.id, saved);
  }
}
