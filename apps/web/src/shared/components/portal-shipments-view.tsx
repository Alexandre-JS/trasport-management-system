"use client";

import { ArrowRight, MapPin, PackageSearch } from "lucide-react";
import Link from "next/link";
import { ErrorState } from "@/src/shared/components/error-state";
import { PageLoader } from "@/src/shared/components/page-loader";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { useMyShipments } from "@/hooks/use-portal";
import { formatDate } from "@/utils/format";
import { tripStatusBadgeTone, tripStatusMeta } from "@/utils/trip-status";

export function PortalShipmentsView() {
  const { data, isLoading, isError, refetch } = useMyShipments();
  const shipments = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">
          As minhas cargas
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Acompanhe o estado e a localização das suas cargas em tempo real.
        </p>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar as suas cargas"
          onAction={() => void refetch()}
        />
      ) : shipments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <PackageSearch
            className="mx-auto size-8 text-slate-400"
            aria-hidden
          />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Ainda não há cargas associadas à sua conta.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {shipments.map((shipment) => (
            <Link
              key={shipment.id}
              href={`/portal/${shipment.id}`}
              className="group flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {shipment.cargo.code}
                  </p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                    {shipment.cargo.description ?? "Carga"}
                  </p>
                </div>
                <StatusBadge tone={tripStatusBadgeTone[shipment.currentStatus]}>
                  {tripStatusMeta[shipment.currentStatus].label}
                </StatusBadge>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300">
                {shipment.cargo.origin} → {shipment.cargo.destination}
              </p>

              {shipment.currentPosition ? (
                <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="size-4 shrink-0" aria-hidden />
                  {shipment.currentPosition}
                </p>
              ) : null}

              <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span>
                  Chegada prevista: {formatDate(shipment.arrivalEstimate)}
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-brand-600 group-hover:gap-1.5 dark:text-brand-400">
                  Ver detalhe
                  <ArrowRight className="size-3.5" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
