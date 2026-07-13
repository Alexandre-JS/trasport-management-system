import { PublicTrackView } from "@/src/shared/components/public-track-view";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rastreio de carga",
  robots: { index: false },
};

export default async function PublicTrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <PublicTrackView token={token} />;
}
