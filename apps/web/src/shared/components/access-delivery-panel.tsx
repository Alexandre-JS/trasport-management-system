"use client";

import { Download, MessageCircle, QrCode } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ActionButton, PrimaryButton } from "@/src/shared/components/action-button";
import { addPdfFooter, addPdfHeader } from "@/src/shared/utils/pdf-branding";

export type AccessDelivery = {
  recipientName: string;
  email: string;
  password?: string;
  /** Rótulo do identificador (default "Utilizador"; motorista usa "Telefone"). */
  identifierLabel?: string;
  /** Rótulo do segredo (default "Senha provisória"; motorista usa "Código de acesso"). */
  secretLabel?: string;
  /** Se o segredo é para o próprio alterar depois (default true). */
  changeableSecret?: boolean;
  destinationUrl: string;
  destinationLabel: string;
  documentTitle: string;
};

export function AccessDeliveryPanel({ access }: { access: AccessDelivery }) {
  const [qrCode, setQrCode] = useState("");
  const idLabel = access.identifierLabel ?? "Utilizador";
  const secretLabel = access.secretLabel ?? "Senha provisória";
  const changeable = access.changeableSecret ?? true;

  useEffect(() => {
    void QRCode.toDataURL(access.destinationUrl, { width: 360, margin: 1 })
      .then(setQrCode)
      .catch(() => setQrCode(""));
  }, [access.destinationUrl]);

  const message = [
    `Olá ${access.recipientName},`,
    "",
    "Bem-vindo à LUMAC Transportes & Logística. Estamos prontos para trabalhar consigo.",
    "Abaixo seguem os seus dados de acesso:",
    `${idLabel}: ${access.email}`,
    access.password ? `${secretLabel}: ${access.password}` : null,
    `${access.destinationLabel}: ${access.destinationUrl}`,
    "",
    access.password && changeable
      ? "Por segurança, altere a senha depois do primeiro acesso."
      : null,
  ].filter(Boolean).join("\n");

  function openWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  async function downloadPdf() {
    const [{ jsPDF }, generatedQr] = await Promise.all([
      import("jspdf"),
      qrCode ? Promise.resolve(qrCode) : QRCode.toDataURL(access.destinationUrl, { width: 500, margin: 1 }),
    ]);
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    await addPdfHeader(pdf, access.documentTitle, "Credenciais e instruções de acesso");
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Olá, ${access.recipientName}!`, 18, 50);
    pdf.setFont("helvetica", "normal");
    pdf.text("Bem-vindo à LUMAC. Estamos prontos para trabalhar consigo.", 18, 58);
    pdf.text(`${idLabel}: ${access.email}`, 18, 69);
    if (access.password) pdf.text(`${secretLabel}: ${access.password}`, 18, 77);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Como aceder", 18, 91);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("1. Leia o QR Code com a câmara do telemóvel ou abra o endereço indicado.", 18, 101);
    pdf.text(
      `2. Introduza o ${idLabel.toLowerCase()} e ${secretLabel.toLowerCase()} apresentados neste documento.`,
      18,
      108,
    );
    pdf.text(
      changeable
        ? "3. Altere a senha depois do primeiro acesso e não partilhe este documento."
        : "3. Guarde estes dados em segurança e não partilhe este documento.",
      18,
      115,
    );
    pdf.addImage(generatedQr, "PNG", 18, 127, 48, 48);
    pdf.setFont("helvetica", "bold");
    pdf.text(access.destinationLabel, 74, 139);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(30, 80, 171);
    pdf.text(pdf.splitTextToSize(access.destinationUrl, 112), 74, 147);
    addPdfFooter(pdf, "Documento processado por computador. Não requer assinatura.");
    pdf.save(`acesso-${safeName(access.recipientName)}.pdf`);
  }

  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
      <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Acesso criado com sucesso</h3>
      <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
        Envie agora as credenciais. {secretLabel} não ficará disponível depois de fechar.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
        <dl className="overflow-hidden rounded-md border border-emerald-200 bg-white text-sm dark:border-emerald-900 dark:bg-slate-900">
          <AccessRow label={idLabel} value={access.email} />
          {access.password ? <AccessRow label={secretLabel} value={access.password} /> : null}
          <AccessRow label={access.destinationLabel} value={access.destinationUrl} />
        </dl>
        <div className="grid size-28 place-items-center rounded-md border border-emerald-200 bg-white p-2 dark:border-emerald-900">
          {qrCode ? <Image src={qrCode} width={112} height={112} unoptimized alt={`QR Code para ${access.destinationLabel}`} className="size-full" /> : <QrCode className="size-10 text-slate-400" />}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <PrimaryButton icon={<MessageCircle className="size-4" />} onClick={openWhatsApp}>Enviar por WhatsApp</PrimaryButton>
        <ActionButton icon={<Download className="size-4" />} onClick={() => void downloadPdf()}>Baixar PDF</ActionButton>
      </div>
    </section>
  );
}

function AccessRow({ label, value }: { label: string; value: string }) {
  return <div className="grid border-b border-emerald-100 last:border-0 sm:grid-cols-[9rem_1fr] dark:border-emerald-950"><dt className="bg-emerald-50 px-3 py-2 font-medium text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">{label}</dt><dd className="break-all px-3 py-2 text-slate-900 dark:text-slate-100">{value}</dd></div>;
}

function safeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}
