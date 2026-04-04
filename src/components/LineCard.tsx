"use client";

import { useState } from "react";
import type { LinhaPrevisao } from "@/lib/types";
import { PredictionTimeline, NextArrivalBadge } from "./PredictionTimeline";

interface Props {
  prediction: LinhaPrevisao;
  distanceMeters: number;
  defaultOpen?: boolean;
}

export function LineCard({ prediction, distanceMeters, defaultOpen = false }: Props) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const nextVehicle = prediction.vs[0];

  // Display label: strip "-10" suffix variant
  const label = prediction.c.replace(/-\d+$/, "");

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{ backgroundColor: "#1A2332", border: "1px solid transparent" }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg font-bold text-sm px-2"
            style={{
              backgroundColor: "#FFB800",
              color: "#0F1419",
              minWidth: 72,
              height: 32,
              fontFamily: "monospace",
            }}
          >
            {label}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm" style={{ color: "#E8ECEF" }}>
              {prediction.sl === 1 ? prediction.lt0 : prediction.lt1}
            </span>
            <span className="text-xs" style={{ color: "#6B7D8E" }}>
              {prediction.qv} {prediction.qv === 1 ? "veículo" : "veículos"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {nextVehicle && <NextArrivalBadge timeStr={nextVehicle.t} />}
          <svg
            className="transition-transform duration-200"
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              color: "#6B7D8E",
            }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          <div className="h-px w-full" style={{ backgroundColor: "#ffffff10" }} />
          <PredictionTimeline vehicles={prediction.vs} distanceMeters={distanceMeters} />
        </div>
      )}
    </div>
  );
}
