"use client";

import { Check, Download, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import QRCode from "qrcode";
import { useToast } from "@/providers/toast-provider";
import { addPdfFooter, addPdfHeader } from "@/src/shared/utils/pdf-branding";

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

  function whatsapp() {
    const url = `${window.location.origin}/track/${token}`;
    const message = `Olá! Obrigado por confiar na LUMAC. Estamos consigo em cada etapa.\n\nAcompanhe a sua carga aqui:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  async function downloadPdf() {
    const url = `${window.location.origin}/track/${token}`;
    const [{ jsPDF }, qr] = await Promise.all([
      import("jspdf"),
      QRCode.toDataURL(url, { width: 500, margin: 1 }),
    ]);
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    await addPdfHeader(
      pdf,
      "Acompanhamento da carga",
      "Ligação pública de rastreio",
    );
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(11);
    pdf.text("Leia o QR Code para consultar o estado atualizado desta carga.", 18, 50);
    pdf.addImage(qr, "PNG", 18, 62, 55, 55);
    pdf.setTextColor(30, 80, 171);
    pdf.text(pdf.splitTextToSize(url, 105), 82, 76);
    addPdfFooter(pdf, "Documento informativo processado por computador.");
    pdf.save("acompanhamento-carga.pdf");
  }

  return (
    <div className="flex flex-wrap gap-2" data-print-hide>
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
    <button type="button" onClick={whatsapp} className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-300">
      <MessageCircle className="size-4" aria-hidden /> WhatsApp
    </button>
    <button type="button" onClick={() => void downloadPdf()} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <Download className="size-4" aria-hidden /> PDF com QR
    </button>
    </div>
  );
}
