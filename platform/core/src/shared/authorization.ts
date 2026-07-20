import type { ActorContext, Capability } from "../domain/models.js";
import { forbidden } from "./errors.js";

export function requireCapability(context: ActorContext, capability: Capability): void {
  if (!context.capabilities.includes(capability)) {
    throw forbidden("permission_denied", `Missing capability: ${capability}`);
  }
}
