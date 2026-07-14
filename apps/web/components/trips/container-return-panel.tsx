"use client";

import { useQuery } from "@tanstack/react-query";
import { PackageCheck } from "lucide-react";
import { getContainerReturn } from "@/services/container-returns-service";
import type { TripStatus } from "@/types/trip";
import { formatDateTime } from "@/utils/format";

const RETURN_STATUSES: TripStatus[] = [
  "CONTAINER_RETURN_PENDING",
  "CONTAINER_RETURNED",
];

/**
 * Mostra ao despachante a devolução do container de uma viagem, com o POD
 * que o motorista anexou. Só aparece em viagens de carga container que já
 * entraram no fluxo de devolução.
 */
export function ContainerReturnPanel({
  tripId,
  status,
}: {
  tripId: string;
  status: TripStatus;
}) {
  const enabled = RETURN_STATUSES.includes(status);

  const { data } = useQuery({
    queryKey: ["container-return", tripId],
    queryFn: () => getContainerReturn(tripId),
    enabled,
  });

  if (!enabled) {
    return null;
  }

  return (
    <section className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
      <div className="mb-3 flex items-center gap-2">
        <PackageCheck className="size-4 text-amber-600 dark:text-amber-400" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Devolução do container
        </h3>
      </div>

      {status === "CONTAINER_RETURN_PENDING" ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          O container foi descarregado e está a caminho do depósito. A
          devolução ainda não foi confirmada pelo motorista.
        </p>
      ) : (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Row label="Devolvido a" value={data?.returnedTo ?? "—"} />
          <Row label="Recebido por" value={data?.receiverName ?? "—"} />
          <Row
            label="Data da devolução"
            value={data?.returnedAt ? formatDateTime(data.returnedAt) : "—"}
          />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Comprovativo (POD)
            </dt>
            <dd className="mt-1 text-sm">
              {data?.podDocument ? (
                <a
                  href={data.podDocument}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-600 underline dark:text-brand-400"
                >
                  Ver documento
                </a>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">
                  Sem documento
                </span>
              )}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-900 dark:text-white">{value}</dd>
    </div>
  );
}
