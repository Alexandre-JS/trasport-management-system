"use client";

import { UsersPanel } from "@/components/settings/users-panel";
import { PageHeader } from "@/components/ui/page-header";

export function UsersView() {
  return (
    <>
      <PageHeader
        title="Gestão de Usuários"
        description="Criar, editar e gerir as contas de acesso ao sistema e os seus perfis."
      />
      <UsersPanel />
    </>
  );
}
