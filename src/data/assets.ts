export const asset = (file: string) =>
  file.startsWith("https://") ? file : file ? `/images/home/${file}` : "";
