import { StaticTrackingRoute } from "./static-tracking-route";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipment tracking",
  robots: { index: false },
};

export default function PublicTrackPage() {
  return <StaticTrackingRoute />;
}
