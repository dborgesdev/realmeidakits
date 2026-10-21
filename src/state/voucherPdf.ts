import type {
  DemoOrder,
  Participant,
  RaceSelection,
  Race,
} from "../types/domain";
import { modalityLabel } from "./pricing.ts";
import { voucherId } from "./participantRules.ts";
export function voucherLines(
  order: DemoOrder,
  participant: Participant,
  item: RaceSelection,
  race: Race,
) {
  return [
    "VOUCHER DE RETIRADA",
    race.name,
    `Pedido: ${order.id}`,
    `Voucher: ${voucherId(participant.id, race.id)}`,
    `Participante: ${participant.person.name}`,
    `Identificação fictícia: ${participant.person.cpf}`,
    `Modalidade: ${modalityLabel(item)}`,
    `Distância: ${item.distance}`,
    `Kit: ${item.modality === "appai" ? (item.kit === "numero" ? "Somente número de peito" : `Camiseta ${item.size}`) : item.kitType || "Kit oficial"}`,
    `Retirada: ${item.pickup || "Local a confirmar"}`,
    "Orientações ilustrativas:",
    race.guidance,
    "DEMONSTRAÇÃO — SEM VALIDADE",
    "Não é comprovante, inscrição ou autorização de retirada.",
    "Nenhum pagamento, reserva ou operação foi realizado.",
    "Sem QR Code operacional.",
  ];
}
// PDF 1.4 de uma página, fonte padrão WinAnsi e logo JPEG original.
// Sem dependências, conteúdo remoto ou anexos pessoais.
function bytes(text: string) {
  const substitutions: Record<string, number> = {
    "—": 151,
    "–": 150,
    "“": 147,
    "”": 148,
    "’": 146,
    "→": 62,
  };
  return Uint8Array.from(
    [...text.normalize("NFC")].map(
      (c) =>
        substitutions[c] ?? (c.charCodeAt(0) <= 255 ? c.charCodeAt(0) : 63),
    ),
  );
}
function literal(text: string) {
  return text.replace(/([\\()])/g, "\\$1");
}
function wrap(text: string, max = 76) {
  const result: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line.length + word.length + 1 > max && line) {
      result.push(line);
      line = "";
    }
    line += (line ? " " : "") + word;
  }
  if (line) result.push(line);
  return result;
}
export function createVoucherPdf(
  lines: string[],
  logo: Uint8Array,
  width: number,
  height: number,
) {
  const parts: Uint8Array[] = [];
  const offsets: number[] = [0];
  let length = 0;
  const push = (value: string | Uint8Array) => {
    const part = typeof value === "string" ? bytes(value) : value;
    parts.push(part);
    length += part.length;
  };
  push("%PDF-1.4\n%âãÏÓ\n");
  function object(id: number, body: string) {
    offsets[id] = length;
    push(`${id} 0 obj\n${body}\nendobj\n`);
  }
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(
    3,
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> /XObject << /Logo 6 0 R >> >> /Contents 7 0 R >>",
  );
  object(
    4,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  );
  object(
    5,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  );
  offsets[6] = length;
  push(
    `6 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.length} >>\nstream\n`,
  );
  push(logo);
  push("\nendstream\nendobj\n");
  const logoHeight = Math.min(72, (160 * height) / width);
  let commands = `q ${((logoHeight * width) / height).toFixed(2)} 0 0 ${logoHeight.toFixed(2)} 44 746 cm /Logo Do Q\n0.85 G 44 720 m 551 720 l S\nq 0.88 g BT /F2 25 Tf 0.866 0.5 -0.5 0.866 72 300 Tm (${literal("DEMONSTRAÇÃO — SEM VALIDADE")}) Tj ET Q\n`;
  let y = 688;
  lines.forEach((line, index) => {
    const bold = index < 2 || line === "DEMONSTRAÇÃO — SEM VALIDADE";
    for (const text of wrap(line)) {
      commands += `BT /${bold ? "F2" : "F1"} ${index === 0 ? 16 : 11} Tf 0.17 0.22 0.25 rg 1 0 0 1 44 ${y} Tm (${literal(text)}) Tj ET\n`;
      y -= 17;
    }
    y -= index < 2 ? 12 : 7;
  });
  const content = bytes(commands);
  offsets[7] = length;
  push(`7 0 obj\n<< /Length ${content.length} >>\nstream\n`);
  push(content);
  push("endstream\nendobj\n");
  const xref = length;
  push("xref\n0 8\n0000000000 65535 f \n");
  for (let n = 1; n <= 7; n++)
    push(`${String(offsets[n]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const output = new Uint8Array(length);
  let cursor = 0;
  for (const part of parts) {
    output.set(part, cursor);
    cursor += part.length;
  }
  return output;
}
export async function downloadVoucher(
  order: DemoOrder,
  participant: Participant,
  item: RaceSelection,
  race: Race,
) {
  const response = await fetch("/brand/logo-corredor-original.jpg");
  if (!response.ok) throw new Error("Logo indisponível");
  const blob = await response.blob();
  const image = await createImageBitmap(blob);
  const pdf = createVoucherPdf(
    voucherLines(order, participant, item, race),
    new Uint8Array(await blob.arrayBuffer()),
    image.width,
    image.height,
  );
  image.close();
  const url = URL.createObjectURL(
    new Blob([pdf.buffer as ArrayBuffer], { type: "application/pdf" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${voucherId(participant.id, race.id)}.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
