import { TripDetailView } from "@/src/shared/components/trip-detail-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

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
