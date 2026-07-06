"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/providers/toast-provider";

export function ShareLinkButton({ token }: { token: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/track/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link de rastreio copiado",
        description: url,
        type: "success",
      });
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: url,
        type: "error",
      });
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {copied ? (
        <Check className="size-4 text-emerald-600" aria-hidden />
      ) : (
        <Share2 className="size-4" aria-hidden />
      )}
      {copied ? "Copiado" : "Partilhar"}
    </button>
  );
}
