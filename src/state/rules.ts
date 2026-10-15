export const maxFileSize = 5 * 1024 * 1024;
export function fileError(file: { size: number; type: string }) {
  if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type))
    return "Escolha um arquivo PDF, JPG ou PNG.";
  if (file.size > maxFileSize) return "O limite por arquivo é 5 MB.";
  return "";
}
