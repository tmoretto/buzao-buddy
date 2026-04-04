// SPTrans Olho Vivo API types

export interface Linha {
  cl: number;   // código da linha (unique per direction)
  lc: boolean;  // circular flag
  lt: string;   // letreiro (sign, e.g. "715M")
  tl: number;   // tipo da linha
  sl: number;   // sentido: 1=TP→TS, 2=TS→TP
  tp: string;   // terminal principal
  ts: string;   // terminal secundário
}

export interface Parada {
  cp: number;   // código da parada
  np: string;   // nome da parada
  ed: string;   // endereço
  py: number;   // latitude
  px: number;   // longitude
}

export interface ParadaWithDistance extends Parada {
  distance: number; // meters from user
}

export interface Veiculo {
  p: string;    // prefixo
  a: boolean;   // acessível
  ta: string;   // last GPS update (ISO 8601 UTC)
  py: number;
  px: number;
}

export interface VeiculoPrevisao {
  p: string;    // prefixo
  t: string;    // predicted arrival time "HH:mm"
  a: boolean;   // acessível
  ta: string;   // last GPS update (ISO 8601 UTC)
  py: number;
  px: number;
}

export interface LinhaPrevisao {
  c: string;    // letreiro completo, e.g. "7021-10"
  cl: number;   // código da linha
  sl: number;   // sentido
  lt0: string;  // terminal principal
  lt1: string;  // terminal secundário
  qv: number;   // quantidade de veículos
  vs: VeiculoPrevisao[];
}

export interface VeiculoPosicao {
  p: string;    // prefixo
  a: boolean;   // acessível
  ta: string;   // last GPS update (ISO 8601 UTC)
  py: number;   // latitude
  px: number;   // longitude
}

export interface LinhaPosicao {
  c: string;    // letreiro completo
  cl: number;   // código da linha
  sl: number;   // sentido
  lt0: string;  // terminal principal
  lt1: string;  // terminal secundário
  qv: number;   // quantidade de veículos
  vs: VeiculoPosicao[];
}

export interface Posicao {
  hr: string;
  l: LinhaPosicao[];
}

export interface NearbyBus {
  line: string;       // letreiro, e.g. "715M"
  cl: number;
  destination: string;
  prefixo: string;
  accessible: boolean;
  distance: number;   // meters from user
  lastUpdate: string; // ISO 8601
  lat: number;
  lng: number;
}

export interface PrevisaoParada {
  hr: string;   // reference time
  p: {
    cp: number;
    np: string;
    py: number;
    px: number;
    l: LinhaPrevisao[];
  };
}
