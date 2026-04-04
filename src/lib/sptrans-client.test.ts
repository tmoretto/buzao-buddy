import { afterEach, describe, expect, it, vi } from "vitest";

function authResponse(cookie: string, ok: boolean = true, status: number = 200) {
  return new Response("true", {
    status,
    headers: ok ? { "set-cookie": cookie } : undefined,
  });
}

function jsonResponse(body: unknown, status: number = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("sptrans-client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("re-authenticates once after an unauthorized upstream response", async () => {
    vi.stubEnv("SPTRANS_TOKEN", "token-123");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(authResponse("session=first"))
      .mockResolvedValueOnce(jsonResponse({ error: "expired" }, 401))
      .mockResolvedValueOnce(authResponse("session=second"))
      .mockResolvedValueOnce(jsonResponse([{ cp: 1 }]));

    vi.stubGlobal("fetch", fetchMock);

    const { searchStops } = await import("@/lib/sptrans-client");

    await expect(searchStops("paulista")).resolves.toEqual([{ cp: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      headers: { Cookie: "session=first" },
    });
    expect(fetchMock.mock.calls[3]?.[1]).toMatchObject({
      headers: { Cookie: "session=second" },
    });
  });

  it("throws a 500-class domain error when the token is missing", async () => {
    vi.stubEnv("SPTRANS_TOKEN", "");
    vi.stubGlobal("fetch", vi.fn());

    const { getAllPositions, SpTransError } = await import("@/lib/sptrans-client");

    const promise = getAllPositions();

    await expect(promise).rejects.toBeInstanceOf(SpTransError);
    await expect(promise).rejects.toMatchObject({ status: 500 });
  });

  it("surfaces upstream response details for non-ok responses", async () => {
    vi.stubEnv("SPTRANS_TOKEN", "token-123");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(authResponse("session=first"))
      .mockResolvedValueOnce(new Response("upstream exploded", { status: 502 }));

    vi.stubGlobal("fetch", fetchMock);

    const { getAllPositions, SpTransError } = await import("@/lib/sptrans-client");

    const promise = getAllPositions();

    await expect(promise).rejects.toBeInstanceOf(SpTransError);
    await expect(promise).rejects.toThrow("SPTrans request to /Posicao failed with 502: upstream exploded");
  });
});