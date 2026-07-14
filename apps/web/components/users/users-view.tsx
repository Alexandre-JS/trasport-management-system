"use client";

import { UsersPanel } from "@/components/settings/users-panel";
import { PageHeader } from "@/components/ui/page-header";

export function UsersView() {
  return (
    <>
      <PageHeader
        title="Utilizadores"
        description="Contas de acesso ao sistema e respetivos perfis de permissões."
      />
      <UsersPanel />
    </>
  );
}
