"use client";

import { useRef, useCallback } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/mapbox";
import type { NearbyBus, ParadaWithDistance } from "@/lib/types";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface Props {
  lat: number;
  lng: number;
  buses: NearbyBus[];
  stops: ParadaWithDistance[];
  selectedBus: string | null;
  selectedStop: number | null; // cp
  onSelectBus: (prefixo: string | null) => void;
  onSelectStop: (cp: number | null) => void;
}

export function BusMap({
  lat, lng,
  buses, stops,
  selectedBus, selectedStop,
  onSelectBus, onSelectStop,
}: Props) {
  const mapRef = useRef<MapRef>(null);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-full flex items-center justify-center px-4 text-center" style={{ backgroundColor: "#1A2332" }}>
        <p className="text-sm" style={{ color: "#6B7D8E" }}>
          Mapa indisponível. Configure NEXT_PUBLIC_MAPBOX_TOKEN no Vercel para exibir os ônibus no mapa.
        </p>
      </div>
    );
  }

  const handleBusClick = useCallback((prefixo: string) => {
    onSelectBus(prefixo === selectedBus ? null : prefixo);
    onSelectStop(null);
  }, [selectedBus, onSelectBus, onSelectStop]);

  const handleStopClick = useCallback((cp: number) => {
    onSelectStop(cp === selectedStop ? null : cp);
    onSelectBus(null);
  }, [selectedStop, onSelectStop, onSelectBus]);

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{ longitude: lng, latitude: lat, zoom: 15 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      attributionControl={false}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {/* Stop markers */}
      {stops.map((stop) => {
        const isSelected = selectedStop === stop.cp;
        return (
          <Marker
            key={`stop-${stop.cp}`}
            longitude={stop.px}
            latitude={stop.py}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleStopClick(stop.cp);
            }}
          >
            <div className="flex flex-col items-center cursor-pointer transition-all duration-150">
              {/* Pin head */}
              <div
                className="rounded-full flex items-center justify-center shadow-lg"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: isSelected ? "#00A651" : "#fff",
                  border: `3px solid ${isSelected ? "#fff" : "#00A651"}`,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isSelected ? "#fff" : "#00A651"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <rect x="3" y="3" width="18" height="13" rx="2" />
                  <path d="M3 8h18" />
                  <path d="M8 21v-5" />
                  <path d="M16 21v-5" />
                  <path d="M6 21h12" />
                </svg>
              </div>
              {/* Stem */}
              <div style={{ width: 3, height: 8, backgroundColor: isSelected ? "#00A651" : "#00A651" }} />
              {/* Dot */}
              <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#00A651" }} />
            </div>
          </Marker>
        );
      })}

      {/* User location */}
      <Marker longitude={lng} latitude={lat} anchor="center">
        <div className="relative flex items-center justify-center">
          <div
            className="absolute rounded-full animate-ping"
            style={{ width: 20, height: 20, backgroundColor: "#3B82F6", opacity: 0.4 }}
          />
          <div
            className="relative rounded-full border-2 border-white"
            style={{ width: 14, height: 14, backgroundColor: "#3B82F6" }}
          />
        </div>
      </Marker>

      {/* Bus markers */}
      {buses.map((bus) => {
        const isSelected = selectedBus === bus.prefixo;
        return (
          <Marker
            key={`bus-${bus.cl}-${bus.prefixo}`}
            longitude={bus.lng}
            latitude={bus.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleBusClick(bus.prefixo);
            }}
          >
            <div
              className="flex flex-col items-center cursor-pointer transition-transform"
              style={{ transform: isSelected ? "scale(1.15)" : "scale(1)" }}
            >
              <div
                className="flex items-center gap-1 rounded-lg shadow-lg"
                style={{
                  backgroundColor: isSelected ? "#00A651" : "#FFB800",
                  border: isSelected ? "2px solid #fff" : "none",
                  padding: "2px 6px",
                }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: "#0F1419", fontFamily: "monospace" }}
                >
                  {bus.line}
                </span>
                <span
                  className="text-xs"
                  style={{
                    color: "#0F1419",
                    opacity: 0.75,
                    maxWidth: 80,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  → {bus.destination}
                </span>
              </div>
              <div
                style={{
                  width: 0, height: 0,
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderTop: `6px solid ${isSelected ? "#00A651" : "#FFB800"}`,
                }}
              />
            </div>
          </Marker>
        );
      })}
    </Map>
  );
}
