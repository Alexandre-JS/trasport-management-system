"use client";

import { useMutation } from "@tanstack/react-query";
import { createClientAccount } from "@/services/client-accounts-service";

export function useCreateClientAccount() {
  return useMutation({ mutationFn: createClientAccount });
}
