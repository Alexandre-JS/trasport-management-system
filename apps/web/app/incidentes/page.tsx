import { IncidentsView } from "@/components/incidents/incidents-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Incidentes",
};

type IncidentesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function IncidentesPage({
  searchParams,
}: IncidentesPageProps) {
  const params = searchParams ? await searchParams : {};
  const resolved = first(params.resolved);

  return (
    <ProtectedLayout>
      <IncidentsView
        initialState={
          resolved === "false"
            ? "open"
            : resolved === "true"
              ? "resolved"
              : "all"
        }
      />
    </ProtectedLayout>
  );
}
