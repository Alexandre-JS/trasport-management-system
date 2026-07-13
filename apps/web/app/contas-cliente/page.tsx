import {
  AccountsClientsView,
  type AccountsClientsTab,
} from "@/src/shared/components/accounts-clients-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contas e clientes",
};

type ClientAccountsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeTab(value: string | undefined): AccountsClientsTab {
  if (value === "contas" || value === "motoristas") {
    return value;
  }

  return "clientes";
}

export default async function ClientAccountsPage({
  searchParams,
}: ClientAccountsPageProps) {
  const params = searchParams ? await searchParams : {};
  const tab = Array.isArray(params.tab) ? params.tab[0] : params.tab;

  return (
    <ProtectedLayout>
      <AccountsClientsView initialTab={normalizeTab(tab)} />
    </ProtectedLayout>
  );
}
