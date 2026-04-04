import type { Parada, Posicao, PrevisaoParada } from "./types";

const BASE_URL = "https://api.olhovivo.sptrans.com.br/v2.1";

let sessionCookie: string | null = null;

export class SpTransError extends Error {
  constructor(
    message: string,
    readonly status: number = 502,
  ) {
    super(message);
    this.name = "SpTransError";
  }
}

function getToken(): string {
  const token = process.env.SPTRANS_TOKEN;
  if (!token) {
    throw new SpTransError("SPTrans token not configured", 500);
  }

  return token;
}

async function readErrorSnippet(res: Response): Promise<string> {
  try {
    const body = await res.text();
    return body.slice(0, 200);
  } catch {
    return "";
  }
}

async function ensureOk(res: Response, action: string): Promise<Response> {
  if (res.ok) {
    return res;
  }

  const snippet = await readErrorSnippet(res);
  const details = snippet ? `: ${snippet}` : "";
  throw new SpTransError(`${action} failed with ${res.status}${details}`);
}

export async function ensureAuthenticated(): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/Login/Autenticar?token=${token}`, {
    method: "POST",
    cache: "no-store",
  });

  await ensureOk(res, "SPTrans auth");

  const cookie = res.headers.get("set-cookie");
  if (!cookie) {
    throw new SpTransError("SPTrans auth failed: no cookie returned");
  }

  sessionCookie = cookie;
}

async function fetchWithAuth(path: string): Promise<Response> {
  if (!sessionCookie) {
    await ensureAuthenticated();
  }

  let res = await fetch(`${BASE_URL}${path}`, {
    headers: { Cookie: sessionCookie! },
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    await ensureAuthenticated();
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { Cookie: sessionCookie! },
      cache: "no-store",
    });
  }

  return ensureOk(res, `SPTrans request to ${path}`);
}

export async function searchStops(term: string): Promise<Parada[]> {
  const res = await fetchWithAuth(
    `/Parada/Buscar?termosBusca=${encodeURIComponent(term)}`
  );
  return res.json();
}

export async function getStopsForLine(codigoLinha: number): Promise<Parada[]> {
  const res = await fetchWithAuth(
    `/Parada/BuscarParadasPorLinha?codigoLinha=${codigoLinha}`
  );
  return res.json();
}

export async function getPredictionsForStop(
  codigoParada: number
): Promise<PrevisaoParada> {
  const res = await fetchWithAuth(
    `/Previsao/Parada?codigoParada=${codigoParada}`
  );
  return res.json();
}

export async function getAllPositions(): Promise<Posicao> {
  const res = await fetchWithAuth("/Posicao");
  return res.json();
}

export async function getPositionsForLine(codigoLinha: number): Promise<Posicao> {
  const res = await fetchWithAuth(`/Posicao/Linha?codigoLinha=${codigoLinha}`);
  return res.json();
}

export async function getPredictionsForLineAtStop(
  codigoParada: number,
  codigoLinha: number
): Promise<PrevisaoParada> {
  const res = await fetchWithAuth(
    `/Previsao?codigoParada=${codigoParada}&codigoLinha=${codigoLinha}`
  );
  return res.json();
}
