"use client";

import { Modal } from "@/components/ui/modal";
import { ContainerReturnPanel } from "@/components/trips/container-return-panel";
import { DeliveryPodPanel } from "@/components/trips/delivery-pod-panel";
import type { Trip } from "@/types/trip";

export function TripDocumentsModal({
  trip,
  onClose,
}: {
  trip: Trip | null;
  onClose: () => void;
}) {
  if (!trip) return null;

  return (
    <Modal
      open
      size="lg"
      title="POD and container return"
      description={`${trip.bookingReference ?? trip.cargo.code} · ${trip.cargo.origin} → ${trip.cargo.destination}`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <DeliveryPodPanel tripId={trip.id} status={trip.currentStatus} />
        <ContainerReturnPanel
          tripId={trip.id}
          status={trip.currentStatus}
          cargoType={trip.cargo.type}
        />
      </div>
    </Modal>
  );
}
