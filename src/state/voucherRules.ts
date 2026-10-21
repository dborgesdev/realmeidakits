import type { Race } from "../types/domain";
export function groupUrl(race: Race) {
  if (!race.whatsappUrl) return null;
  try {
    const url = new URL(race.whatsappUrl);
    return url.protocol === "https:" &&
      (url.hostname === "chat.whatsapp.com" ||
        url.hostname === "whatsapp.com" ||
        url.hostname.endsWith(".whatsapp.com"))
      ? url.href
      : null;
  } catch {
    return null;
  }
}
