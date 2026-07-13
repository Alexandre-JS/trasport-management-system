import { TripDetailView } from "@/src/shared/components/trip-detail-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detalhe da viagem",
};

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProtectedLayout>
      <TripDetailView id={id} />
    </ProtectedLayout>
  );
}
