"use client";

import { useState } from "react";
import { useNearbyBuses } from "@/hooks/useNearbyBuses";
import { PulsingDot } from "./PulsingDot";
import { BusMap } from "./BusMap";
import type { NearbyBus, ParadaWithDistance } from "@/lib/types";

function timeSince(isoStr: string): string {
  const diffMs = Date.now() - new Date(isoStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin === 1) return "1 min";
  return `${diffMin} min`;
}

function BusRow({ bus, selected, onClick, onDetail }: { bus: NearbyBus; selected: boolean; onClick: () => void; onDetail: () => void }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl transition-all overflow-hidden"
      style={{
        backgroundColor: selected ? "#1e3a2a" : "#1A2332",
        border: selected ? "1px solid #00A651" : "1px solid #ffffff0d",
      }}
    >
      {/* Main tap area */}
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
        className="flex flex-1 items-center gap-3 p-3 cursor-pointer min-w-0"
      >
        {/* Line badge */}
        <div
          className="font-signage-tight flex items-center justify-center rounded-lg font-bold text-sm px-2 shrink-0"
          style={{
            backgroundColor: selected ? "#00A651" : "#FFB800",
            color: "#0F1419",
            minWidth: 72,
            height: 32,
          }}
        >
          {bus.line}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-signage-tight text-sm font-medium truncate" style={{ color: "#E8ECEF" }}>
              {bus.destination}
            </span>
            {bus.accessible && <span className="text-xs shrink-0" title="Acessível">♿</span>}
          </div>
          <span className="font-signage text-[10px]" style={{ color: "#6B7D8E" }}>
            Prefixo {bus.prefixo} · GPS {timeSince(bus.lastUpdate)}
          </span>
        </div>

        {/* Distance */}
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1">
            <PulsingDot color="#00A651" size={6} />
            <span className="font-signage-tight text-sm font-bold" style={{ color: "#00A651" }}>
              {bus.distance}m
            </span>
          </div>
          <span className="font-signage text-[10px]" style={{ color: "#6B7D8E" }}>de você</span>
        </div>
      </div>

      {/* Detail button — separate from main tap area */}
      <button
        onClick={onDetail}
        className="px-3 self-stretch flex items-center hover:bg-white/10 transition-colors border-l"
        style={{ borderColor: "#ffffff10" }}
        title="Ver rota"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7D8E" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

interface Props {
  lat: number | null;
  lng: number | null;
  stops: ParadaWithDistance[];
  onBusDetail: (bus: NearbyBus) => void;
}

export function NearbyBuses({ lat, lng, stops, onBusDetail }: Props) {
  const { buses, loading, error, lastUpdate } = useNearbyBuses(lat, lng);
  const [selectedPrefixo, setSelectedPrefixo] = useState<string | null>(null);
  const [selectedStopCp, setSelectedStopCp] = useState<number | null>(null);

  const hasGps = lat !== null && lng !== null;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#0F1419" }}>
      {/* Map */}
      <div className="shrink-0" style={{ height: "45%" }}>
        {hasGps ? (
          <BusMap
            lat={lat}
            lng={lng}
            buses={buses}
            stops={stops}
            selectedBus={selectedPrefixo}
            selectedStop={selectedStopCp}
            onSelectBus={setSelectedPrefixo}
            onSelectStop={setSelectedStopCp}
          />
        ) : (
          <div
            className="h-full flex items-center justify-center"
            style={{ backgroundColor: "#1A2332" }}
          >
            <p className="text-sm" style={{ color: "#6B7D8E" }}>
              GPS necessário para o mapa
            </p>
          </div>
        )}
      </div>

      {/* Refresh bar */}
      <div className="panel-grid flex items-center justify-between px-4 py-2 shrink-0" style={{ backgroundColor: "#111923" }}>
        <div className="flex items-center gap-2">
          <PulsingDot color={error ? "#FF4444" : "#00C853"} size={6} />
          <span className="font-signage text-[10px]" style={{ color: "#6B7D8E" }}>
            {error
              ? "Falha ao carregar ônibus"
              : lastUpdate
              ? `Atualizado ${lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
              : loading
              ? "Carregando"
              : "—"}
          </span>
        </div>
        <span className="font-signage text-[10px]" style={{ color: "#6B7D8E" }}>
          {buses.length} ônibus em até 600m
        </span>
      </div>

      {/* Bus list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2">
        {error ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <span className="text-4xl">⚠️</span>
            <p className="text-sm font-medium" style={{ color: "#E8ECEF" }}>
              Não foi possível buscar os ônibus próximos
            </p>
            <p className="font-signage text-[10px] max-w-xs" style={{ color: "#6B7D8E" }}>
              {error.includes("HTTP 502")
                ? "Verifique no Vercel se SPTRANS_TOKEN está configurado corretamente e se a API da SPTrans está respondendo."
                : error}
            </p>
          </div>
        ) : loading && buses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: "#00A651", borderTopColor: "transparent" }}
            />
            <p className="font-signage text-[10px]" style={{ color: "#6B7D8E" }}>
              Buscando ônibus próximos...
            </p>
          </div>
        ) : buses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <span className="text-4xl">🚌</span>
            <p className="font-signage text-[10px]" style={{ color: "#6B7D8E" }}>
              Nenhum ônibus em até 600m
            </p>
          </div>
        ) : (
          buses.map((bus) => (
            <BusRow
              key={`${bus.cl}-${bus.prefixo}`}
              bus={bus}
              selected={selectedPrefixo === bus.prefixo}
              onClick={() => setSelectedPrefixo(selectedPrefixo === bus.prefixo ? null : bus.prefixo)}
              onDetail={() => onBusDetail(bus)}
            />
          ))
        )}
      </div>
    </div>
  );
}
