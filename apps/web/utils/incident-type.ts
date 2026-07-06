import type { BadgeTone } from "@/components/ui/badge";
import type { IncidentType } from "@/types/incident";

export const incidentTypeMeta: Record<
  IncidentType,
  { label: string; tone: BadgeTone }
> = {
  ACCIDENT: { label: "Acidente", tone: "red" },
  BREAKDOWN: { label: "Avaria", tone: "amber" },
  TRAFFIC: { label: "Trânsito", tone: "blue" },
  ROAD_BLOCKED: { label: "Via bloqueada", tone: "violet" },
  OTHER: { label: "Outro", tone: "slate" },
};

export const incidentTypeOptions = [
  { label: "Todos os tipos", value: "all" },
  { label: "Acidente", value: "ACCIDENT" },
  { label: "Avaria", value: "BREAKDOWN" },
  { label: "Trânsito", value: "TRAFFIC" },
  { label: "Via bloqueada", value: "ROAD_BLOCKED" },
  { label: "Outro", value: "OTHER" },
];

export const incidentStateOptions = [
  { label: "Todos os estados", value: "all" },
  { label: "Abertos", value: "open" },
  { label: "Resolvidos", value: "resolved" },
];
