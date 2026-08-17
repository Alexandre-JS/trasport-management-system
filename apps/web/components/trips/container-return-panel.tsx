"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  PackageCheck,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { PrimaryButton } from "@/src/shared/components/action-button";
import {
  confirmContainerReturn,
  getContainerReturn,
  startContainerReturn,
} from "@/services/container-returns-service";
import { extractErrorMessage } from "@/services/http";
import { useToast } from "@/providers/toast-provider";
import type { TripStatus } from "@/types/trip";
import { formatDateTime } from "@/utils/format";
import { openAttachment } from "@/src/shared/utils/open-attachment";

const RETURN_STATUSES: TripStatus[] = [
  "DISCHARGED",
  "CONTAINER_RETURN_PENDING",
  "CONTAINER_RETURNED",
];
const MAX_FILE_SIZE = 1024 * 1024;

/**
 * Mostra ao despachante a devolução do container de uma viagem, com o POD
 * que o motorista anexou. Só aparece em viagens de carga container que já
 * entraram no fluxo de devolução.
 */
export function ContainerReturnPanel({
  tripId,
  status,
  cargoType,
}: {
  tripId: string;
  status: TripStatus;
  cargoType: "CONTAINER" | "GRANEL" | "GERAL";
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [returnedTo, setReturnedTo] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [observations, setObservations] = useState("");
  const [podDocument, setPodDocument] = useState("");
  const [fileName, setFileName] = useState("");
  const [localStatus, setLocalStatus] = useState<TripStatus | null>(null);
  const effectiveStatus = localStatus ?? status;
  const enabled =
    cargoType === "CONTAINER" && RETURN_STATUSES.includes(effectiveStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["container-return", tripId],
    queryFn: () => getContainerReturn(tripId),
    enabled,
  });
  const confirmReturn = useMutation({
    mutationFn: () =>
      confirmContainerReturn(tripId, {
        returnedTo: returnedTo.trim() || undefined,
        receiverName: receiverName.trim() || undefined,
        observations: observations.trim() || undefined,
        podDocument,
      }),
    onSuccess: () => {
      setLocalStatus("CONTAINER_RETURNED");
      toast({ title: "Container return confirmed and POD saved", type: "success" });
      void queryClient.invalidateQueries({ queryKey: ["container-return", tripId] });
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (error) =>
      toast({
        title: "Could not confirm the container return",
        description: extractErrorMessage(error),
        type: "error",
      }),
  });
  const startReturn = useMutation({
    mutationFn: () => startContainerReturn(tripId),
    onSuccess: () => {
      setLocalStatus("CONTAINER_RETURN_PENDING");
      toast({ title: "Container return started", type: "success" });
      void queryClient.invalidateQueries({ queryKey: ["container-return", tripId] });
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
      void queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (error) =>
      toast({
        title: "Unable to start the container return",
        description: extractErrorMessage(error),
        type: "error",
      }),
  });

  async function selectFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File is too large",
        description: "The POD must be no larger than 1 MB.",
        type: "warning",
      });
      return;
    }

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast({
        title: "Unsupported file format",
        description: "Select an image or PDF document.",
        type: "warning",
      });
      return;
    }

    try {
      setPodDocument(await fileToDataUrl(file));
      setFileName(file.name);
    } catch {
      toast({
        title: "Could not read the file",
        description: "Select the POD file again.",
        type: "error",
      });
    }
  }

  if (!enabled) {
    return null;
  }

  if (effectiveStatus === "DISCHARGED") {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
          Empty container return
        </h3>
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
          This container cargo has been discharged. Attach the Delivery POD,
          then start the empty container return process.
        </p>
        <PrimaryButton
          onClick={() => startReturn.mutate()}
          loading={startReturn.isPending}
          className="mt-3"
        >
          Start container return
        </PrimaryButton>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
            <PackageCheck className="size-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Container return
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Receipt details and return POD
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            effectiveStatus === "CONTAINER_RETURN_PENDING"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          }`}
        >
          {effectiveStatus === "CONTAINER_RETURN_PENDING" ? (
            <Clock3 className="size-3.5" aria-hidden />
          ) : (
            <CheckCircle2 className="size-3.5" aria-hidden />
          )}
          {effectiveStatus === "CONTAINER_RETURN_PENDING" ? "Pending" : "Returned"}
        </span>
      </div>

      {effectiveStatus === "CONTAINER_RETURN_PENDING" ? (
        <div className="flex flex-col gap-5 p-4">
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            The container has been discharged. Confirm the return and attach the POD when the depot receives it.
          </p>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Receipt details
            </h4>
            <div className="grid overflow-hidden rounded-md border border-slate-200 sm:grid-cols-2 dark:border-slate-700">
              <div className="border-b border-slate-200 p-3 sm:border-b-0 sm:border-r dark:border-slate-700">
                <Field label="Returned to" value={returnedTo} onChange={setReturnedTo} />
              </div>
              <div className="p-3">
                <Field label="Received by" value={receiverName} onChange={setReceiverName} />
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Remark
            </h4>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Remark / Notes</span>
              <textarea
                value={observations}
                onChange={(event) => setObservations(event.target.value)}
                rows={2}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Return POD
            </h4>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-300 bg-brand-50/60 p-4 transition hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-950/20 dark:hover:bg-brand-950/40">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-brand-600 shadow-sm dark:bg-slate-900 dark:text-brand-300">
              <Upload className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {fileName || "Attach return POD"}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                Image or PDF · maximum 1 MB
              </span>
            </span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              onChange={(event) => void selectFile(event.target.files?.[0])}
            />
            </label>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A POD is required to complete the return.
            </p>
            <PrimaryButton
              onClick={() => confirmReturn.mutate()}
              loading={confirmReturn.isPending}
              disabled={!podDocument}
            >
              Confirm return
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="p-4">
          {isLoading ? (
            <div className="h-40 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
          ) : (
          <dl className="overflow-hidden rounded-md border border-slate-300 dark:border-slate-700">
            <div className="grid grid-cols-[minmax(9rem,32%)_1fr] border-b border-slate-300 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <dt className="border-r border-slate-300 px-3 py-2 dark:border-slate-700">Field</dt>
              <dd className="px-3 py-2">Value</dd>
            </div>
            <Row label="Status" value="Container returned" />
            <Row label="Returned to" value={data?.returnedTo ?? "—"} />
            <Row label="Received by" value={data?.receiverName ?? "—"} />
            <Row
              label="Return date"
              value={data?.returnedAt ? formatDateTime(data.returnedAt) : "—"}
            />
            <Row label="Remark" value={data?.observations ?? "—"} />
            <div className="grid border-b border-slate-200 last:border-b-0 sm:grid-cols-[minmax(9rem,32%)_1fr] dark:border-slate-800">
              <dt className="bg-slate-50 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                Return POD
              </dt>
              <dd className="min-w-0 px-3 py-3 text-sm">
              {data?.podDocument ? (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      openAttachment(data.podDocument as string);
                    } catch {
                      toast({
                        title: "Unable to open the POD",
                        description: "The stored document is invalid. Replace it and try again.",
                        type: "error",
                      });
                    }
                  }}
                  className="group flex max-w-md items-center gap-3 rounded-lg border border-brand-100 bg-brand-50/70 p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-brand-900 dark:bg-brand-950/30 dark:hover:border-brand-700 dark:hover:bg-brand-950/50"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white text-brand-600 shadow-sm ring-1 ring-brand-100 dark:bg-slate-900 dark:text-brand-300 dark:ring-brand-900">
                    <FileText className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                      {attachmentName(data.podDocument)}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                      Return POD · open in a new window
                    </span>
                  </span>
                  <ExternalLink className="size-4 shrink-0 text-brand-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:text-brand-300" aria-hidden />
                </button>
              ) : (
                <span className="flex max-w-md items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white dark:bg-slate-800">
                    <FileText className="size-5" aria-hidden />
                  </span>
                  No return POD has been attached.
                </span>
              )}
              </dd>
            </div>
          </dl>
          )}
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </label>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function attachmentName(url: string) {
  if (url.startsWith("data:")) {
    if (url.startsWith("data:application/pdf")) return "Return POD.pdf";
    return "Return POD (image)";
  }

  try {
    const pathname = new URL(url, "http://localhost").pathname;
    const name = pathname.split("/").filter(Boolean).at(-1);
    return name ? decodeURIComponent(name) : "Return POD";
  } catch {
    return "Return POD";
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid border-b border-slate-200 last:border-b-0 sm:grid-cols-[minmax(9rem,32%)_1fr] dark:border-slate-800">
      <dt className="bg-slate-50 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0 break-words px-3 py-3 text-sm text-slate-900 dark:text-white">{value}</dd>
    </div>
  );
}
