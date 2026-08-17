import type { BadgeTone } from "@/components/ui/badge";
import type { IncidentType } from "@/types/incident";

export const incidentTypeMeta: Record<
  IncidentType,
  { label: string; tone: BadgeTone }
> = {
  ACCIDENT: { label: "Accident", tone: "red" },
  BREAKDOWN: { label: "Breakdown", tone: "amber" },
  TRAFFIC: { label: "Traffic", tone: "blue" },
  ROAD_BLOCKED: { label: "Road blocked", tone: "violet" },
  OTHER: { label: "Other", tone: "slate" },
};

export const incidentTypeOptions = [
  { label: "All types", value: "all" },
  { label: "Accident", value: "ACCIDENT" },
  { label: "Breakdown", value: "BREAKDOWN" },
  { label: "Traffic", value: "TRAFFIC" },
  { label: "Road blocked", value: "ROAD_BLOCKED" },
  { label: "Other", value: "OTHER" },
];

export const incidentStateOptions = [
  { label: "All statuses", value: "all" },
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
];
