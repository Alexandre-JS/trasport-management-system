"use client";

import { useAuth } from "@/src/shared/hooks/use-auth";

export function usePermissions() {
  const { permissions, role, hasPermission, hasRole } = useAuth();

  return { permissions, role, hasPermission, hasRole };
}
