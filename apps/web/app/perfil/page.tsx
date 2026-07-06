import { ProfileView } from "@/src/shared/components/profile-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

export default function PerfilPage() {
  return (
    <ProtectedLayout>
      <ProfileView />
    </ProtectedLayout>
  );
}
