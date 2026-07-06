"use client";

import { useAuth } from "@/src/shared/hooks/use-auth";

export function useHasPermission(permission: string) {
  const { hasPermission } = useAuth();

  return hasPermission(permission);
}
