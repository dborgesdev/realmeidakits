export const digits = (value: string) => value.replace(/\D/g, "");
export function validCpf(value: string): boolean {
  const cpf = digits(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let length = 9; length < 11; length++) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    const digit = (sum * 10) % 11;
    if (Number(cpf[length]) !== (digit === 10 ? 0 : digit)) return false;
  }
  return true;
}
export const validPhone = (value: string) =>
  /^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(digits(value));
export const validEmail = (value: string) =>
  value.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export function personError(
  person: {
    name: string;
    cpf: string;
    phone: string;
    birthDate: string;
    email: string;
  },
  requiredEmail = false,
): string {
  if (person.name.trim().length < 3 || person.name.length > 80)
    return "Informe nome completo entre 3 e 80 caracteres.";
  if (!validCpf(person.cpf)) return "Informe um CPF válido.";
  if (!validPhone(person.phone)) return "Informe telefone com DDD válido.";
  if ((requiredEmail || person.email) && !validEmail(person.email))
    return "Informe e-mail válido.";
  const date = new Date(person.birthDate + "T00:00:00Z");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(person.birthDate) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== person.birthDate ||
    person.birthDate < "1900-01-01" ||
    person.birthDate > new Date().toISOString().slice(0, 10)
  )
    return "Informe data de nascimento válida.";
  return "";
}
