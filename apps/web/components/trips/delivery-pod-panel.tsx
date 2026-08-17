"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileText, Upload } from "lucide-react";
import { useState } from "react";
import { PrimaryButton } from "@/src/shared/components/action-button";
import {
  attachDeliveryPod,
  getDeliveryByTrip,
} from "@/services/delivery-service";
import { extractErrorMessage } from "@/services/http";
import { useToast } from "@/providers/toast-provider";
import type { TripStatus } from "@/types/trip";

const ENABLED_STATUSES: TripStatus[] = [
  "DISCHARGED",
  "CONTAINER_RETURN_PENDING",
  "CONTAINER_RETURNED",
];
const MAX_FILE_SIZE = 1024 * 1024;

export function DeliveryPodPanel({
  tripId,
  status,
}: {
  tripId: string;
  status: TripStatus;
}) {
  const enabled = ENABLED_STATUSES.includes(status);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [document, setDocument] = useState("");
  const [fileName, setFileName] = useState("");
  const queryKey = ["delivery-pod", tripId];
  const delivery = useQuery({
    queryKey,
    queryFn: () => getDeliveryByTrip(tripId),
    enabled,
  });
  const upload = useMutation({
    mutationFn: () => attachDeliveryPod(tripId, document),
    onSuccess: () => {
      toast({ title: "Delivery POD saved", type: "success" });
      setDocument("");
      setFileName("");
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) =>
      toast({
        title: "Unable to save the delivery POD",
        description: extractErrorMessage(error),
        type: "error",
      }),
  });

  async function selectFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File is too large",
        description: "Select an image or PDF up to 1 MB.",
        type: "warning",
      });
      return;
    }
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast({
        title: "Unsupported file",
        description: "Select an image or PDF document.",
        type: "warning",
      });
      return;
    }

    setDocument(await fileToDataUrl(file));
    setFileName(file.name);
  }

  if (!enabled) return null;

  if (delivery.isLoading) {
    return (
      <div className="h-28 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
    );
  }

  if (delivery.isError) {
    return (
      <section className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
        <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-100">
          Unable to load the delivery POD
        </h3>
        <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
          {extractErrorMessage(delivery.error)}
        </p>
        <button
          type="button"
          onClick={() => void delivery.refetch()}
          className="mt-2 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          Try again
        </button>
      </section>
    );
  }

  const savedPod = delivery.data?.podDocument;

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Delivery POD
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Required after discharge. Upload an image or PDF up to 1 MB.
          </p>
        </div>
        {savedPod ? (
          <a
            href={savedPod}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            <FileText className="size-4" aria-hidden />
            View current POD
            <ExternalLink className="size-3" aria-hidden />
          </a>
        ) : (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            POD missing
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md border border-dashed border-brand-300 bg-white px-3 py-3 dark:border-brand-800 dark:bg-slate-900">
          <Upload className="size-5 shrink-0 text-brand-600" aria-hidden />
          <span className="truncate text-sm text-slate-700 dark:text-slate-200">
            {fileName || (savedPod ? "Select a replacement POD" : "Select POD")}
          </span>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={(event) => void selectFile(event.target.files?.[0])}
          />
        </label>
        <PrimaryButton
          onClick={() => upload.mutate()}
          loading={upload.isPending}
          disabled={!document}
        >
          {savedPod ? "Replace POD" : "Upload POD"}
        </PrimaryButton>
      </div>
    </section>
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
