import { CargasView } from "@/src/shared/components/cargas-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cargas",
};

type CargasPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CargasPage({ searchParams }: CargasPageProps) {
  const params = searchParams ? await searchParams : {};

  return (
    <ProtectedLayout>
      <CargasView
        initialSearch={first(params.q) ?? ""}
        initialClientId={first(params.client) ?? "all"}
        initialStatus={first(params.status) ?? "all"}
        initialPage={Number(first(params.page)) || 1}
        initialCreateOpen={first(params.action) === "new"}
      />
    </ProtectedLayout>
  );
}
