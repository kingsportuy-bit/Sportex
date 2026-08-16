import type { WhatsAppOutboundCommand, WhatsAppOutboundRecord } from "../../domain/whatsapp-transport-models.js";

export type EvolutionFetch = typeof fetch;

function destinationNumber(value: string): string {
  const match = /^(\d{8,15})@s\.whatsapp\.net$/u.exec(value);
  if (!match?.[1]) throw new Error("evolution_destination_invalid");
  return match[1];
}

function providerMessageId(payload: unknown): string {
  if (!payload || typeof payload !== "object") throw new Error("evolution_send_response_invalid");
  const root = payload as Record<string, unknown>;
  const key = root.key && typeof root.key === "object" ? root.key as Record<string, unknown> : null;
  const id = typeof key?.id === "string" ? key.id : typeof root.id === "string" ? root.id : null;
  if (!id || id.length > 160) throw new Error("evolution_send_message_id_missing");
  return id;
}

export class EvolutionHttpTransport {
  constructor(
    private readonly baseUrl: string,
    private readonly instance: string,
    private readonly apiKey: string,
    private readonly http: EvolutionFetch = fetch,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async send(command: WhatsAppOutboundCommand): Promise<WhatsAppOutboundRecord> {
    if (!command.confirmedBy.trim()) throw new Error("outbound_human_confirmation_required");
    const image = command.image ?? null;
    const response = await this.http(
      `${this.baseUrl}/message/${image ? "sendMedia" : "sendText"}/${encodeURIComponent(this.instance)}`,
      {
        method: "POST",
        headers: { apikey: this.apiKey, "content-type": "application/json" },
        body: JSON.stringify(image ? {
          number: destinationNumber(command.destinationRef),
          mediatype: "image",
          mimetype: image.mimeType,
          caption: command.text,
          media: image.dataBase64,
          fileName: image.fileName,
        } : { number: destinationNumber(command.destinationRef), text: command.text }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) throw new Error(`evolution_send_http_${response.status}`);
    const id = providerMessageId(await response.json());
    const now = this.clock().toISOString();
    return {
      ...structuredClone(command),
      providerMessageId: id,
      status: "SENT",
      attempts: 1,
      createdAt: now,
      updatedAt: now,
    };
  }
}
