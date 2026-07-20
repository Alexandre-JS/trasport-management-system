"use client";

import { Check, Link2, MessageCircle } from "lucide-react";
import { useRef, useState } from "react";
import { getClientShareToken } from "@/services/clients-service";
import { useToast } from "@/providers/toast-provider";

// Partilha de TODAS as cargas de um cliente num único link público
// (/track/client/{token}). O token é buscado a pedido (no primeiro clique) e
// reutilizado — evita uma query por linha na lista de atividades.
export function ClientShareCell({
  clientId,
  clientName,
  compact,
}: {
  clientId: string;
  clientName: string;
  compact?: boolean;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const tokenRef = useRef<string | null>(null);

  async function resolveUrl(): Promise<string | null> {
    if (!tokenRef.current) {
      setLoading(true);
      try {
        tokenRef.current = await getClientShareToken(clientId);
      } catch {
        toast({ title: "Não foi possível obter o link do cliente", type: "error" });
        return null;
      } finally {
        setLoading(false);
      }
    }
    return `${window.location.origin}/track/client/${tokenRef.current}`;
  }

  async function copyLink() {
    const url = await resolveUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: "Link do cliente copiado", type: "success" });
    } catch {
      toast({ title: "Não foi possível copiar", description: url, type: "error" });
    }
  }

  async function whatsapp() {
    const url = await resolveUrl();
    if (!url) return;
    const message = `Olá! Acompanhe as cargas de ${clientName} da LUMAC aqui:\n${url}`;
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
        onClick={() => void whatsapp()}
        disabled={loading}
        title="Partilhar cargas do cliente por WhatsApp"
        aria-label="Partilhar cargas do cliente por WhatsApp"
        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
      >
        <MessageCircle className="size-4" aria-hidden />
        {compact ? null : "WhatsApp"}
      </button>
      <button
        type="button"
        onClick={() => void copyLink()}
        disabled={loading}
        title="Copiar link do cliente"
        aria-label="Copiar link do cliente"
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {copied ? (
          <Check className="size-4 text-emerald-600" aria-hidden />
        ) : (
          <Link2 className="size-4" aria-hidden />
        )}
        {compact ? null : "Copiar link"}
      </button>
    </div>
  );
}
