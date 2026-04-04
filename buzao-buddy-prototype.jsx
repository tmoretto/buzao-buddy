import { useState, useEffect, useCallback, useRef } from "react";

// --- Mock data simulating SPTrans API responses ---
const MOCK_STOPS = [
  { cp: 4200953, np: "Av. Paulista, 1578", ed: "AV PAULISTA / R HADDOCK LOBO", py: -23.5613, px: -46.6560, distance: 120 },
  { cp: 7001234, np: "R. Augusta, 2100", ed: "R AUGUSTA / R OSCAR FREIRE", py: -23.5580, px: -46.6625, distance: 280 },
  { cp: 7005678, np: "R. da Consolação, 2300", ed: "R DA CONSOLACAO / AV PAULISTA", py: -23.5560, px: -46.6610, distance: 350 },
  { cp: 7009012, np: "Av. Rebouças, 600", ed: "AV REBOUCAS / R OSCAR FREIRE", py: -23.5640, px: -46.6720, distance: 510 },
  { cp: 7003456, np: "Al. Santos, 1200", ed: "AL SANTOS / R PEIXOTO GOMIDE", py: -23.5650, px: -46.6540, distance: 620 },
];

const MOCK_PREDICTIONS = {
  4200953: [
    { line: "875A-10", dest: "Term. Pq. D. Pedro II", cl: 34041, vehicles: [
      { p: "74101", t: 3, a: true },
      { p: "74205", t: 12, a: false },
      { p: "74310", t: 24, a: true },
    ]},
    { line: "917H-10", dest: "Lapa", cl: 35012, vehicles: [
      { p: "62003", t: 7, a: false },
      { p: "62108", t: 19, a: true },
    ]},
    { line: "908T-10", dest: "Term. Princ. Isabel", cl: 33890, vehicles: [
      { p: "51442", t: 15, a: true },
    ]},
  ],
  7001234: [
    { line: "7021-10", dest: "Jd. Maracá", cl: 1989, vehicles: [
      { p: "74558", t: 5, a: true },
      { p: "74602", t: 18, a: false },
    ]},
    { line: "715M-10", dest: "Lgo. da Pólvora", cl: 33258, vehicles: [
      { p: "81003", t: 9, a: false },
      { p: "81107", t: 22, a: true },
    ]},
  ],
  7005678: [
    { line: "875A-10", dest: "Term. Pq. D. Pedro II", cl: 34041, vehicles: [
      { p: "74101", t: 6, a: true },
    ]},
    { line: "107T-10", dest: "Term. Parque Dom Pedro II", cl: 34550, vehicles: [
      { p: "45210", t: 2, a: false },
      { p: "45315", t: 14, a: true },
    ]},
  ],
  7009012: [
    { line: "7181-10", dest: "Shopping Eldorado", cl: 34820, vehicles: [
      { p: "88010", t: 4, a: true },
      { p: "88115", t: 16, a: false },
    ]},
  ],
  7003456: [
    { line: "917H-10", dest: "Lapa", cl: 35012, vehicles: [
      { p: "62200", t: 8, a: true },
      { p: "62305", t: 21, a: false },
    ]},
    { line: "908T-10", dest: "Term. Princ. Isabel", cl: 33890, vehicles: [
      { p: "51550", t: 11, a: true },
    ]},
  ],
};

const WALKING_SPEED = 75; // meters per minute

function formatTime(min) {
  if (min <= 0) return "agora";
  if (min < 1) return "<1 min";
  return `${Math.round(min)} min`;
}

function getArrivalColor(minutes) {
  if (minutes <= 3) return "#FF4444";
  if (minutes <= 8) return "#FFB800";
  return "#00C853";
}

function getLeaveStatus(arrivalMin, walkMin) {
  const buffer = arrivalMin - walkMin - 1;
  if (buffer < 0) return { text: "Já era!", color: "#FF4444", emoji: "😰" };
  if (buffer < 2) return { text: "Saia AGORA!", color: "#FF4444", emoji: "🏃" };
  if (buffer < 5) return { text: `Saia em ${Math.round(buffer)} min`, color: "#FFB800", emoji: "⚡" };
  return { text: `Saia em ${Math.round(buffer)} min`, color: "#00C853", emoji: "😎" };
}

// --- Components ---

function PulsingDot({ color = "#00C853", size = 10 }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{
          backgroundColor: color,
          animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
        }}
      />
      <span
        className="relative inline-flex rounded-full h-full w-full"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

function VehicleRow({ vehicle, walkMin }) {
  const [countdown, setCountdown] = useState(vehicle.t);
  const arrivalColor = getArrivalColor(countdown);
  const status = getLeaveStatus(countdown, walkMin);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1/60));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
      <div className="flex items-center gap-2.5">
        <div className="flex flex-col items-center" style={{ minWidth: 48 }}>
          <span className="text-lg font-bold" style={{ color: arrivalColor, fontFamily: "'JetBrains Mono', monospace" }}>
            {formatTime(countdown)}
          </span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: "#6B7D8E" }}>#{vehicle.p}</span>
            {vehicle.a && <span className="text-xs" title="Acessível">♿</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${status.color}20`, color: status.color }}>
          {status.emoji} {status.text}
        </span>
      </div>
    </div>
  );
}

function LineCard({ prediction, walkMin, isExpanded, onToggle }) {
  const nextArrival = prediction.vehicles[0]?.t || 99;
  const arrivalColor = getArrivalColor(nextArrival);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: "#1A2332",
        border: isExpanded ? `1px solid ${arrivalColor}40` : "1px solid transparent",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg font-bold text-sm"
            style={{
              backgroundColor: "#FFB800",
              color: "#0F1419",
              minWidth: 72,
              height: 32,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {prediction.line.replace("-10", "")}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm" style={{ color: "#E8ECEF" }}>{prediction.dest}</span>
            <span className="text-xs" style={{ color: "#6B7D8E" }}>
              {prediction.vehicles.length} {prediction.vehicles.length === 1 ? "veículo" : "veículos"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PulsingDot color={arrivalColor} size={8} />
          <span className="text-lg font-bold" style={{ color: arrivalColor, fontFamily: "'JetBrains Mono', monospace" }}>
            {formatTime(nextArrival)}
          </span>
          <svg
            className="transition-transform duration-200"
            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", color: "#6B7D8E" }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          <div className="h-px w-full" style={{ backgroundColor: "#ffffff10" }} />
          {prediction.vehicles.map((v, i) => (
            <VehicleRow key={v.p} vehicle={v} walkMin={walkMin} />
          ))}
        </div>
      )}
    </div>
  );
}

function StopDetail({ stop, onBack }) {
  const predictions = MOCK_PREDICTIONS[stop.cp] || [];
  const walkMin = stop.distance / WALKING_SPEED;
  const [expandedLine, setExpandedLine] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLastUpdate(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center gap-3" style={{ backgroundColor: "#1A2332" }}>
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8ECEF" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold truncate" style={{ color: "#E8ECEF" }}>{stop.np}</h2>
          <p className="text-xs truncate" style={{ color: "#6B7D8E" }}>{stop.ed}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs" style={{ color: "#6B7D8E" }}>~{formatTime(walkMin)} caminhando</span>
          <span className="text-xs" style={{ color: "#6B7D8E" }}>{stop.distance}m</span>
        </div>
      </div>

      {/* Refresh bar */}
      <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: "#0F1419" }}>
        <div className="flex items-center gap-2">
          <PulsingDot color="#00C853" size={6} />
          <span className="text-xs" style={{ color: "#6B7D8E" }}>
            Atualizado às {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <span className="text-xs" style={{ color: "#6B7D8E" }}>
          {predictions.reduce((acc, p) => acc + p.vehicles.length, 0)} ônibus rastreados
        </span>
      </div>

      {/* Predictions */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5" style={{ backgroundColor: "#0F1419" }}>
        {predictions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="text-4xl">🚌</span>
            <p className="text-sm" style={{ color: "#6B7D8E" }}>Nenhuma previsão disponível</p>
          </div>
        ) : (
          predictions.map((pred, i) => (
            <LineCard
              key={pred.cl}
              prediction={pred}
              walkMin={walkMin}
              isExpanded={expandedLine === i}
              onToggle={() => setExpandedLine(expandedLine === i ? -1 : i)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StopRow({ stop, onClick, index }) {
  const predictions = MOCK_PREDICTIONS[stop.cp] || [];
  const nextArrival = predictions.length > 0
    ? Math.min(...predictions.flatMap((p) => p.vehicles.map((v) => v.t)))
    : null;
  const walkMin = stop.distance / WALKING_SPEED;
  const lineCount = predictions.length;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
      style={{
        backgroundColor: "#1A2332",
        animationDelay: `${index * 80}ms`,
        animation: "slideUp 0.4s ease-out both",
      }}
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
          ~{formatTime(walkMin)}
        </span>
      </div>

      {/* Stop info */}
      <div className="flex-1 min-w-0 flex flex-col items-start">
        <span className="text-sm font-medium truncate w-full text-left" style={{ color: "#E8ECEF" }}>{stop.np}</span>
        <span className="text-xs" style={{ color: "#6B7D8E" }}>
          {lineCount} {lineCount === 1 ? "linha" : "linhas"} • {predictions.reduce((a, p) => a + p.vehicles.length, 0)} ônibus
        </span>
      </div>

      {/* Next arrival */}
      {nextArrival !== null && (
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5">
            <PulsingDot color={getArrivalColor(nextArrival)} size={6} />
            <span className="text-base font-bold" style={{ color: getArrivalColor(nextArrival), fontFamily: "'JetBrains Mono', monospace" }}>
              {formatTime(nextArrival)}
            </span>
          </div>
          <span className="text-xs" style={{ color: "#6B7D8E" }}>próximo</span>
        </div>
      )}

      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7D8E" strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

function SmartBanner() {
  const bestStop = MOCK_STOPS[0];
  const predictions = MOCK_PREDICTIONS[bestStop.cp] || [];
  const nextBus = predictions[0]?.vehicles[0];
  const walkMin = bestStop.distance / WALKING_SPEED;

  if (!nextBus) return null;

  const status = getLeaveStatus(nextBus.t, walkMin);

  return (
    <div
      className="mx-4 mt-4 mb-2 p-3 rounded-2xl flex items-center gap-3"
      style={{
        background: `linear-gradient(135deg, ${status.color}15, ${status.color}05)`,
        border: `1px solid ${status.color}30`,
      }}
    >
      <span className="text-2xl">{status.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: status.color }}>{status.text}</p>
        <p className="text-xs" style={{ color: "#6B7D8E" }}>
          {predictions[0].line.replace("-10", "")} → {predictions[0].dest} • chega em {formatTime(nextBus.t)}
        </p>
      </div>
    </div>
  );
}

// --- Main App ---
export default function BuzaoBuddy() {
  const [selectedStop, setSelectedStop] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLocating(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const filteredStops = MOCK_STOPS.filter(
    (s) =>
      s.np.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ed.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedStop) {
    return (
      <div className="h-screen flex flex-col" style={{ backgroundColor: "#0F1419", fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;700&display=swap');
          @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
        <StopDetail stop={selectedStop} onBack={() => setSelectedStop(null)} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "#0F1419", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;700&display=swap');
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes busSlide { 0% { transform: translateX(-20px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
      `}</style>

      {/* Header */}
      <div className="px-4 pt-5 pb-3" style={{ backgroundColor: "#0F1419" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ backgroundColor: "#FFB800", animation: "busSlide 0.6s ease-out" }}
            >
              🚌
            </div>
            <div>
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ color: "#E8ECEF", animation: "fadeIn 0.5s ease-out" }}
              >
                Buzão Buddy
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <PulsingDot color="#00C853" />
            <span className="text-xs font-medium" style={{ color: "#00C853" }}>
              {isLocating ? "Localizando..." : "Av. Paulista"}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7D8E" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar parada ou endereço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
            style={{
              backgroundColor: "#1A2332",
              color: "#E8ECEF",
              border: "1px solid #ffffff10",
              focusRingColor: "#00A651",
            }}
          />
        </div>
      </div>

      {/* Smart banner */}
      {!isLocating && <SmartBanner />}

      {/* Stops list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex items-center justify-between mb-2 mt-2">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#6B7D8E" }}>
            Paradas próximas
          </span>
          <span className="text-xs" style={{ color: "#6B7D8E" }}>
            {filteredStops.length} encontradas
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {isLocating ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ animation: "fadeIn 0.3s ease-out" }}>
              <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#00A651", borderTopColor: "transparent" }} />
              <p className="text-sm" style={{ color: "#6B7D8E" }}>Buscando paradas próximas...</p>
            </div>
          ) : (
            filteredStops.map((stop, i) => (
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

      {/* Bottom bar */}
      <div className="px-4 py-3 flex items-center justify-center gap-1.5" style={{ backgroundColor: "#1A2332", borderTop: "1px solid #ffffff08" }}>
        <span className="text-xs" style={{ color: "#6B7D8E" }}>Protótipo</span>
        <span className="text-xs" style={{ color: "#ffffff15" }}>•</span>
        <span className="text-xs" style={{ color: "#6B7D8E" }}>Dados simulados</span>
        <span className="text-xs" style={{ color: "#ffffff15" }}>•</span>
        <span className="text-xs" style={{ color: "#FFB800" }}>SPTrans Olho Vivo API</span>
      </div>
    </div>
  );
}
