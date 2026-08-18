import { Suspense } from "react";
import { PageLoader } from "@/src/shared/components/page-loader";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";
import { ShipmentsQueryPage } from "./shipments-query-page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipments",
};

export default function CargasPage() {
  return (
    <ProtectedLayout>
      <Suspense fallback={<PageLoader />}>
        <ShipmentsQueryPage />
      </Suspense>
    </ProtectedLayout>
  );
}
