import { createHash } from "node:crypto";
import type { WhatsAppImageMimeType, WhatsAppImagePayload } from "./whatsapp-transport-models.js";

export const WHATSAPP_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

function detectedMime(bytes: Buffer): WhatsAppImageMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF"
    && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}
function safeFileName(value: string, mimeType: WhatsAppImageMimeType): string {
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
  const cleaned = value.trim().replace(/[^a-zA-Z0-9._-]/gu, "-").replace(/-+/gu, "-").slice(0, 120);
  return cleaned || `imagen.${extension}`;
}

export function normalizeWhatsAppImage(input: {
  mimeType: string;
  fileName?: string | null;
  dataBase64: string;
  width?: number | null;
  height?: number | null;
}): WhatsAppImagePayload {
  const declared = input.mimeType.toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].includes(declared)) {
    throw new Error("whatsapp_image_mime_forbidden");
  }
  const raw = input.dataBase64.replace(/^data:[^;]+;base64,/iu, "").replace(/\s+/gu, "");
  if (!raw || !/^[a-zA-Z0-9+/]+={0,2}$/u.test(raw)) throw new Error("whatsapp_image_base64_invalid");
  const bytes = Buffer.from(raw, "base64");
  if (!bytes.length || bytes.length > WHATSAPP_IMAGE_MAX_BYTES) throw new Error("whatsapp_image_size_invalid");
  const actual = detectedMime(bytes);
  if (!actual || actual !== declared) throw new Error("whatsapp_image_signature_invalid");
  const dimension = (value: number | null | undefined): number | null =>
    Number.isInteger(value) && Number(value) > 0 && Number(value) <= 20_000 ? Number(value) : null;
  return {
    mimeType: actual,
    fileName: safeFileName(input.fileName ?? "", actual),
    sizeBytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    dataBase64: bytes.toString("base64"),
    width: dimension(input.width),
    height: dimension(input.height),
  };
}
