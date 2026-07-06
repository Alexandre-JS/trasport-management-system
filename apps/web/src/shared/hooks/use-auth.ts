"use client";

import { useAuthContext } from "@/src/shared/providers/auth-provider";

export function useAuth() {
  return useAuthContext();
}
