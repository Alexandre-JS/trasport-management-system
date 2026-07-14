import { UsersView } from "@/components/users/users-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Utilizadores",
};

export default function UtilizadoresPage() {
  return (
    <ProtectedLayout>
      <UsersView />
    </ProtectedLayout>
  );
}
