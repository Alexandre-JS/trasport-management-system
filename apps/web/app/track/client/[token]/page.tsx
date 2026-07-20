import { PublicClientTrackView } from "@/src/shared/components/public-client-track-view";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rastreio de cargas",
  robots: { index: false },
};

export default async function PublicClientTrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <PublicClientTrackView token={token} />;
}
