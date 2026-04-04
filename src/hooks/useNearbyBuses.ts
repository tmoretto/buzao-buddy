"use client";

import { useState, useEffect, useCallback } from "react";
import type { NearbyBus, Posicao } from "@/lib/types";
import { haversineDistance } from "@/lib/geo";
import { fetchJsonOrThrow } from "@/lib/http";

const POLL_INTERVAL_MS = 30_000;
const MAX_DISTANCE_M = 600;
const MAX_BUSES = 20;

export function useNearbyBuses(lat: number | null, lng: number | null) {
  const [buses, setBuses] = useState<NearbyBus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetch_ = useCallback(async () => {
    if (lat === null || lng === null) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchJsonOrThrow<Posicao>("/api/sptrans/positions");

      const nearby: NearbyBus[] = [];

      for (const line of data.l ?? []) {
        for (const v of line.vs ?? []) {
          const dist = haversineDistance(lat, lng, v.py, v.px);
          if (dist <= MAX_DISTANCE_M) {
            nearby.push({
              line: line.c.replace(/-\d+$/, ""),
              cl: line.cl,
              destination: line.sl === 1 ? line.lt0 : line.lt1,
              prefixo: v.p,
              accessible: v.a,
              distance: Math.round(dist),
              lastUpdate: v.ta,
              lat: v.py,
              lng: v.px,
            });
          }
        }
      }

      nearby.sort((a, b) => a.distance - b.distance);
      setBuses(nearby.slice(0, MAX_BUSES));
      setLastUpdate(new Date());
    } catch (err) {
      setBuses([]);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    fetch_();
    const interval = setInterval(fetch_, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetch_]);

  return { buses, loading, error, lastUpdate };
}
