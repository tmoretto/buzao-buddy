"use client";

import { useState, useEffect, useCallback } from "react";
import type { PrevisaoParada } from "@/lib/types";

const POLL_INTERVAL_MS = 30_000;

export function usePredictions(stopId: number | null) {
  const [data, setData] = useState<PrevisaoParada | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPredictions = useCallback(async () => {
    if (!stopId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sptrans/predictions?stopId=${stopId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: PrevisaoParada = await res.json();
      setData(json);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [stopId]);

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchPredictions]);

  return { data, loading, error, lastUpdate, refresh: fetchPredictions };
}
