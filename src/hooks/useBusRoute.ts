"use client";

import { useState, useEffect, useMemo } from "react";
import type { Parada, PosicaoLinha, PrevisaoLinha, PrevisaoLinhaParada, VeiculoPosicao } from "@/lib/types";
import { haversineDistance } from "@/lib/geo";
import { fetchJsonOrThrow } from "@/lib/http";

const RADIUS_M = 2000;

// Nearest-neighbor sort to approximate route order
function sortStopsAsRoute(stops: Parada[], anchorLat: number, anchorLng: number): Parada[] {
  if (stops.length === 0) return [];
  const remaining = [...stops];

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

export interface StopWithPredictions extends Parada {
  distance: number;
  predictions: PrevisaoLinhaParada["vs"];
}

export interface BusRouteData {
  stops: Parada[];
  stopsNearby: Parada[];
  stopsWithPredictions: StopWithPredictions[];
  vehicles: VeiculoPosicao[];
  shape: [number, number][] | null; // GTFS polyline [lng, lat][]
  loading: boolean;
  error: string | null;
}

export function useBusRoute(cl: number, userLat: number, userLng: number, gtfsId?: string, sl?: number): BusRouteData {
  const [rawStops, setRawStops] = useState<Parada[]>([]);
  const [posicao, setPosicao] = useState<PosicaoLinha | null>(null);
  const [predictions, setPredictions] = useState<PrevisaoLinha | null>(null);
  const [shape, setShape] = useState<[number, number][] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setRawStops([]);
    setPosicao(null);
    setPredictions(null);
    setShape(null);

    const controller = new AbortController();

    Promise.all([
      fetchJsonOrThrow<Parada[]>(`/api/sptrans/stops/line?cl=${cl}`, {
        signal: controller.signal,
      }),
      fetchJsonOrThrow<PosicaoLinha>(`/api/sptrans/positions/line?cl=${cl}`, {
        signal: controller.signal,
      }),
      fetchJsonOrThrow<PrevisaoLinha>(`/api/sptrans/predictions/line?cl=${cl}`, {
        signal: controller.signal,
      }).catch(() => null),
    ])
      .then(([stopsData, posicaoData, predsData]) => {
        setRawStops(Array.isArray(stopsData) ? stopsData : []);
        setPosicao(posicaoData ?? null);
        setPredictions(predsData ?? null);
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

  // Fetch GTFS shape (non-blocking, separate from main data)
  useEffect(() => {
    if (!gtfsId) return;
    fetch(`/shapes/${gtfsId}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        // Olho Vivo sl=1 → GTFS direction_id=0, sl=2 → direction_id=1
        const dirId = sl === 2 ? "1" : "0";
        setShape(data[dirId] ?? data["0"] ?? data["1"] ?? null);
      })
      .catch(() => {});
  }, [gtfsId]);

  const stops = useMemo(
    () => sortStopsAsRoute(rawStops, userLat, userLng),
    [rawStops, userLat, userLng]
  );

  const stopsNearby = useMemo(
    () => stops.filter((s) => haversineDistance(userLat, userLng, s.py, s.px) <= RADIUS_M),
    [stops, userLat, userLng]
  );

  // Build stop predictions directly from the predictions endpoint data
  // (stop codes differ between /Parada/BuscarParadasPorLinha and /Previsao/Linha)
  // Show all stops with predictions sorted by distance — no radius filter
  const stopsWithPredictions = useMemo(() => {
    return (predictions?.ps ?? [])
      .map((ps) => {
        const dist = Math.round(haversineDistance(userLat, userLng, ps.py, ps.px));
        return {
          cp: ps.cp,
          np: ps.np,
          ed: "",
          py: ps.py,
          px: ps.px,
          distance: dist,
          predictions: ps.vs ?? [],
        } satisfies StopWithPredictions;
      })
      .filter((s) => s.predictions.length > 0)
      .sort((a, b) => a.distance - b.distance);
  }, [predictions, userLat, userLng]);

  const vehicles = useMemo(
    () => posicao?.vs ?? [],
    [posicao]
  );

  return { stops, stopsNearby, stopsWithPredictions, vehicles, shape, loading, error };
}
