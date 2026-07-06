"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/src/shared/hooks/use-auth";

type RoleGuardProps = {
  roles: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
};

export function RoleGuard({
  roles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { hasRole } = useAuth();

  if (!hasRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
