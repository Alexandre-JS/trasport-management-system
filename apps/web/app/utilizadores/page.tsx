import { UsersView } from "@/components/users/users-view";
import { RoleGuard } from "@/src/shared/components/role-guard";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User management",
};

export default function UtilizadoresPage() {
  return (
    <ProtectedLayout>
      <RoleGuard allow={["ADMIN"]}>
        <UsersView />
      </RoleGuard>
    </ProtectedLayout>
  );
}
