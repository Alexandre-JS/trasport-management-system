"use client";

import { Check, Link2, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/providers/toast-provider";

// Partilha compacta de UMA carga (por linha): copiar link de rastreio ou
// enviar por WhatsApp. Usa o trackingToken público → /track/{token}.
export function CargoShareCell({
  token,
  label,
}: {
  token: string | undefined;
  label?: string;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!token) {
    return <span className="text-slate-300 dark:text-slate-600">—</span>;
  }

  const url = `${window.location.origin}/track/${token}`;
  const message = `Olá! Acompanhe a sua carga${label ? ` (${label})` : ""} da LUMAC aqui:\n${url}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: "Link de rastreio copiado", type: "success" });
    } catch {
      toast({ title: "Não foi possível copiar", description: url, type: "error" });
    }
  }

  function whatsapp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={whatsapp}
        title="Partilhar por WhatsApp"
        aria-label="Partilhar por WhatsApp"
        className="grid size-7 place-items-center rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
      >
        <MessageCircle className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => void copyLink()}
        title="Copiar link de rastreio"
        aria-label="Copiar link de rastreio"
        className="grid size-7 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {copied ? (
          <Check className="size-4 text-emerald-600" aria-hidden />
        ) : (
          <Link2 className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
