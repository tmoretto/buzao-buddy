"use client";

import { useState, useEffect } from "react";
import type { ParadaWithDistance } from "@/lib/types";
import { sortStopsByDistance } from "@/lib/geo";

const MAX_STOPS = 5;

interface GeoAddress {
  house_number?: string;
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  town?: string;
  city?: string;
  postcode?: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<GeoAddress> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { "Accept-Language": "pt-BR" } }
  );
  const data = await res.json();
  return data.address ?? {};
}

async function fetchStops(term: string, signal: AbortSignal) {
  const res = await fetch(
    `/api/sptrans/stops?q=${encodeURIComponent(term)}`,
    { signal }
  );
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Invalid response");
  return data;
}

export function useNearbyStops(
  lat: number | null,
  lng: number | null,
  searchTerm: string = ""
) {
  const [stops, setStops] = useState<ParadaWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [fullAddress, setFullAddress] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    async function load() {
      const term = searchTerm.trim();

      if (term) {
        setLocationName(null);
        const data = await fetchStops(term, controller.signal);
        const sorted =
          lat !== null && lng !== null
            ? sortStopsByDistance(data, lat, lng).slice(0, MAX_STOPS)
            : data.slice(0, MAX_STOPS).map((s) => ({ ...s, distance: 0 }));
        setStops(sorted);
        return;
      }

      if (lat === null || lng === null) return;

      const address = await reverseGeocode(lat, lng);

      // Search all candidates in parallel and merge results
      const candidates = [
        address.road,
        address.suburb,
        address.neighbourhood,
        address.city_district,
      ].filter(Boolean) as string[];

      const results = await Promise.all(
        candidates.map((c) => fetchStops(c, controller.signal).catch(() => []))
      );

      // Deduplicate by stop code and sort by distance
      const seen = new Set<number>();
      const merged = results.flat().filter((s) => {
        if (seen.has(s.cp)) return false;
        seen.add(s.cp);
        return true;
      });

      const sorted = sortStopsByDistance(merged, lat, lng).slice(0, MAX_STOPS);
      setLocationName(address.road ?? address.suburb ?? null);

      const parts = [
        address.road && address.house_number
          ? `${address.road}, ${address.house_number}`
          : address.road,
        address.suburb ?? address.neighbourhood,
        address.city ?? address.town,
      ].filter(Boolean);
      setFullAddress(parts.join(" — "));

      setStops(sorted);
    }

    load()
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lat, lng, searchTerm]);

  return { stops, loading, error, locationName, fullAddress };
}
