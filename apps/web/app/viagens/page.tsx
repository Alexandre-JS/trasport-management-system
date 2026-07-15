import { TripsListView } from "@/src/shared/components/trips-list-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Viagens",
};

type ViagensPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ViagensPage({ searchParams }: ViagensPageProps) {
  const params = searchParams ? await searchParams : {};

  return (
    <ProtectedLayout>
      <TripsListView
        initialSearch={first(params.q) ?? ""}
        initialStatus={first(params.status) ?? "all"}
        initialPage={Number(first(params.page)) || 1}
      />
    </ProtectedLayout>
  );
}
