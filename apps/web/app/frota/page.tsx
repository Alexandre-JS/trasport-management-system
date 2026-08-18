import { Suspense } from "react";
import { PageLoader } from "@/src/shared/components/page-loader";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";
import { FleetQueryPage } from "./fleet-query-page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frota",
};

export default function FleetPage() {
  return (
    <ProtectedLayout>
      <Suspense fallback={<PageLoader />}>
        <FleetQueryPage />
      </Suspense>
    </ProtectedLayout>
  );
}
