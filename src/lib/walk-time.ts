const WALKING_SPEED_MPM = 75; // meters per minute ≈ 4.5 km/h
const STREET_CROSSING_BUFFER = 1; // minutes

export function walkingMinutes(distanceMeters: number): number {
  return distanceMeters / WALKING_SPEED_MPM + STREET_CROSSING_BUFFER;
}

export function formatWalkTime(distanceMeters: number): string {
  const min = Math.round(walkingMinutes(distanceMeters));
  return `~${min} min caminhando`;
}
