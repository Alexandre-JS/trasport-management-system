import type { TripStatus } from "@/types/trip";
import { findPlace } from "@/src/shared/data/places";

export type TripGeoBorder = {
  arrivedAt: string | null;
  clearedAt: string | null;
  border: {
    name: string;
    /** Decimal serialised as string by the API. */
    lat: string | null;
    lng: string | null;
  };
};

export type TripGeoInput = {
  currentStatus: TripStatus;
  borders: TripGeoBorder[];
  origin: string;
  destination: string;
};

export type LatLng = { lat: number; lng: number };

function midpoint(a: LatLng, b: LatLng): LatLng {
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
}

/**
 * Coordinates of a crossing: the border post's own coordinates when
 * registered, otherwise a known place matching its name (or the first
 * segment of a "Machipanda / Forbes" style name).
 */
function borderPoint(crossing: TripGeoBorder): LatLng | undefined {
  const { lat, lng, name } = crossing.border;
  if (lat && lng) {
    return { lat: Number(lat), lng: Number(lng) };
  }
  const place = findPlace(name) ?? findPlace(name.split(" / ")[0]);
  return place ? { lat: place.lat, lng: place.lng } : undefined;
}

/**
 * Estimate a trip's position along the corridor from its origin, border
 * crossings and destination, and its current status. Returns null when
 * origin/destination can't be geocoded.
 */
export function estimateTripPosition(trip: TripGeoInput): LatLng | null {
  const originPlace = findPlace(trip.origin);
  const destinationPlace = findPlace(trip.destination);
  if (!originPlace || !destinationPlace) return null;
  const origin = { lat: originPlace.lat, lng: originPlace.lng };
  const destination = { lat: destinationPlace.lat, lng: destinationPlace.lng };

  const points = trip.borders.map(borderPoint);
  // The crossing the trip still has to clear; -1 when all are cleared.
  const activeIndex = trip.borders.findIndex((crossing) => !crossing.clearedAt);

  switch (trip.currentStatus) {
    case "WAITING_APPOINTMENT":
    case "APPOINTMENT_DONE":
    case "LOADED":
    case "CANCELLED":
      return origin;
    case "DISPATCHED_ORIGIN":
      return midpoint(origin, points[0] ?? destination);
    case "AT_BORDER":
      return (
        (activeIndex >= 0 ? points[activeIndex] : undefined) ??
        midpoint(origin, destination)
      );
    case "BORDER_CLEARED": {
      // Between the last cleared crossing and the next node of the route.
      const lastClearedIndex =
        activeIndex === -1 ? trip.borders.length - 1 : activeIndex - 1;
      const from =
        (lastClearedIndex >= 0 ? points[lastClearedIndex] : undefined) ??
        origin;
      const to =
        (activeIndex >= 0 ? points[activeIndex] : undefined) ?? destination;
      return midpoint(from, to);
    }
    case "ARRIVED":
    case "DISCHARGED":
      return destination;
    default:
      return origin;
  }
}

/** Ordered route nodes (origin → borders → destination) as [lat, lng] pairs. */
export function tripRoute(trip: TripGeoInput): [number, number][] {
  const originPlace = findPlace(trip.origin);
  const destinationPlace = findPlace(trip.destination);
  if (!originPlace || !destinationPlace) return [];
  const nodes: LatLng[] = [
    { lat: originPlace.lat, lng: originPlace.lng },
    ...trip.borders
      .map(borderPoint)
      .filter((point): point is LatLng => Boolean(point)),
    { lat: destinationPlace.lat, lng: destinationPlace.lng },
  ];
  return nodes.map((point) => [point.lat, point.lng]);
}
