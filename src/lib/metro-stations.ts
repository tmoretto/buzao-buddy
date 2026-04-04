import { haversineDistance } from "./geo";

export interface TransitStation {
  name: string;
  lat: number;
  lng: number;
  line: string;
  type: "metro" | "cptm";
}

// Operational Metro and CPTM stations in metropolitan São Paulo
// Coordinates sourced from OpenStreetMap (ODbL)
export const TRANSIT_STATIONS: TransitStation[] = [
  // ── Metrô Linha 1 (Azul) ──
  { name: "Tucuruvi", lat: -23.480075, lng: -46.603270, line: "1-Azul", type: "metro" },
  { name: "Parada Inglesa", lat: -23.487, lng: -46.610, line: "1-Azul", type: "metro" },
  { name: "Jardim São Paulo", lat: -23.492403, lng: -46.617010, line: "1-Azul", type: "metro" },
  { name: "Santana", lat: -23.505, lng: -46.625, line: "1-Azul", type: "metro" },
  { name: "Carandiru", lat: -23.510, lng: -46.627, line: "1-Azul", type: "metro" },
  { name: "Portuguesa-Tietê", lat: -23.515641, lng: -46.625128, line: "1-Azul", type: "metro" },
  { name: "Armênia", lat: -23.524, lng: -46.628, line: "1-Azul", type: "metro" },
  { name: "Tiradentes", lat: -23.530911, lng: -46.632538, line: "1-Azul", type: "metro" },
  { name: "Luz", lat: -23.537067, lng: -46.633615, line: "1-Azul", type: "metro" },
  { name: "São Bento", lat: -23.544030, lng: -46.634311, line: "1-Azul", type: "metro" },
  { name: "Sé", lat: -23.550443, lng: -46.633446, line: "1-Azul", type: "metro" },
  { name: "Liberdade", lat: -23.554956, lng: -46.635718, line: "1-Azul", type: "metro" },
  { name: "São Joaquim", lat: -23.562680, lng: -46.639223, line: "1-Azul", type: "metro" },
  { name: "Vergueiro", lat: -23.568535, lng: -46.639918, line: "1-Azul", type: "metro" },
  { name: "Paraíso", lat: -23.575386, lng: -46.640960, line: "1-Azul", type: "metro" },
  { name: "Ana Rosa", lat: -23.581308, lng: -46.638396, line: "1-Azul", type: "metro" },
  { name: "Vila Mariana", lat: -23.589178, lng: -46.634668, line: "1-Azul", type: "metro" },
  { name: "Santa Cruz", lat: -23.599072, lng: -46.636688, line: "1-Azul", type: "metro" },
  { name: "Praça da Árvore", lat: -23.610505, lng: -46.637919, line: "1-Azul", type: "metro" },
  { name: "Saúde", lat: -23.618246, lng: -46.639190, line: "1-Azul", type: "metro" },
  { name: "São Judas", lat: -23.625809, lng: -46.640921, line: "1-Azul", type: "metro" },
  { name: "Conceição", lat: -23.635011, lng: -46.641295, line: "1-Azul", type: "metro" },
  { name: "Jabaquara", lat: -23.646338, lng: -46.641046, line: "1-Azul", type: "metro" },

  // ── Metrô Linha 2 (Verde) ──
  { name: "Vila Madalena", lat: -23.546496, lng: -46.691124, line: "2-Verde", type: "metro" },
  { name: "Sumaré", lat: -23.551028, lng: -46.677587, line: "2-Verde", type: "metro" },
  { name: "Clínicas", lat: -23.554051, lng: -46.670884, line: "2-Verde", type: "metro" },
  { name: "Consolação", lat: -23.557818, lng: -46.660537, line: "2-Verde", type: "metro" },
  { name: "Trianon-Masp", lat: -23.563312, lng: -46.654203, line: "2-Verde", type: "metro" },
  { name: "Brigadeiro", lat: -23.568589, lng: -46.647763, line: "2-Verde", type: "metro" },
  // Paraíso, Ana Rosa shared with L1
  { name: "Chácara Klabin", lat: -23.592681, lng: -46.630681, line: "2-Verde", type: "metro" },
  { name: "Santos-Imigrantes", lat: -23.597, lng: -46.621, line: "2-Verde", type: "metro" },
  { name: "Alto do Ipiranga", lat: -23.602237, lng: -46.612486, line: "2-Verde", type: "metro" },
  { name: "Sacomã", lat: -23.601282, lng: -46.602555, line: "2-Verde", type: "metro" },
  { name: "Tamanduateí", lat: -23.592787, lng: -46.589517, line: "2-Verde", type: "metro" },
  { name: "Vila Prudente", lat: -23.584427, lng: -46.581938, line: "2-Verde", type: "metro" },

  // ── Metrô Linha 3 (Vermelha) ──
  { name: "Palmeiras-Barra Funda", lat: -23.525974, lng: -46.667468, line: "3-Vermelha", type: "metro" },
  { name: "Marechal Deodoro", lat: -23.533981, lng: -46.655899, line: "3-Vermelha", type: "metro" },
  { name: "Santa Cecília", lat: -23.539324, lng: -46.648957, line: "3-Vermelha", type: "metro" },
  { name: "República", lat: -23.544094, lng: -46.642665, line: "3-Vermelha", type: "metro" },
  { name: "Anhangabaú", lat: -23.547819, lng: -46.639274, line: "3-Vermelha", type: "metro" },
  // Sé shared with L1
  { name: "Pedro II", lat: -23.549699, lng: -46.625982, line: "3-Vermelha", type: "metro" },
  { name: "Brás", lat: -23.547858, lng: -46.615920, line: "3-Vermelha", type: "metro" },
  { name: "Bresser-Mooca", lat: -23.546504, lng: -46.606930, line: "3-Vermelha", type: "metro" },
  { name: "Belém", lat: -23.542872, lng: -46.589615, line: "3-Vermelha", type: "metro" },
  { name: "Tatuapé", lat: -23.540252, lng: -46.576642, line: "3-Vermelha", type: "metro" },
  { name: "Carrão", lat: -23.537887, lng: -46.564262, line: "3-Vermelha", type: "metro" },
  { name: "Penha", lat: -23.533495, lng: -46.542669, line: "3-Vermelha", type: "metro" },
  { name: "Vila Matilde", lat: -23.531917, lng: -46.530873, line: "3-Vermelha", type: "metro" },
  { name: "Guilhermina-Esperança", lat: -23.529305, lng: -46.516640, line: "3-Vermelha", type: "metro" },
  { name: "Patriarca", lat: -23.531046, lng: -46.501577, line: "3-Vermelha", type: "metro" },
  { name: "Artur Alvim", lat: -23.540244, lng: -46.484706, line: "3-Vermelha", type: "metro" },
  { name: "Corinthians-Itaquera", lat: -23.542299, lng: -46.471207, line: "3-Vermelha", type: "metro" },

  // ── Metrô Linha 4 (Amarela) ──
  // Luz, República shared with other lines
  { name: "Higienópolis-Mackenzie", lat: -23.548959, lng: -46.652305, line: "4-Amarela", type: "metro" },
  { name: "Paulista", lat: -23.555246, lng: -46.662268, line: "4-Amarela", type: "metro" },
  { name: "Oscar Freire", lat: -23.558, lng: -46.672, line: "4-Amarela", type: "metro" },
  { name: "Fradique Coutinho", lat: -23.566228, lng: -46.684139, line: "4-Amarela", type: "metro" },
  { name: "Faria Lima", lat: -23.567255, lng: -46.693959, line: "4-Amarela", type: "metro" },
  { name: "Pinheiros", lat: -23.567249, lng: -46.701951, line: "4-Amarela", type: "metro" },
  { name: "Butantã", lat: -23.571900, lng: -46.708090, line: "4-Amarela", type: "metro" },
  { name: "São Paulo-Morumbi", lat: -23.586137, lng: -46.723912, line: "4-Amarela", type: "metro" },
  { name: "Vila Sônia", lat: -23.593434, lng: -46.734809, line: "4-Amarela", type: "metro" },

  // ── Metrô Linha 5 (Lilás) ──
  { name: "Capão Redondo", lat: -23.659169, lng: -46.768001, line: "5-Lilás", type: "metro" },
  { name: "Campo Limpo", lat: -23.649287, lng: -46.758948, line: "5-Lilás", type: "metro" },
  { name: "Vila das Belezas", lat: -23.640248, lng: -46.745769, line: "5-Lilás", type: "metro" },
  { name: "Giovanni Gronchi", lat: -23.643930, lng: -46.733983, line: "5-Lilás", type: "metro" },
  { name: "Santo Amaro", lat: -23.655655, lng: -46.720973, line: "5-Lilás", type: "metro" },
  { name: "Largo Treze", lat: -23.654458, lng: -46.710166, line: "5-Lilás", type: "metro" },
  { name: "Adolfo Pinheiro", lat: -23.650073, lng: -46.704206, line: "5-Lilás", type: "metro" },
  { name: "Alto da Boa Vista", lat: -23.641634, lng: -46.699420, line: "5-Lilás", type: "metro" },
  { name: "Borba Gato", lat: -23.633466, lng: -46.692867, line: "5-Lilás", type: "metro" },
  { name: "Brooklin", lat: -23.626802, lng: -46.688128, line: "5-Lilás", type: "metro" },
  { name: "Campo Belo", lat: -23.618731, lng: -46.682268, line: "5-Lilás", type: "metro" },
  { name: "Eucaliptos", lat: -23.610, lng: -46.672, line: "5-Lilás", type: "metro" },
  { name: "Moema", lat: -23.603776, lng: -46.662133, line: "5-Lilás", type: "metro" },
  { name: "AACD-Servidor", lat: -23.597848, lng: -46.652388, line: "5-Lilás", type: "metro" },
  { name: "Hospital São Paulo", lat: -23.598383, lng: -46.645591, line: "5-Lilás", type: "metro" },
  // Santa Cruz, Chácara Klabin shared

  // ── Metrô Linha 15 (Prata – Monotrilho) ──
  { name: "Vila Prudente (L15)", lat: -23.584, lng: -46.582, line: "15-Prata", type: "metro" },
  { name: "Oratório", lat: -23.585, lng: -46.569, line: "15-Prata", type: "metro" },
  { name: "São Lucas", lat: -23.588935, lng: -46.544635, line: "15-Prata", type: "metro" },
  { name: "Camilo Haddad", lat: -23.595540, lng: -46.537576, line: "15-Prata", type: "metro" },
  { name: "Vila Tolstói", lat: -23.600835, lng: -46.527217, line: "15-Prata", type: "metro" },
  { name: "Vila União", lat: -23.602965, lng: -46.515557, line: "15-Prata", type: "metro" },
  { name: "Jardim Planalto", lat: -23.608, lng: -46.508, line: "15-Prata", type: "metro" },
  { name: "Sapopemba", lat: -23.614706, lng: -46.500831, line: "15-Prata", type: "metro" },
  { name: "Fazenda da Juta", lat: -23.611818, lng: -46.487470, line: "15-Prata", type: "metro" },
  { name: "São Mateus", lat: -23.612319, lng: -46.477304, line: "15-Prata", type: "metro" },
  { name: "Jardim Colonial", lat: -23.612, lng: -46.466, line: "15-Prata", type: "metro" },

  // ── CPTM Linha 7 (Rubi) ──
  // Luz shared with metro
  // Palmeiras-Barra Funda shared with metro
  { name: "Água Branca", lat: -23.520532, lng: -46.688122, line: "7-Rubi", type: "cptm" },
  { name: "Lapa", lat: -23.519, lng: -46.701, line: "7-Rubi", type: "cptm" },
  { name: "Piqueri", lat: -23.503981, lng: -46.714818, line: "7-Rubi", type: "cptm" },
  { name: "Pirituba", lat: -23.488503, lng: -46.725997, line: "7-Rubi", type: "cptm" },
  { name: "Vila Clarice", lat: -23.475, lng: -46.734, line: "7-Rubi", type: "cptm" },
  { name: "Jaraguá", lat: -23.455113, lng: -46.738797, line: "7-Rubi", type: "cptm" },
  { name: "Perus", lat: -23.406, lng: -46.755, line: "7-Rubi", type: "cptm" },

  // ── CPTM Linha 8 (Diamante) ──
  { name: "Júlio Prestes", lat: -23.535, lng: -46.643, line: "8-Diamante", type: "cptm" },
  // Palmeiras, Lapa shared
  { name: "Domingos de Morais", lat: -23.519, lng: -46.710, line: "8-Diamante", type: "cptm" },
  { name: "Imperatriz Leopoldina", lat: -23.519, lng: -46.726, line: "8-Diamante", type: "cptm" },
  { name: "Presidente Altino", lat: -23.520, lng: -46.746, line: "8-Diamante", type: "cptm" },
  { name: "Osasco", lat: -23.533, lng: -46.786, line: "8-Diamante", type: "cptm" },

  // ── CPTM Linha 9 (Esmeralda) ──
  // Osasco, Pres. Altino shared with L8
  { name: "Ceasa", lat: -23.543, lng: -46.742, line: "9-Esmeralda", type: "cptm" },
  { name: "Vila Lobos-Jaguaré", lat: -23.554, lng: -46.733, line: "9-Esmeralda", type: "cptm" },
  { name: "Cidade Universitária", lat: -23.560, lng: -46.724, line: "9-Esmeralda", type: "cptm" },
  // Pinheiros shared with metro L4
  { name: "Hebraica-Rebouças", lat: -23.573, lng: -46.701, line: "9-Esmeralda", type: "cptm" },
  { name: "Cidade Jardim", lat: -23.586, lng: -46.694, line: "9-Esmeralda", type: "cptm" },
  { name: "Vila Olímpia", lat: -23.595, lng: -46.686, line: "9-Esmeralda", type: "cptm" },
  { name: "Berrini", lat: -23.602, lng: -46.689, line: "9-Esmeralda", type: "cptm" },
  { name: "Morumbi", lat: -23.610, lng: -46.699, line: "9-Esmeralda", type: "cptm" },
  { name: "Granja Julieta", lat: -23.625, lng: -46.704, line: "9-Esmeralda", type: "cptm" },
  // Santo Amaro shared with metro L5
  { name: "Socorro", lat: -23.663262, lng: -46.710956, line: "9-Esmeralda", type: "cptm" },
  { name: "Jurubatuba", lat: -23.676, lng: -46.711, line: "9-Esmeralda", type: "cptm" },
  { name: "Autódromo", lat: -23.698, lng: -46.697, line: "9-Esmeralda", type: "cptm" },
  { name: "Interlagos", lat: -23.711, lng: -46.690, line: "9-Esmeralda", type: "cptm" },
  { name: "Grajaú", lat: -23.742, lng: -46.692, line: "9-Esmeralda", type: "cptm" },

  // ── CPTM Linha 10 (Turquesa) ──
  // Brás, Tamanduateí shared
  { name: "Juventus-Mooca", lat: -23.555, lng: -46.607, line: "10-Turquesa", type: "cptm" },
  { name: "Ipiranga", lat: -23.586, lng: -46.609, line: "10-Turquesa", type: "cptm" },
  { name: "São Caetano do Sul", lat: -23.618, lng: -46.573, line: "10-Turquesa", type: "cptm" },
  { name: "Utinga", lat: -23.634, lng: -46.567, line: "10-Turquesa", type: "cptm" },
  { name: "Prefeito Saladino", lat: -23.639, lng: -46.555, line: "10-Turquesa", type: "cptm" },
  { name: "Santo André", lat: -23.647, lng: -46.536, line: "10-Turquesa", type: "cptm" },

  // ── CPTM Linha 11 (Coral) ──
  // Luz, Brás, Tatuapé shared
  { name: "Engenheiro Goulart", lat: -23.498095, lng: -46.519895, line: "11-Coral", type: "cptm" },
  { name: "USP Leste", lat: -23.493, lng: -46.506, line: "11-Coral", type: "cptm" },
  { name: "Comendador Ermelino", lat: -23.496, lng: -46.482, line: "11-Coral", type: "cptm" },
  // Corinthians-Itaquera shared with metro L3
  { name: "Dom Bosco", lat: -23.538, lng: -46.452, line: "11-Coral", type: "cptm" },
  { name: "José Bonifácio", lat: -23.536, lng: -46.439, line: "11-Coral", type: "cptm" },
  { name: "Guaianases", lat: -23.539, lng: -46.418, line: "11-Coral", type: "cptm" },
  { name: "Ferraz de Vasconcelos", lat: -23.540, lng: -46.370, line: "11-Coral", type: "cptm" },

  // ── CPTM Linha 12 (Safira) ──
  // Brás, Tatuapé, Eng. Goulart, Comendador Ermelino shared
  { name: "São Miguel Paulista", lat: -23.490559, lng: -46.443666, line: "12-Safira", type: "cptm" },
  { name: "Itaim Paulista", lat: -23.494, lng: -46.415, line: "12-Safira", type: "cptm" },
  { name: "Jardim Romano", lat: -23.494, lng: -46.400, line: "12-Safira", type: "cptm" },

  // ── CPTM Linha 13 (Jade) ──
  // Eng. Goulart shared
  { name: "Guarulhos-CECAP", lat: -23.447414, lng: -46.493747, line: "13-Jade", type: "cptm" },
  { name: "Aeroporto-Guarulhos", lat: -23.435, lng: -46.475, line: "13-Jade", type: "cptm" },
];

const PROXIMITY_RADIUS_M = 350;

export interface NearbyTransitConnection {
  station: TransitStation;
  distance: number;
  source: "terminal" | "route";
}

/**
 * Find transit stations near any of the given route stop coordinates.
 */
export function findTransitNearRoute(
  stops: Array<{ py: number; px: number }>,
): NearbyTransitConnection[] {
  const found = new Map<string, NearbyTransitConnection>();

  for (const stop of stops) {
    for (const station of TRANSIT_STATIONS) {
      const key = `${station.name}-${station.line}`;
      if (found.has(key)) continue;

      const dist = haversineDistance(stop.py, stop.px, station.lat, station.lng);
      if (dist <= PROXIMITY_RADIUS_M) {
        found.set(key, { station, distance: Math.round(dist), source: "route" });
      }
    }
  }

  return Array.from(found.values()).sort((a, b) => a.distance - b.distance);
}

// Normalize for fuzzy matching: strip accents, prefixes, punctuation
function normalize(s: string): string {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/^(METRO|TERM\.?|TERMINAL|ESTACAO|EST\.?)\s*/g, "")
    .replace(/[-–—]/g, " ")
    .trim();
}

/**
 * Match terminal names (origin/destination) against known station names.
 * Catches cases where SPTrans returns few stops and the terminal itself isn't listed.
 * e.g. "TERM. PINHEIROS" matches station "Pinheiros", "METRÔ BARRA FUNDA" matches "Palmeiras-Barra Funda"
 */
export function findTransitByTerminalName(
  terminals: string[],
): NearbyTransitConnection[] {
  const found = new Map<string, NearbyTransitConnection>();

  for (const terminal of terminals) {
    if (!terminal) continue;
    const norm = normalize(terminal);
    if (!norm) continue;

    for (const station of TRANSIT_STATIONS) {
      const key = `${station.name}-${station.line}`;
      if (found.has(key)) continue;

      const stationNorm = normalize(station.name);
      // Match if either contains the other, but require the shorter string
      // to be at least 60% of the longer one to avoid "AEROPORTO" matching "AEROPORTO GUARULHOS"
      const shorter = norm.length <= stationNorm.length ? norm : stationNorm;
      const longer = norm.length <= stationNorm.length ? stationNorm : norm;
      if (longer.includes(shorter) && shorter.length >= longer.length * 0.5) {
        found.set(key, { station, distance: 0, source: "terminal" });
      }
    }
  }

  return Array.from(found.values());
}

/**
 * Deduplicate connections by station name (prefer closest distance).
 * Groups multi-line stations into a single entry.
 */
export interface GroupedTransitConnection {
  name: string;
  lines: string[];
  type: "metro" | "cptm" | "both";
  distance: number;
  source: "terminal" | "route";
  lat: number;
  lng: number;
}

export function groupTransitConnections(
  connections: NearbyTransitConnection[],
): GroupedTransitConnection[] {
  const groups = new Map<string, GroupedTransitConnection>();

  for (const c of connections) {
    const existing = groups.get(c.station.name);
    if (existing) {
      if (!existing.lines.includes(c.station.line)) {
        existing.lines.push(c.station.line);
      }
      if (existing.type !== c.station.type) existing.type = "both";
      if (c.distance < existing.distance) existing.distance = c.distance;
    } else {
      groups.set(c.station.name, {
        name: c.station.name,
        lines: [c.station.line],
        type: c.station.type,
        distance: c.distance,
        source: c.source,
        lat: c.station.lat,
        lng: c.station.lng,
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => a.distance - b.distance);
}
