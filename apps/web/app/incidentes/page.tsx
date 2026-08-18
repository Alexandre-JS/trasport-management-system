import { Suspense } from "react";
import { PageLoader } from "@/src/shared/components/page-loader";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";
import { IncidentsQueryPage } from "./incidents-query-page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Incidents",
};

export default function IncidentesPage() {
  return (
    <ProtectedLayout>
      <Suspense fallback={<PageLoader />}>
        <IncidentsQueryPage />
      </Suspense>
    </ProtectedLayout>
  );
}
