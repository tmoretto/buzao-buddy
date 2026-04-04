"use client";

import { useState, useEffect } from "react";
import type { VeiculoPrevisao } from "@/lib/types";
import { walkingMinutes } from "@/lib/walk-time";
import { PulsingDot } from "./PulsingDot";

function arrivalMinutes(timeStr: string): number {
  const [hh, mm] = timeStr.split(":").map(Number);
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  const arrival = new Date(now);
  arrival.setHours(hh, mm, 0, 0);
  // Handle midnight rollover
  if (arrival.getTime() < now.getTime()) arrival.setDate(arrival.getDate() + 1);
  return (arrival.getTime() - now.getTime()) / 60000;
}

function getArrivalColor(minutes: number): string {
  if (minutes <= 3) return "#FF4444";
  if (minutes <= 8) return "#FFB800";
  return "#00C853";
}

function getLeaveStatus(arrivalMin: number, walkMin: number) {
  const buffer = arrivalMin - walkMin - 1;
  if (buffer < 0) return { text: "Já era!", color: "#FF4444", emoji: "😰" };
  if (buffer < 2) return { text: "Saia AGORA!", color: "#FF4444", emoji: "🏃" };
  if (buffer < 5)
    return { text: `Saia em ${Math.round(buffer)} min`, color: "#FFB800", emoji: "⚡" };
  return { text: `Saia em ${Math.round(buffer)} min`, color: "#00C853", emoji: "😎" };
}

function formatMin(min: number): string {
  if (min <= 0) return "agora";
  if (min < 1) return "<1 min";
  return `${Math.round(min)} min`;
}

interface VehicleRowProps {
  vehicle: VeiculoPrevisao;
  walkMin: number;
}

function VehicleRow({ vehicle, walkMin }: VehicleRowProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const arrivalColor = getArrivalColor(countdown ?? 99);
  const status = getLeaveStatus(countdown ?? 99, walkMin);
  const countdownLabel = countdown === null ? "..." : formatMin(countdown);

  useEffect(() => {
    setCountdown(arrivalMinutes(vehicle.t));
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, (prev ?? 0) - 1 / 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [vehicle.t]);

  return (
    <div
      className="flex items-center justify-between py-2 px-3 rounded-lg"
      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex flex-col items-center" style={{ minWidth: 48 }}>
          <span
            key={countdownLabel}
            className="font-signage-tight board-value ticker-flash text-lg font-bold"
            style={{ color: arrivalColor }}
          >
            {countdownLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-signage text-[12px]" style={{ color: "#6B7D8E" }}>
            Prefixo {vehicle.p}
          </span>
          {vehicle.a && (
            <span className="text-xs" title="Acessível">
              ♿
            </span>
          )}
        </div>
      </div>
      <span
        key={status.text}
        className="font-signage board-pill ticker-flash text-[12px] font-medium px-2 py-0.5 rounded-full"
        style={{ backgroundColor: `${status.color}20`, color: status.color }}
      >
        {status.emoji} {status.text}
      </span>
    </div>
  );
}

interface Props {
  vehicles: VeiculoPrevisao[];
  distanceMeters: number;
}

export function PredictionTimeline({ vehicles, distanceMeters }: Props) {
  const walkMin = walkingMinutes(distanceMeters);

  return (
    <div className="flex flex-col gap-1.5">
      {vehicles.map((v) => (
        <VehicleRow key={v.p} vehicle={v} walkMin={walkMin} />
      ))}
    </div>
  );
}

// Compact next-arrival display used in line card header
interface NextArrivalProps {
  timeStr: string;
}

export function NextArrivalBadge({ timeStr }: NextArrivalProps) {
  const [minutes, setMinutes] = useState<number | null>(null);
  const color = getArrivalColor(minutes ?? 99);
  const label = minutes === null ? "..." : formatMin(minutes);

  useEffect(() => {
    setMinutes(arrivalMinutes(timeStr));
    const interval = setInterval(() => {
      setMinutes((prev) => Math.max(0, (prev ?? 0) - 1 / 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeStr]);

  return (
    <div className="board-pill flex items-center gap-2 rounded-full px-2 py-1">
      <PulsingDot color={color} size={8} />
      <span
        key={label}
        className="font-signage-tight board-value ticker-flash text-lg font-bold"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}
