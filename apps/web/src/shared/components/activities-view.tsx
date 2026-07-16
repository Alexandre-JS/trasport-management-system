"use client";

import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ClipboardList,
  FileDown,
  FileSpreadsheet,
  Printer,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/src/shared/components/page-header";
import { PrintOperationalTableDocument } from "@/src/shared/components/print-operational-table-document";
import { ActionButton } from "@/src/shared/components/action-button";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { CargoShareCell } from "@/src/shared/components/cargo-share-cell";
import { useActivities } from "@/hooks/use-activities";
import { useTrips, useUpdateTripStatus } from "@/hooks/use-trips";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import { exportToCsv } from "@/utils/export-csv";
import {
  addPdfFooter,
  addPdfHeader,
  PDF_MARGIN,
} from "@/src/shared/utils/pdf-branding";
import type { ActivitySheet, Trip } from "@/types/trip";
import { formatDate } from "@/utils/format";
import {
  isTerminalTripStatus,
  nextTripStatus,
  tripStatusBadgeTone,
  tripStatusMeta,
} from "@/utils/trip-status";

// Página de acompanhamento: reutiliza a rota /viagens. Lista as "folhas"
// (cliente + rota + dia) e, ao abrir uma, mostra a grelha do quadro em
// modo só-leitura — só o ESTADO é editável (por quem tiver trips:manage).

export function ActivitiesView() {
  const [sheet, setSheet] = useState<ActivitySheet | null>(null);

  if (sheet) {
    return <SheetTracking sheet={sheet} onBack={() => setSheet(null)} />;
  }
  return <ActivitiesList onOpen={setSheet} />;
}

function ActivitiesList({ onOpen }: { onOpen: (s: ActivitySheet) => void }) {
  const { data, isLoading, isError, refetch, isFetching } = useActivities();
  const sheets = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Atividades"
        description="Cada folha reúne as cargas de um cliente e rota registadas no mesmo dia. Abra para acompanhar o progresso reportado pelos motoristas."
        secondaryActions={
          <ActionButton
            icon={<RefreshCw className="size-4" />}
            onClick={() => void refetch()}
          >
            Atualizar
          </ActionButton>
        }
      />

      {isLoading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">A carregar…</p>
      ) : isError ? (
        <div className="flex flex-col items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            Não foi possível carregar as atividades.
          </p>
          <ActionButton onClick={() => void refetch()}>Tentar de novo</ActionButton>
        </div>
      ) : sheets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <ClipboardList className="mx-auto size-8 text-slate-400" aria-hidden />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Ainda não há atividades. Registe viagens no Quadro Operacional.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-[13px] leading-4 tabular-nums [&_td]:!px-2.5 [&_td]:!py-1.5 [&_th]:!px-2.5 [&_th]:!py-2">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  {[
                    "Cliente",
                    "Rota",
                    "Data",
                    "Cargas",
                    "Entregues",
                    "Progresso",
                    "",
                  ].map((header) => (
                    <th
                      key={header || "action"}
                      className="whitespace-nowrap border-b border-r border-slate-300 px-3 py-2.5 last:border-r-0 dark:border-slate-700"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheets.map((s) => {
                  const key = `${s.clientId}-${s.origin}-${s.destination}-${s.day}`;
                  const pct = s.total
                    ? Math.round((s.delivered / s.total) * 100)
                    : 0;
                  return (
                    <tr
                      key={key}
                      onClick={() => onOpen(s)}
                      className="cursor-pointer odd:bg-white even:bg-slate-50/60 hover:bg-brand-50/70 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 dark:hover:bg-brand-950/30"
                    >
                      <td className="border-b border-r border-slate-200 px-3 py-3 font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
                        {s.clientName}
                      </td>
                      <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        {s.origin} → {s.destination}
                      </td>
                      <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        {formatDate(s.day)}
                      </td>
                      <td className="border-b border-r border-slate-200 px-3 py-3 text-center text-slate-700 dark:border-slate-800 dark:text-slate-200">
                        {s.total}
                      </td>
                      <td className="border-b border-r border-slate-200 px-3 py-3 text-center text-slate-700 dark:border-slate-800 dark:text-slate-200">
                        {s.delivered}
                      </td>
                      <td className="border-b border-r border-slate-200 px-3 py-3 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-800">
                        <span className="inline-flex items-center gap-1 font-medium text-brand-600 dark:text-brand-400">
                          Abrir
                          <ChevronRight className="size-4" aria-hidden />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {isFetching && !isLoading ? (
        <p className="text-xs text-slate-400">A atualizar…</p>
      ) : null}
    </div>
  );
}

const HEADERS = [
  "Nu.",
  "Booking",
  "Horse",
  "Trailer",
  "Driver Name",
  "Border",
  "Ton",
  "Dispatched From Beira",
  "GMS Dispatch Date",
  "Arrive Date",
  "Discharge Date",
  "Current Position",
  "Estado",
  "Partilhar",
];

function SheetTracking({
  sheet,
  onBack,
}: {
  sheet: ActivitySheet;
  onBack: () => void;
}) {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canEditState = hasPermission("trips:manage");
  const updateStatus = useUpdateTripStatus();

  const { data, isLoading, refetch } = useTrips({
    clientId: sheet.clientId,
    origin: sheet.origin,
    destination: sheet.destination,
    day: sheet.day,
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "asc",
  });
  const trips = useMemo(() => data?.data ?? [], [data]);

  const sheetTitle = `${sheet.clientName} · ${sheet.origin} → ${sheet.destination} · ${formatDate(sheet.day)}`;

  // Linhas na linguagem da folha, partilhadas por CSV e PDF.
  const rows = useMemo(
    () =>
      trips.map((trip, index) => [
        String(index + 1),
        trip.bookingReference ?? trip.cargo.code,
        trip.horsePlate ?? trip.truck?.plateNumber ?? "—",
        trip.trailerPlate ?? trip.trailer?.plateNumber ?? "—",
        trip.driverName ?? trip.driver?.fullName ?? "—",
        trip.borders.map((b) => b.border.name).join(" › ") || "—",
        trip.tonnage ? `${trip.tonnage} t` : "—",
        formatDate(trip.departureDate),
        formatDate(trip.arrivalDate),
        formatDate(trip.dischargeDate),
        trip.currentPosition ?? "—",
        tripStatusMeta[trip.currentStatus].label,
      ]),
    [trips],
  );

  const columns = [
    "Nu.",
    "Booking",
    "Horse",
    "Trailer",
    "Driver Name",
    "Border",
    "Ton",
    "Dispatch",
    "Arrive",
    "Discharge",
    "Current Position",
    "Estado",
  ];

  function exportExcel() {
    exportToCsv(
      `folha-${sheet.clientName}-${sheet.day}.csv`,
      rows,
      columns.map((header, index) => ({
        header,
        value: (row: string[]) => row[index],
      })),
    );
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
    await addPdfHeader(pdf, "Quadro Operacional", sheetTitle);

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const left = PDF_MARGIN;
    const usableW = pageW - PDF_MARGIN * 2;

    // Pesos relativos por coluna → a tabela preenche toda a largura útil.
    const weights = [3.5, 9, 8, 8, 13, 8.5, 4.5, 7.5, 7.5, 7.5, 15, 8];
    const totalW = weights.reduce((a, b) => a + b, 0);
    const widths = weights.map((w) => (w / totalW) * usableW);
    // Nº, Ton, datas e Estado centrados; texto alinhado à esquerda.
    const centered = [
      true, false, false, false, false, false,
      true, true, true, true, false, true,
    ];

    const padH = 1.2;
    const padV = 1;
    const lineH = 2.8;
    const maxLines = 2;
    const top = 44;
    const bottom = pageH - 28;
    let y = top;

    pdf.setFontSize(6.5);

    const wrap = (cell: string, i: number): string[] => {
      const lines = pdf.splitTextToSize(
        String(cell ?? ""),
        widths[i] - padH * 2,
      ) as string[];
      if (lines.length <= maxLines) return lines.length ? lines : [""];
      const clipped = lines.slice(0, maxLines);
      clipped[maxLines - 1] = `${clipped[maxLines - 1].replace(/\s*\S*$/, "")}…`;
      return clipped;
    };

    const drawRow = (cells: string[], head: boolean) => {
      const wrapped = cells.map((c, i) => wrap(c, i));
      const nLines = Math.max(1, ...wrapped.map((l) => l.length));
      const h = nLines * lineH + padV * 2;
      const rowTop = y;

      if (head) {
        pdf.setFillColor(241, 245, 249);
        pdf.rect(left, rowTop, usableW, h, "F");
      }

      pdf.setFont("helvetica", head ? "bold" : "normal");
      pdf.setTextColor(head ? 51 : 30, head ? 65 : 41, head ? 85 : 59);

      let x = left;
      wrapped.forEach((lines, i) => {
        lines.forEach((ln, li) => {
          const ty = rowTop + padV + lineH * (li + 1) - 0.9;
          if (centered[i]) {
            pdf.text(ln, x + widths[i] / 2, ty, { align: "center" });
          } else {
            pdf.text(ln, x + padH, ty, { align: "left" });
          }
        });
        x += widths[i];
      });

      pdf.setDrawColor(head ? 100 : 226, head ? 116 : 232, head ? 139 : 240);
      pdf.setLineWidth(head ? 0.2 : 0.1);
      pdf.line(left, rowTop + h, left + usableW, rowTop + h);

      y += h;
    };

    drawRow(columns, true);
    rows.forEach((row) => {
      const probe = row.map((c, i) =>
        (pdf.splitTextToSize(String(c ?? ""), widths[i] - padH * 2) as string[])
          .slice(0, maxLines),
      );
      const nLines = Math.max(1, ...probe.map((l) => l.length));
      const h = nLines * lineH + padV * 2;
      if (y + h > bottom) {
        pdf.addPage();
        y = top;
        drawRow(columns, true);
      }
      drawRow(row, false);
    });

    // Moldura à volta de toda a tabela.
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.line(left, top, left + usableW, top);

    addPdfFooter(pdf, `${sheet.total} cargas · gerado pelo SGRTC`);
    pdf.save(`folha-${sheet.clientName}-${sheet.day}.pdf`);
  }

  function advance(trip: Trip) {
    const next = nextTripStatus(trip.currentStatus);
    if (!next) return;
    updateStatus.mutate(
      { id: trip.id, payload: { currentStatus: next } },
      {
        onSuccess: () => {
          toast({
            title: `Estado → ${tripStatusMeta[next].label}`,
            type: "success",
          });
          void refetch();
        },
        onError: (error) =>
          toast({
            title: "Não foi possível avançar o estado",
            description: extractErrorMessage(error),
            type: "error",
          }),
      },
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="size-4" aria-hidden /> Atividades
      </button>
      <PageHeader
        title={`${sheet.clientName} · ${sheet.origin} → ${sheet.destination}`}
        description={`Folha de ${formatDate(sheet.day)} · ${sheet.total} cargas · acompanhamento (só o estado é editável)`}
        showIdentity
        secondaryActions={
          <div className="flex flex-wrap gap-2" data-print-hide>
            <ActionButton
              icon={<Printer className="size-4" />}
              onClick={() => window.print()}
            >
              Imprimir
            </ActionButton>
            <ActionButton
              icon={<FileSpreadsheet className="size-4" />}
              onClick={exportExcel}
            >
              Excel
            </ActionButton>
            <ActionButton
              icon={<FileDown className="size-4" />}
              onClick={() => void exportPdf()}
            >
              PDF
            </ActionButton>
          </div>
        }
      />

      <div className="max-h-[calc(100vh-16rem)] overflow-auto rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <table className="min-w-[1650px] border-separate border-spacing-0 text-[11px] leading-4 tabular-nums [&_td]:!px-1.5 [&_td]:!py-1 [&_th]:!px-1.5 [&_th]:!py-1.5">
          <thead className="sticky top-0 z-20 bg-slate-100 text-left font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              {HEADERS.map((h, i) => (
                <th
                  key={h}
                  className={`whitespace-nowrap border-b border-r border-slate-300 px-3 py-2 dark:border-slate-700 ${i === 0 ? "sticky left-0 z-30 w-12 bg-slate-100 dark:bg-slate-800" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={HEADERS.length} className="px-3 py-6 text-center text-slate-500">
                  A carregar…
                </td>
              </tr>
            ) : (
              trips.map((trip, index) => {
                const next = nextTripStatus(trip.currentStatus);
                const terminal = isTerminalTripStatus(trip.currentStatus);
                return (
                  <tr
                    key={trip.id}
                    className="odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-900/70"
                  >
                    <Td sticky>{index + 1}</Td>
                    <Td>{trip.bookingReference ?? trip.cargo.code}</Td>
                    <Td mono>{trip.horsePlate ?? trip.truck?.plateNumber ?? "—"}</Td>
                    <Td mono>{trip.trailerPlate ?? trip.trailer?.plateNumber ?? "—"}</Td>
                    <Td>{trip.driverName ?? trip.driver?.fullName ?? "—"}</Td>
                    <Td>{trip.borders.map((b) => b.border.name).join(" › ") || "—"}</Td>
                    <Td>{trip.tonnage ? `${trip.tonnage} t` : "—"}</Td>
                    <Td>{trip.dispatchedBy ?? "—"}</Td>
                    <Td>{formatDate(trip.departureDate)}</Td>
                    <Td>{formatDate(trip.arrivalDate)}</Td>
                    <Td>{formatDate(trip.dischargeDate)}</Td>
                    <Td>{trip.currentPosition ?? "—"}</Td>
                    <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <StatusBadge tone={tripStatusBadgeTone[trip.currentStatus]}>
                          {tripStatusMeta[trip.currentStatus].label}
                        </StatusBadge>
                        {canEditState && !terminal && next ? (
                          <button
                            type="button"
                            onClick={() => advance(trip)}
                            disabled={updateStatus.isPending}
                            title={`Avançar para ${tripStatusMeta[next].label}`}
                            className="inline-flex items-center gap-1 rounded-md border border-brand-200 px-2 py-1 text-[11px] font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50 dark:border-brand-800 dark:text-brand-300"
                          >
                            {tripStatusMeta[next].label}
                            <ArrowRight className="size-3" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 dark:border-slate-800">
                      <CargoShareCell
                        token={trip.trackingToken}
                        label={trip.bookingReference ?? trip.cargo.code}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <PrintOperationalTableDocument
        title="Quadro operacional"
        subtitle={sheetTitle}
        columns={columns}
        rows={rows}
      />
    </div>
  );
}

function Td({
  children,
  sticky,
  mono,
}: {
  children: React.ReactNode;
  sticky?: boolean;
  mono?: boolean;
}) {
  return (
    <td
      className={`whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 text-slate-700 dark:border-slate-800 dark:text-slate-300 ${sticky ? "sticky left-0 z-10 w-12 bg-inherit text-center font-semibold" : ""} ${mono ? "font-mono" : ""}`}
    >
      {children}
    </td>
  );
}
