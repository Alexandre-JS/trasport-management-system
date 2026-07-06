import type { Border, TripStatus } from "@/types/trip";
import { borderLabel } from "@/utils/trip-status";
import { findPlace, type Place } from "@/src/shared/data/places";

export type TripGeoInput = {
  currentStatus: TripStatus;
  border: Border | null;
  origin: string;
  destination: string;
};

export type LatLng = { lat: number; lng: number };

function midpoint(a: Place, b: Place): LatLng {
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
}

function borderPlace(border: Border | null): Place | undefined {
  return border ? findPlace(borderLabel[border]) : undefined;
}

/**
 * Estimate a trip's position along the corridor from its origin, border and
 * destination (all known places with coordinates) and its current status.
 * Returns null when origin/destination can't be geocoded.
 */
export function estimateTripPosition(trip: TripGeoInput): LatLng | null {
  const origin = findPlace(trip.origin);
  const destination = findPlace(trip.destination);
  if (!origin || !destination) return null;
  const border = borderPlace(trip.border);

  switch (trip.currentStatus) {
    case "WAITING_APPOINTMENT":
    case "APPOINTMENT_DONE":
    case "LOADED":
    case "CANCELLED":
      return { lat: origin.lat, lng: origin.lng };
    case "DISPATCHED_ORIGIN":
      return midpoint(origin, border ?? destination);
    case "AT_BORDER":
    case "BORDER_CLEARED":
      return border
        ? { lat: border.lat, lng: border.lng }
        : midpoint(origin, destination);
    case "ARRIVED":
    case "DISCHARGED":
      return { lat: destination.lat, lng: destination.lng };
    default:
      return { lat: origin.lat, lng: origin.lng };
  }
}

/** Ordered route nodes (origin → border → destination) as [lat, lng] pairs. */
export function tripRoute(trip: TripGeoInput): [number, number][] {
  const origin = findPlace(trip.origin);
  const destination = findPlace(trip.destination);
  if (!origin || !destination) return [];
  const border = borderPlace(trip.border);
  const nodes = border ? [origin, border, destination] : [origin, destination];
  return nodes.map((place) => [place.lat, place.lng]);
}
