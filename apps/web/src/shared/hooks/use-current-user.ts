"use client";

import { useAuth } from "@/src/shared/hooks/use-auth";

export function useCurrentUser() {
  const { user, isLoading } = useAuth();

  return { user, isLoading };
}
