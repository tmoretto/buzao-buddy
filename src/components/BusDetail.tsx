"use client";

import { useMemo } from "react";
import Map, { Marker, Source, Layer, NavigationControl } from "react-map-gl/mapbox";
import type { LayerProps } from "react-map-gl/mapbox";
import type { NearbyBus } from "@/lib/types";
import { useBusRoute } from "@/hooks/useBusRoute";
import { haversineDistance } from "@/lib/geo";
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
  paint: {
    "line-color": "#00A651",
    "line-width": 3,
    "line-opacity": 0.8,
  },
};

const circleOutlineLayer: LayerProps = {
  id: "radius-outline",
  type: "line",
  paint: { "line-color": "#3B82F6", "line-width": 1.5, "line-dasharray": [4, 3], "line-opacity": 0.5 },
};

interface Props {
  bus: NearbyBus;
  userLat: number;
  userLng: number;
  onBack: () => void;
}

export function BusDetail({ bus, userLat, userLng, onBack }: Props) {
  const { stops, stopsNearby, vehicles, loading } = useBusRoute(bus.cl, userLat, userLng);

  const circleGeoJSON = useMemo(() => makeCircleGeoJSON(userLat, userLng), [userLat, userLng]);

  const routeLineGeoJSON = useMemo(() => {
    if (stops.length < 2) return null;
    return {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: stops.map((s) => [s.px, s.py]),
      },
      properties: {},
    };
  }, [stops]);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#0F1419" }}>
      {/* Header */}
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
            <span className="font-signage text-[10px]" style={{ color: "#6B7D8E" }}>
              {loading
                ? "Carregando rota"
                : `${stopsNearby.length} paradas em 2km · ${vehicles.length} veículos`}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="font-signage-wide text-[11px] font-semibold" style={{ color: "#00A651" }}>
            Painel da linha
          </span>
          <span className="font-signage text-[10px]" style={{ color: "#6B7D8E" }}>
            raio operacional 2km
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        {MAPBOX_TOKEN ? (
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{ longitude: userLng, latitude: userLat, zoom: 14 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            attributionControl={false}
          >
            <NavigationControl position="top-right" showCompass={false} />

            {/* 2km radius circle */}
            <Source id="radius" type="geojson" data={circleGeoJSON}>
              <Layer id="radius-fill" type="fill" paint={{ "fill-color": "#3B82F6", "fill-opacity": 0.05 }} />
              <Layer {...circleOutlineLayer} />
            </Source>

            {/* Full route line */}
            {routeLineGeoJSON && (
              <Source id="route" type="geojson" data={routeLineGeoJSON}>
                <Layer {...routeLayer} />
              </Source>
            )}

            {/* All stop markers — nearby highlighted, far ones dimmed */}
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

            {/* Vehicle markers */}
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

            {/* User location */}
            <Marker longitude={userLng} latitude={userLat} anchor="center">
              <div className="relative flex items-center justify-center">
                <div className="absolute rounded-full animate-ping" style={{ width: 20, height: 20, backgroundColor: "#3B82F6", opacity: 0.4 }} />
                <div className="relative rounded-full border-2 border-white" style={{ width: 14, height: 14, backgroundColor: "#3B82F6" }} />
              </div>
            </Marker>
          </Map>
        ) : (
          <div className="h-full flex items-center justify-center px-4 text-center" style={{ backgroundColor: "#1A2332" }}>
            <p className="font-signage text-[10px] max-w-xs" style={{ color: "#6B7D8E" }}>
              Mapa indisponível. Configure NEXT_PUBLIC_MAPBOX_TOKEN no Vercel para exibir a rota e os ônibus.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
