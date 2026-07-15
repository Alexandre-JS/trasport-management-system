"use client";

import { Printer } from "lucide-react";
import { ActionButton } from "@/src/shared/components/action-button";

export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <ActionButton
      icon={<Printer className="size-4" aria-hidden />}
      onClick={() => window.print()}
      data-print-hide
    >
      {label}
    </ActionButton>
  );
}
