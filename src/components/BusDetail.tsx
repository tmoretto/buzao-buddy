"use client";

import { useMemo, useRef, useCallback } from "react";
import Map, { Marker, Source, Layer, NavigationControl, type MapRef } from "react-map-gl/mapbox";
import type { LayerProps } from "react-map-gl/mapbox";
import type { NearbyBus, VeiculoPosicao } from "@/lib/types";
import { useBusRoute, type StopWithPredictions } from "@/hooks/useBusRoute";
import { haversineDistance } from "@/lib/geo";
import { walkingMinutes } from "@/lib/walk-time";
import { OPERATIONS_MAP_PANEL_STYLE, OPERATIONS_MAP_STYLE } from "@/lib/map-theme";
import { findTransitNearRoute, findTransitByTerminalName, groupTransitConnections, type GroupedTransitConnection } from "@/lib/metro-stations";
import { PulsingDot } from "./PulsingDot";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const RADIUS_M = 2000;

function makeCircleGeoJSON(lat: number, lng: number) {
  const points = 64;
  const dLat = RADIUS_M / 111_111;
  const dLng = RADIUS_M / (111_111 * Math.cos((lat * Math.PI) / 180));
  const coords = Array.from({ length: points + 1 }, (_, i) => {
    const angle = (i / points) * 2 * Math.PI;
    return [lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)];
  });
  return { type: "Feature" as const, geometry: { type: "Polygon" as const, coordinates: [coords] }, properties: {} };
}

const routeLayer: LayerProps = {
  id: "route-line",
  type: "line",
  paint: { "line-color": "#00A651", "line-width": 3, "line-opacity": 0.8 },
};

const circleOutlineLayer: LayerProps = {
  id: "radius-outline",
  type: "line",
  paint: { "line-color": "#3B82F6", "line-width": 1.5, "line-dasharray": [4, 3], "line-opacity": 0.5 },
};

/* ── helpers ──────────────────────────────────────────── */

function minutesUntil(timeStr: string, referenceHr?: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target < now) target.setDate(target.getDate() + 1);
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / 60_000));
}

function formatEta(min: number): string {
  if (min <= 0) return "agora";
  if (min < 1) return "<1 min";
  return `${min} min`;
}

function etaColor(min: number): string {
  if (min <= 3) return "#FF4444";
  if (min <= 8) return "#FFB800";
  return "#00C853";
}

function timeSince(isoStr: string): string {
  const diffMs = Date.now() - new Date(isoStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin === 1) return "1 min";
  return `${diffMin} min`;
}

interface LeaveStatus {
  text: string;
  color: string;
  emoji: string;
}

/* ── transit connection detection ─────────────────────── */

// Now handled by findTransitNearRoute() from metro-stations.ts
// which checks if any bus stop is within 350m of a metro/CPTM station

function getLeaveStatus(arrivalMin: number, walkMin: number): LeaveStatus {
  const buffer = arrivalMin - walkMin;
  if (buffer < 0) return { text: "Já era!", color: "#FF4444", emoji: "😰" };
  if (buffer < 2) return { text: "Saia AGORA!", color: "#FF4444", emoji: "🏃" };
  if (buffer < 5) return { text: `Saia em ${Math.round(buffer)} min`, color: "#FFB800", emoji: "⚡" };
  return { text: `Saia em ${Math.round(buffer)} min`, color: "#00C853", emoji: "😎" };
}

/* ── vehicle card ─────────────────────────────────────── */

function VehicleCard({ v, userLat, userLng, lineName }: { v: VeiculoPosicao; userLat: number; userLng: number; lineName: string }) {
  const dist = Math.round(haversineDistance(userLat, userLng, v.py, v.px));

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ backgroundColor: "#1A2332", border: "1px solid #ffffff0d" }}
    >
      <div
        className="font-signage-tight flex items-center justify-center rounded-lg font-bold text-xs px-2 shrink-0"
        style={{ backgroundColor: "#FFB800", color: "#0F1419", minWidth: 52, height: 28 }}
      >
        {lineName}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-signage text-[11px]" style={{ color: "#E8ECEF" }}>
            Prefixo {v.p}
          </span>
          {v.a && <span className="text-xs" title="Acessível">♿</span>}
        </div>
        <span className="font-signage text-[11px]" style={{ color: "#6B7D8E" }}>
          GPS {timeSince(v.ta)}
        </span>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className="font-signage-tight text-sm font-bold" style={{ color: "#00A651" }}>
          {dist}m
        </span>
        <span className="font-signage text-[11px]" style={{ color: "#6B7D8E" }}>de você</span>
      </div>
    </div>
  );
}

/* ── stop prediction row ──────────────────────────────── */

function StopPredictionCard({ stop }: { stop: StopWithPredictions }) {
  const walkMin = walkingMinutes(stop.distance);
  const isWalkable = stop.distance <= 2000;
  const nextVehicle = stop.predictions[0];
  const eta = nextVehicle ? minutesUntil(nextVehicle.t) : null;
  const leaveStatus = eta !== null && isWalkable ? getLeaveStatus(eta, walkMin) : null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "#1A2332", border: "1px solid #ffffff0d" }}
    >
      {/* Stop header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex flex-col items-center shrink-0" style={{ minWidth: 48 }}>
          <div
            className="font-signage-tight rounded-lg flex items-center justify-center text-xs font-bold px-2 py-1"
            style={{ backgroundColor: isWalkable ? "#00A65120" : "#ffffff10", color: isWalkable ? "#00A651" : "#6B7D8E" }}
          >
            {stop.distance >= 1000 ? `${(stop.distance / 1000).toFixed(1)}km` : `${stop.distance}m`}
          </div>
          {isWalkable && (
            <span className="font-signage text-[11px] mt-0.5" style={{ color: "#6B7D8E" }}>
              ~{Math.round(walkMin)} min
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-signage-tight text-sm font-medium truncate" style={{ color: "#E8ECEF" }}>
            {stop.np}
          </p>
          <p className="font-signage text-[11px] truncate" style={{ color: "#6B7D8E" }}>
            {stop.ed}
          </p>
        </div>

        {eta !== null && (
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1.5">
              <PulsingDot color={etaColor(eta)} size={6} />
              <span className="font-signage-tight text-sm font-bold" style={{ color: etaColor(eta) }}>
                {formatEta(eta)}
              </span>
            </div>
            <span className="font-signage text-[11px]" style={{ color: "#6B7D8E" }}>próximo</span>
          </div>
        )}
      </div>

      {/* Walk-time alert */}
      {leaveStatus && (
        <div
          className="flex items-center gap-2 px-4 py-2 border-t"
          style={{
            borderColor: "#ffffff08",
            background: `linear-gradient(135deg, ${leaveStatus.color}10, transparent)`,
          }}
        >
          <span className="text-sm">{leaveStatus.emoji}</span>
          <span className="font-signage text-[11px] font-semibold" style={{ color: leaveStatus.color }}>
            {leaveStatus.text}
          </span>
          {stop.predictions.length > 1 && (
            <span className="font-signage text-[11px] ml-auto" style={{ color: "#6B7D8E" }}>
              +{stop.predictions.length - 1} veículo{stop.predictions.length > 2 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Additional vehicles at this stop */}
      {stop.predictions.length > 1 && (
        <div className="px-4 pb-2.5 flex flex-col gap-1 border-t" style={{ borderColor: "#ffffff08" }}>
          {stop.predictions.slice(1, 4).map((v) => {
            const vEta = minutesUntil(v.t);
            return (
              <div key={v.p} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-signage text-[11px]" style={{ color: "#6B7D8E" }}>
                    #{v.p}
                  </span>
                  {v.a && <span className="text-xs">♿</span>}
                </div>
                <span className="font-signage-tight text-[11px] font-bold" style={{ color: etaColor(vEta) }}>
                  {formatEta(vEta)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── main component ───────────────────────────────────── */

interface Props {
  bus: NearbyBus;
  userLat: number;
  userLng: number;
  onBack: () => void;
}

export function BusDetail({ bus, userLat, userLng, onBack }: Props) {
  const { stops, stopsNearby, stopsWithPredictions, vehicles, shape, loading, error } = useBusRoute(bus.cl, userLat, userLng, bus.gtfsId, bus.sl);
  const mapRef = useRef<MapRef>(null);

  const flyToStation = useCallback((lat: number, lng: number) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 1200 });
  }, []);

  const circleGeoJSON = useMemo(() => makeCircleGeoJSON(userLat, userLng), [userLat, userLng]);

  const routeLineGeoJSON = useMemo(() => {
    // Prefer GTFS shape (detailed polyline) over stop-to-stop line
    if (shape && shape.length >= 2) {
      return {
        type: "Feature" as const,
        geometry: { type: "LineString" as const, coordinates: shape },
        properties: {},
      };
    }
    if (stops.length < 2) return null;
    return {
      type: "Feature" as const,
      geometry: { type: "LineString" as const, coordinates: stops.map((s) => [s.px, s.py]) },
      properties: {},
    };
  }, [shape, stops]);

  const sortedVehicles = useMemo(
    () =>
      [...vehicles]
        .map((v) => ({ ...v, dist: haversineDistance(userLat, userLng, v.py, v.px) }))
        .sort((a, b) => a.dist - b.dist),
    [vehicles, userLat, userLng]
  );

  const transitConnections = useMemo(
    () => {
      // Use GTFS shape points (dense polyline) for proximity check when available,
      // fall back to sparse Olho Vivo stops
      const routePoints = shape && shape.length > 0
        ? shape.map(([lng, lat]) => ({ py: lat, px: lng }))
        : stops;
      const connections = groupTransitConnections([
        ...findTransitNearRoute(routePoints),
        ...findTransitByTerminalName([bus.origin, bus.destination]),
      ]);
      // Sort by distance from the user's location
      return connections.sort((a, b) =>
        haversineDistance(userLat, userLng, a.lat, a.lng) -
        haversineDistance(userLat, userLng, b.lat, b.lng)
      );
    },
    [shape, stops, bus.origin, bus.destination, userLat, userLng]
  );

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#0F1419" }}>
      {/* ── Header ── */}
      <div className="panel-grid px-4 py-3 shrink-0" style={{ backgroundColor: "#111923" }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="board-pill p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8ECEF" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div
            className="font-signage-tight flex items-center justify-center rounded-lg font-bold px-3 py-1"
            style={{ backgroundColor: "#FFB800", color: "#0F1419", fontSize: 16 }}
          >
            {bus.line}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-signage-tight text-sm font-semibold truncate" style={{ color: "#E8ECEF" }}>
              {bus.destination}
            </span>
            <span className="font-signage text-[11px]" style={{ color: "#6B7D8E" }}>
              {loading
                ? "Carregando rota"
                : `${stopsNearby.length} paradas em 2km · ${vehicles.length} veículos`}
            </span>
          </div>
        </div>

        {/* Transit connections */}
        {transitConnections.length > 0 && (
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            {transitConnections.map((c) => {
              const isCptm = c.type === "cptm";
              const isBoth = c.type === "both";
              const bgColor = isCptm ? "#6B2D8B20" : "#0052A520";
              const borderColor = isCptm ? "#6B2D8B40" : "#0052A540";
              const badgeBg = isCptm ? "#6B2D8B" : "#0052A5";
              const textColor = isCptm ? "#B07DD8" : "#4D9FFF";
              return (
                <div
                  key={c.name}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 cursor-pointer hover:brightness-125 transition-all"
                  style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}
                  onClick={() => flyToStation(c.lat, c.lng)}
                >
                  {isBoth ? (
                    <>
                      <span className="font-signage-tight text-[10px] font-bold rounded px-1 py-px" style={{ backgroundColor: "#0052A5", color: "#fff" }}>M</span>
                      <span className="font-signage-tight text-[10px] font-bold rounded px-1 py-px" style={{ backgroundColor: "#6B2D8B", color: "#fff" }}>CPTM</span>
                    </>
                  ) : (
                    <span className="font-signage-tight text-[10px] font-bold rounded px-1 py-px" style={{ backgroundColor: badgeBg, color: "#fff" }}>
                      {isCptm ? "CPTM" : "M"}
                    </span>
                  )}
                  <span className="font-signage text-[11px] font-medium" style={{ color: textColor }}>
                    {c.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div className="shrink-0" style={{ height: "38%" }}>
        {MAPBOX_TOKEN ? (
          <div className="relative h-full w-full overflow-hidden" style={OPERATIONS_MAP_PANEL_STYLE}>
            <Map
              ref={mapRef}
              mapboxAccessToken={MAPBOX_TOKEN}
              initialViewState={{ longitude: userLng, latitude: userLat, zoom: 14 }}
              style={{ width: "100%", height: "100%" }}
              mapStyle={OPERATIONS_MAP_STYLE}
              attributionControl={false}
            >
              <NavigationControl position="top-right" showCompass={false} />

              <Source id="radius" type="geojson" data={circleGeoJSON}>
                <Layer id="radius-fill" type="fill" paint={{ "fill-color": "#3B82F6", "fill-opacity": 0.05 }} />
                <Layer {...circleOutlineLayer} />
              </Source>

              {routeLineGeoJSON && (
                <Source id="route" type="geojson" data={routeLineGeoJSON}>
                  <Layer {...routeLayer} />
                </Source>
              )}

              {stops.map((stop) => {
                const isNearby = haversineDistance(userLat, userLng, stop.py, stop.px) <= RADIUS_M;
                return (
                  <Marker key={`stop-${stop.cp}`} longitude={stop.px} latitude={stop.py} anchor="center">
                    <div
                      className="rounded-full"
                      style={{
                        width: isNearby ? 14 : 8,
                        height: isNearby ? 14 : 8,
                        backgroundColor: isNearby ? "#00A651" : "#4B8C62",
                        border: isNearby ? "2px solid #fff" : "1.5px solid #2a5c3a",
                        opacity: isNearby ? 1 : 0.6,
                      }}
                    />
                  </Marker>
                );
              })}

              {vehicles.map((v) => (
                <Marker key={`v-${v.p}`} longitude={v.px} latitude={v.py} anchor="center">
                  <div className="flex flex-col items-center">
                    <div
                      className="font-signage-tight rounded-lg px-1.5 py-0.5 text-xs font-bold shadow-lg"
                      style={{ backgroundColor: "#FFB800", color: "#0F1419" }}
                    >
                      {bus.line}
                    </div>
                    <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "6px solid #FFB800" }} />
                  </div>
                </Marker>
              ))}

              <Marker longitude={userLng} latitude={userLat} anchor="center">
                <div className="relative flex items-center justify-center">
                  <div className="absolute rounded-full animate-ping" style={{ width: 20, height: 20, backgroundColor: "#3B82F6", opacity: 0.4 }} />
                  <div className="relative rounded-full border-2 border-white" style={{ width: 14, height: 14, backgroundColor: "#3B82F6" }} />
                </div>
              </Marker>
            </Map>

            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
              <span className="font-signage-wide rounded-md px-2 py-1 text-[11px]" style={{ backgroundColor: "rgba(8, 16, 23, 0.88)", color: "#E8ECEF", border: "1px solid rgba(255,255,255,0.08)" }}>
                Rota monitorada
              </span>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center px-4 text-center" style={{ backgroundColor: "#1A2332" }}>
            <p className="font-signage text-[11px] max-w-xs" style={{ color: "#6B7D8E" }}>
              Mapa indisponível. Configure NEXT_PUBLIC_MAPBOX_TOKEN.
            </p>
          </div>
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="mx-4 mt-3 rounded-xl px-4 py-3" style={{ backgroundColor: "#FF444415", border: "1px solid #FF444430" }}>
            <p className="font-signage text-[11px] font-semibold" style={{ color: "#FF4444" }}>Erro ao carregar dados</p>
            <p className="font-signage text-[11px] mt-1" style={{ color: "#6B7D8E" }}>{error}</p>
          </div>
        )}
        {/* Vehicles section */}
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-signage-wide text-[12px] font-semibold" style={{ color: "#FFB800" }}>
              Veículos em operação
            </span>
            <span className="font-signage text-[11px]" style={{ color: "#6B7D8E" }}>
              {vehicles.length} ativo{vehicles.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {loading && vehicles.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#FFB800", borderTopColor: "transparent" }} />
              </div>
            ) : vehicles.length === 0 ? (
              <p className="font-signage text-[11px] text-center py-4" style={{ color: "#6B7D8E" }}>
                Nenhum veículo localizado
              </p>
            ) : (
              sortedVehicles.map((v) => (
                <VehicleCard key={v.p} v={v} userLat={userLat} userLng={userLng} lineName={bus.line} />
              ))
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 my-3 h-px" style={{ backgroundColor: "#ffffff10" }} />

        {/* Stops with predictions section */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-signage-wide text-[12px] font-semibold" style={{ color: "#00A651" }}>
              Paradas da linha
            </span>
            <span className="font-signage text-[11px]" style={{ color: "#6B7D8E" }}>
              {stopsWithPredictions.length} com previsão
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {loading && stopsWithPredictions.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#00A651", borderTopColor: "transparent" }} />
              </div>
            ) : stopsWithPredictions.length === 0 ? (
              <p className="font-signage text-[11px] text-center py-4" style={{ color: "#6B7D8E" }}>
                Nenhuma parada com previsão neste raio
              </p>
            ) : (
              stopsWithPredictions.map((stop) => (
                <StopPredictionCard key={stop.cp} stop={stop} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
