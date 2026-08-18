import { StaticPortalRoute } from "./static-portal-route";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client portal",
};

export default function PortalPage() {
  return <StaticPortalRoute />;
}
