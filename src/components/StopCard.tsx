"use client";

import { usePredictions } from "@/hooks/usePredictions";
import { LineCard } from "./LineCard";
import { PulsingDot } from "./PulsingDot";
import { formatWalkTime } from "@/lib/walk-time";
import type { ParadaWithDistance } from "@/lib/types";

interface Props {
  stop: ParadaWithDistance;
  onBack: () => void;
}

export function StopCard({ stop, onBack }: Props) {
  const { data, loading, lastUpdate } = usePredictions(stop.cp);
  const lines = data?.p?.l ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center gap-3" style={{ backgroundColor: "#1A2332" }}>
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8ECEF" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold truncate" style={{ color: "#E8ECEF" }}>
            {stop.np}
          </h2>
          <p className="text-xs truncate" style={{ color: "#6B7D8E" }}>
            {stop.ed}
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-xs" style={{ color: "#6B7D8E" }}>
            {formatWalkTime(stop.distance)}
          </span>
          <span className="text-xs" style={{ color: "#6B7D8E" }}>
            {stop.distance}m
          </span>
        </div>
      </div>

      {/* Refresh bar */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ backgroundColor: "#0F1419" }}
      >
        <div className="flex items-center gap-2">
          <PulsingDot color="#00C853" size={6} />
          <span className="text-xs" style={{ color: "#6B7D8E" }}>
            {lastUpdate
              ? `Atualizado às ${lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
              : loading
              ? "Carregando..."
              : "—"}
          </span>
        </div>
        <span className="text-xs" style={{ color: "#6B7D8E" }}>
          {lines.reduce((acc, l) => acc + l.vs.length, 0)} ônibus rastreados
        </span>
      </div>

      {/* Predictions */}
      <div
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5"
        style={{ backgroundColor: "#0F1419" }}
      >
        {loading && lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: "#00A651", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "#6B7D8E" }}>
              Buscando previsões...
            </p>
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="text-4xl">🚌</span>
            <p className="text-sm" style={{ color: "#6B7D8E" }}>
              Nenhuma previsão disponível
            </p>
          </div>
        ) : (
          lines.map((line, i) => (
            <LineCard
              key={line.cl}
              prediction={line}
              distanceMeters={stop.distance}
              defaultOpen={i === 0}
            />
          ))
        )}
      </div>
    </div>
  );
}
