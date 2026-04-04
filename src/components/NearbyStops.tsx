"use client";

import { useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyStops } from "@/hooks/useNearbyStops";
import { StopCard } from "./StopCard";
import { NearbyBuses } from "./NearbyBuses";
import { BusDetail } from "./BusDetail";
import { PulsingDot } from "./PulsingDot";
import type { NearbyBus, ParadaWithDistance } from "@/lib/types";

type Tab = "paradas" | "buzoes";

function formatMin(distanceMeters: number): string {
  const min = Math.round(distanceMeters / 75);
  return `~${min} min`;
}

function StopRow({
  stop,
  onClick,
}: {
  stop: ParadaWithDistance;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
      style={{ backgroundColor: "#1A2332" }}
    >
      {/* Distance badge */}
      <div className="flex flex-col items-center" style={{ minWidth: 52 }}>
        <div
          className="rounded-lg flex items-center justify-center text-xs font-bold px-2 py-1"
          style={{ backgroundColor: "#00A65120", color: "#00A651" }}
        >
          {stop.distance}m
        </div>
        <span className="text-xs mt-0.5" style={{ color: "#6B7D8E" }}>
          {formatMin(stop.distance)}
        </span>
      </div>

      {/* Stop info */}
      <div className="flex-1 min-w-0 flex flex-col items-start">
        <span
          className="text-sm font-medium truncate w-full text-left"
          style={{ color: "#E8ECEF" }}
        >
          {stop.np}
        </span>
        <span className="text-xs truncate w-full text-left" style={{ color: "#6B7D8E" }}>
          {stop.ed}
        </span>
      </div>

      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7D8E" strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

export function NearbyStops() {
  const { lat, lng, loading: locLoading } = useGeolocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStop, setSelectedStop] = useState<ParadaWithDistance | null>(null);
  const [detailBus, setDetailBus] = useState<NearbyBus | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("paradas");

  const { stops, loading: stopsLoading, fullAddress } = useNearbyStops(lat, lng, searchQuery);

  const loading = locLoading || stopsLoading;

  if (selectedStop) {
    return <StopCard stop={selectedStop} onBack={() => setSelectedStop(null)} />;
  }

  if (detailBus && lat !== null && lng !== null) {
    return <BusDetail bus={detailBus} userLat={lat} userLng={lng} onBack={() => setDetailBus(null)} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3" style={{ backgroundColor: "#0F1419" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ backgroundColor: "#FFB800" }}
            >
              🚌
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "#E8ECEF" }}>
              Buzão Buddy
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <PulsingDot color={locLoading ? "#FFB800" : "#00C853"} />
            <span
              className="text-xs font-medium"
              style={{ color: locLoading ? "#FFB800" : "#00C853" }}
            >
              {locLoading ? "Localizando..." : lat ? "Localizado" : "Sem GPS"}
            </span>
          </div>
        </div>

        {/* Search — only on paradas tab */}
        {activeTab === "paradas" && (
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="#6B7D8E" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar parada ou endereço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-600"
              style={{
                backgroundColor: "#1A2332",
                color: "#E8ECEF",
                border: "1px solid #ffffff10",
              }}
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div
        className="flex border-b"
        style={{ backgroundColor: "#0F1419", borderColor: "#ffffff10" }}
      >
        {(["paradas", "buzoes"] as Tab[]).map((tab) => {
          const label = tab === "paradas" ? "Paradas próximas" : "Buzões próximos";
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors"
              style={{
                color: active ? "#00A651" : "#6B7D8E",
                borderBottom: active ? "2px solid #00A651" : "2px solid transparent",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "paradas" ? (
        <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ backgroundColor: "#0F1419" }}>
          {fullAddress && (
            <div className="flex items-start gap-1.5 mt-2 mb-1">
              <svg className="shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="#00A651" stroke="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span className="text-xs font-medium leading-tight" style={{ color: "#00A651" }}>
                {fullAddress}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mb-2 mt-2">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#6B7D8E" }}>
              {stops.length} encontradas
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div
                  className="w-10 h-10 rounded-full border-2 animate-spin"
                  style={{ borderColor: "#00A651", borderTopColor: "transparent" }}
                />
                <p className="text-sm" style={{ color: "#6B7D8E" }}>
                  Buscando paradas próximas...
                </p>
              </div>
            ) : stops.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="text-4xl">🗺️</span>
                <p className="text-sm" style={{ color: "#6B7D8E" }}>
                  {searchQuery
                    ? "Nenhuma parada encontrada"
                    : "Permita acesso à localização para ver paradas próximas"}
                </p>
              </div>
            ) : (
              stops.map((stop, i) => (
                <StopRow
                  key={stop.cp}
                  stop={stop}
                  index={i}
                  onClick={() => setSelectedStop(stop)}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
          <NearbyBuses lat={lat} lng={lng} stops={stops} onBusDetail={setDetailBus} />
        </div>
      )}

      {/* Footer */}
      <div
        className="px-4 py-3 flex items-center justify-center gap-1.5"
        style={{ backgroundColor: "#1A2332", borderTop: "1px solid #ffffff08" }}
      >
        <span className="text-xs" style={{ color: "#6B7D8E" }}>Dados em tempo real</span>
        <span className="text-xs" style={{ color: "#ffffff15" }}>•</span>
        <span className="text-xs" style={{ color: "#FFB800" }}>SPTrans Olho Vivo</span>
      </div>
    </div>
  );
}
