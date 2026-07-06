export type Place = {
  name: string;
  country: string;
  lat: number;
  lng: number;
  kind?: "city" | "port" | "border";
};

/**
 * Curated corridor of known places (Moçambique / Zâmbia / trânsito Zimbabué),
 * each with coordinates. Origin/destination are constrained to this list so
 * shipments are always geocodable — an arbitrary name would break map tracking.
 */
export const PLACES: Place[] = [
  // Moçambique — corredor da Beira
  { name: "Beira", country: "Moçambique", lat: -19.8436, lng: 34.8389, kind: "port" },
  { name: "Dondo", country: "Moçambique", lat: -19.6094, lng: 34.7431 },
  { name: "Nhamatanda", country: "Moçambique", lat: -19.2333, lng: 34.2333 },
  { name: "Inchope", country: "Moçambique", lat: -19.1522, lng: 33.8797 },
  { name: "Chimoio", country: "Moçambique", lat: -19.1164, lng: 33.4833 },
  { name: "Manica", country: "Moçambique", lat: -18.9367, lng: 32.8747 },
  { name: "Machipanda", country: "Moçambique", lat: -18.9333, lng: 32.8167, kind: "border" },
  { name: "Tete", country: "Moçambique", lat: -16.1564, lng: 33.5867 },
  { name: "Moatize", country: "Moçambique", lat: -16.1119, lng: 33.7267 },
  { name: "Changara", country: "Moçambique", lat: -16.75, lng: 33.28 },
  { name: "Zóbuè", country: "Moçambique", lat: -15.62, lng: 34.42, kind: "border" },
  { name: "Cassacatiza", country: "Moçambique", lat: -14.02, lng: 32.72, kind: "border" },
  // Moçambique — outras
  { name: "Maputo", country: "Moçambique", lat: -25.9692, lng: 32.5732 },
  { name: "Matola", country: "Moçambique", lat: -25.9622, lng: 32.4589 },
  { name: "Xai-Xai", country: "Moçambique", lat: -25.0519, lng: 33.6444 },
  { name: "Chókwè", country: "Moçambique", lat: -24.5333, lng: 32.9833 },
  { name: "Inhambane", country: "Moçambique", lat: -23.865, lng: 35.3833 },
  { name: "Quelimane", country: "Moçambique", lat: -17.8786, lng: 36.8883 },
  { name: "Nampula", country: "Moçambique", lat: -15.1165, lng: 39.2666 },
  { name: "Nacala", country: "Moçambique", lat: -14.5428, lng: 40.6728, kind: "port" },
  { name: "Pemba", country: "Moçambique", lat: -12.9741, lng: 40.5178 },
  { name: "Lichinga", country: "Moçambique", lat: -13.3128, lng: 35.2406 },
  // Zâmbia
  { name: "Lusaka", country: "Zâmbia", lat: -15.3875, lng: 28.3228 },
  { name: "Kabwe", country: "Zâmbia", lat: -14.4469, lng: 28.4464 },
  { name: "Chirundu", country: "Zâmbia", lat: -16.0333, lng: 28.85, kind: "border" },
  { name: "Chanida", country: "Zâmbia", lat: -14.05, lng: 32.75, kind: "border" },
  { name: "Chipata", country: "Zâmbia", lat: -13.6333, lng: 32.65 },
  { name: "Ndola", country: "Zâmbia", lat: -12.9587, lng: 28.6366 },
  { name: "Kitwe", country: "Zâmbia", lat: -12.8024, lng: 28.2132 },
  // Zimbabué (trânsito)
  { name: "Harare", country: "Zimbabué", lat: -17.8292, lng: 31.0522 },
  { name: "Mutare", country: "Zimbabué", lat: -18.9707, lng: 32.6709 },
];

export function findPlace(name: string): Place | undefined {
  const query = name.trim().toLowerCase();
  return PLACES.find((place) => place.name.toLowerCase() === query);
}

export function isKnownPlace(name: string): boolean {
  return Boolean(findPlace(name));
}

export function searchPlaces(query: string, limit = 8): Place[] {
  const value = query.trim().toLowerCase();
  const source = value
    ? PLACES.filter((place) => place.name.toLowerCase().includes(value))
    : PLACES;
  return source.slice(0, limit);
}
