"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ProtectedRoute } from "@/src/shared/components/protected-route";
import { AppLayout } from "@/src/shared/layout/app-layout";
import { useAuth } from "@/src/shared/hooks/use-auth";

type ProtectedLayoutProps = {
  children: ReactNode;
};

/**
 * Keeps client-role users out of the operations panel: a CLIENT is sent to
 * their portal instead of hitting admin pages (which they cannot call).
 */
function StaffOnly({ children }: { children: ReactNode }) {
  const { role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const isClient = role === "CLIENT";

  useEffect(() => {
    if (!isLoading && isAuthenticated && isClient) {
      router.replace("/portal");
    }
  }, [isLoading, isAuthenticated, isClient, router]);

  if (isClient) {
    return null;
  }

  return <>{children}</>;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <ProtectedRoute>
      <StaffOnly>
        <AppLayout>{children}</AppLayout>
      </StaffOnly>
    </ProtectedRoute>
  );
}
