"use client";

import { useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyStops } from "@/hooks/useNearbyStops";
import { NearbyBuses } from "./NearbyBuses";
import { BusDetail } from "./BusDetail";
import { PulsingDot } from "./PulsingDot";
import type { NearbyBus } from "@/lib/types";

export function NearbyStops() {
  const { lat, lng, loading: locLoading } = useGeolocation();
  const [detailBus, setDetailBus] = useState<NearbyBus | null>(null);

  const { stops, loading: stopsLoading, fullAddress } = useNearbyStops(lat, lng);

  const loading = locLoading || stopsLoading;

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
              style={{ backgroundColor: "#FFB800", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)" }}
            >
              🚌
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-signage text-[11px]" style={{ color: "#6B7D8E" }}>
                Transit Finder
              </span>
              <h1 className="font-signage-wide text-xl font-bold leading-none" style={{ color: "#E8ECEF" }}>
                Buzão Buddy
              </h1>
            </div>
          </div>
          <div className="board-pill flex items-center gap-1.5 rounded-full px-2.5 py-1">
            <PulsingDot color={locLoading ? "#FFB800" : "#00C853"} />
            <span
              className="font-signage status-pulse text-[12px] font-medium"
              style={{ color: locLoading ? "#FFB800" : "#00C853" }}
            >
              {locLoading ? "Localizando..." : lat ? "Localizado" : "Sem GPS"}
            </span>
          </div>
        </div>
      </div>

      <div className="panel-grid px-4 py-2" style={{ backgroundColor: "#111923" }}>
        <div className="flex items-center justify-between gap-3">
          <span className="font-signage-wide text-[12px] font-semibold" style={{ color: "#00A651" }}>
            Buzões próximos
          </span>
          {fullAddress ? (
            <span className="font-signage text-[11px] truncate" style={{ color: "#6B7D8E" }}>
              {fullAddress}
            </span>
          ) : loading ? (
            <span className="font-signage text-[11px]" style={{ color: "#6B7D8E" }}>
              Buscando localização...
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <NearbyBuses lat={lat} lng={lng} stops={stops} onBusDetail={setDetailBus} />
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3 flex items-center justify-center gap-1.5"
        style={{ backgroundColor: "#1A2332", borderTop: "1px solid #ffffff08" }}
      >
        <span className="font-signage text-[12px]" style={{ color: "#6B7D8E" }}>Dados em tempo real</span>
        <span className="text-xs" style={{ color: "#ffffff15" }}>•</span>
        <span className="font-signage text-[12px]" style={{ color: "#FFB800" }}>SPTrans Olho Vivo</span>
      </div>
    </div>
  );
}
