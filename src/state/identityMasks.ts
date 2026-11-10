import { digits } from "./identityRules.ts";

export type MaskedIdentityField = "cpf" | "phone" | "birthDate";

export function maskedField(key: string): key is MaskedIdentityField {
  return key === "cpf" || key === "phone" || key === "birthDate";
}

export function formatIdentity(
  key: MaskedIdentityField,
  value: string,
): string {
  if (key === "birthDate") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value))
      return value.split("-").reverse().join("/");
    const date = digits(value).slice(0, 8);
    return [date.slice(0, 2), date.slice(2, 4), date.slice(4)]
      .filter(Boolean)
      .join("/");
  }
  const number = digits(value).slice(0, 11);
  if (key === "cpf") {
    const head = [number.slice(0, 3), number.slice(3, 6), number.slice(6, 9)]
      .filter(Boolean)
      .join(".");
    return number.length > 9 ? head + "-" + number.slice(9) : head;
  }
  if (!number) return "";
  const prefix = "(" + number.slice(0, 2);
  if (number.length <= 2) return prefix;
  const body = number.slice(2);
  const split = number.length === 11 ? 5 : 4;
  return (
    prefix +
    ") " +
    body.slice(0, split) +
    (body.length > split ? "-" + body.slice(split) : "")
  );
}

export function normalizeIdentity(key: MaskedIdentityField, value: string) {
  const formatted = formatIdentity(key, value);
  if (key !== "birthDate") return digits(formatted);
  return /^\d{2}\/\d{2}\/\d{4}$/.test(formatted)
    ? formatted.split("/").reverse().join("-")
    : formatted;
}

export function maskIdentityInput(
  key: MaskedIdentityField,
  input: HTMLInputElement,
) {
  const raw = input.value;
  const left = digits(raw.slice(0, input.selectionStart ?? raw.length)).length;
  const formatted = formatIdentity(key, raw);
  if (raw !== formatted) {
    input.value = formatted;
    let offset = 0;
    let remaining = left;
    while (offset < formatted.length && remaining > 0) {
      if (/\d/.test(formatted[offset])) remaining--;
      offset++;
    }
    input.setSelectionRange(offset, offset);
  }
  return normalizeIdentity(key, formatted);
}
