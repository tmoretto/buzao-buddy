"use client";

import { useState, useEffect, useMemo } from "react";
import type { Parada, Posicao, VeiculoPosicao } from "@/lib/types";
import { haversineDistance } from "@/lib/geo";
import { fetchJsonOrThrow } from "@/lib/http";

const RADIUS_M = 2000;

// Nearest-neighbor sort to approximate route order
function sortStopsAsRoute(stops: Parada[], anchorLat: number, anchorLng: number): Parada[] {
  if (stops.length === 0) return [];
  const remaining = [...stops];

  // Start from the stop closest to the user
  let anchorIdx = 0;
  let minDist = Infinity;
  remaining.forEach((s, i) => {
    const d = haversineDistance(anchorLat, anchorLng, s.py, s.px);
    if (d < minDist) { minDist = d; anchorIdx = i; }
  });

  const ordered: Parada[] = [remaining.splice(anchorIdx, 1)[0]];

  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    remaining.forEach((s, i) => {
      const d = haversineDistance(last.py, last.px, s.py, s.px);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    });
    ordered.push(remaining.splice(nearestIdx, 1)[0]);
  }

  return ordered;
}

export interface BusRouteData {
  stops: Parada[];           // all stops, route-ordered
  stopsNearby: Parada[];     // stops within 2km of user
  vehicles: VeiculoPosicao[];
  loading: boolean;
  error: string | null;
}

export function useBusRoute(cl: number, userLat: number, userLng: number): BusRouteData {
  const [rawStops, setRawStops] = useState<Parada[]>([]);
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setRawStops([]);
    setPosicao(null);

    const controller = new AbortController();

    Promise.all([
      fetchJsonOrThrow<Parada[]>(`/api/sptrans/stops/line?cl=${cl}`, {
        signal: controller.signal,
      }),
      fetchJsonOrThrow<Posicao>(`/api/sptrans/positions/line?cl=${cl}`, {
        signal: controller.signal,
      }),
    ])
      .then(([stopsData, posicaoData]) => {
        setRawStops(Array.isArray(stopsData) ? stopsData : []);
        setPosicao(posicaoData ?? null);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [cl]);

  const stops = useMemo(
    () => sortStopsAsRoute(rawStops, userLat, userLng),
    [rawStops, userLat, userLng]
  );

  const stopsNearby = useMemo(
    () => stops.filter((s) => haversineDistance(userLat, userLng, s.py, s.px) <= RADIUS_M),
    [stops, userLat, userLng]
  );

  // Flatten vehicles from all line entries in the response
  const vehicles = useMemo(
    () => (posicao?.l ?? []).flatMap((l) => l.vs ?? []),
    [posicao]
  );

  return { stops, stopsNearby, vehicles, loading, error };
}
