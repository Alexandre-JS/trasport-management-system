import { PublicTrackView } from "@/src/shared/components/public-track-view";

export default async function PublicTrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <PublicTrackView token={token} />;
}
