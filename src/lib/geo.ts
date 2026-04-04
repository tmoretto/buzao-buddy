import type { Parada, ParadaWithDistance } from "./types";

// Haversine distance in meters
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortStopsByDistance(
  stops: Parada[],
  userLat: number,
  userLng: number
): ParadaWithDistance[] {
  return stops
    .map((stop) => ({
      ...stop,
      distance: Math.round(haversineDistance(userLat, userLng, stop.py, stop.px)),
    }))
    .sort((a, b) => a.distance - b.distance);
}
