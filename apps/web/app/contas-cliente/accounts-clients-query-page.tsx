"use client";

import { useSearchParams } from "next/navigation";
import {
  AccountsClientsView,
  type AccountsClientsTab,
} from "@/src/shared/components/accounts-clients-view";

export function AccountsClientsQueryPage() {
  const value = useSearchParams().get("tab");
  const tab: AccountsClientsTab =
    value === "contas" || value === "motoristas" ? value : "clientes";

  return <AccountsClientsView initialTab={tab} />;
}
