import { Suspense } from "react";
import { PageLoader } from "@/src/shared/components/page-loader";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";
import { AccountsClientsQueryPage } from "./accounts-clients-query-page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accounts and clients",
};

export default function ClientAccountsPage() {
  return (
    <ProtectedLayout>
      <Suspense fallback={<PageLoader />}>
        <AccountsClientsQueryPage />
      </Suspense>
    </ProtectedLayout>
  );
}
