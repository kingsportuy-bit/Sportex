export type StageBoardKind = "lead" | "order";

export interface StageDefinition {
  id: string;
  tenantId: string;
  board: StageBoardKind;
  name: string;
  position: number;
  terminal: boolean;
  createdAt: string;
  updatedAt: string;
}

export const defaultStageDefinitions: Record<StageBoardKind, ReadonlyArray<Pick<StageDefinition, "id" | "name" | "position" | "terminal">>> = {
  lead: [
    { id: "NUEVO", name: "Nuevos", position: 10, terminal: false },
    { id: "EN_CALIFICACION", name: "En conversación", position: 20, terminal: false },
    { id: "COTIZADO", name: "Cotización / boceto", position: 30, terminal: false },
    { id: "EN_SEGUIMIENTO", name: "Seguimiento", position: 40, terminal: false },
    { id: "SENA_VALIDADA", name: "Confirmados", position: 50, terminal: false },
    { id: "PERDIDO", name: "No continúa", position: 60, terminal: true },
  ],
  order: [
    { id: "intake_pending", name: "Ingreso", position: 10, terminal: false },
    { id: "design_pending", name: "Boceto", position: 20, terminal: false },
    { id: "production_ready", name: "Aprobado", position: 30, terminal: false },
    { id: "in_production", name: "En producción", position: 40, terminal: false },
    { id: "completed", name: "Finalizado", position: 50, terminal: true },
  ],
};
