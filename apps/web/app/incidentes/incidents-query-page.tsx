"use client";

import { useSearchParams } from "next/navigation";
import { IncidentsView } from "@/components/incidents/incidents-view";

export function IncidentsQueryPage() {
  const resolved = useSearchParams().get("resolved");
  const initialState =
    resolved === "false" ? "open" : resolved === "true" ? "resolved" : "all";

  return <IncidentsView initialState={initialState} />;
}
