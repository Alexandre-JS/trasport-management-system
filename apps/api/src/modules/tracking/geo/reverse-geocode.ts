import { MOZAMBIQUE_LOCALITIES, type Locality } from './mozambique-localities';

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Distância aproximada (km) entre dois pontos, fórmula de Haversine. */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(a));
}

export function nearestLocality(
  lat: number,
  lng: number,
): { locality: Locality; distanceKm: number } {
  let best = MOZAMBIQUE_LOCALITIES[0];
  let bestDist = Number.POSITIVE_INFINITY;

  for (const locality of MOZAMBIQUE_LOCALITIES) {
    const dist = haversineKm(lat, lng, locality.lat, locality.lng);
    if (dist < bestDist) {
      best = locality;
      bestDist = dist;
    }
  }

  return { locality: best, distanceKm: bestDist };
}

/**
 * Descreve um ponto GPS como texto legível para "Posição atual", com base na
 * localidade mais próxima. Ajusta o prefixo conforme a distância — em/perto/a
 * caminho de — para ser honesto sobre a aproximação nos corredores longos.
 */
export function describePosition(lat: number, lng: number): string {
  const { locality, distanceKm } = nearestLocality(lat, lng);

  if (distanceKm <= 12) {
    return locality.name;
  }
  if (distanceKm <= 80) {
    return `Perto de ${locality.name}`;
  }
  return `A caminho de ${locality.name}`;
}
