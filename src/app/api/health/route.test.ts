import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const sptransClientMock = vi.hoisted(() => ({
  getAllPositions: vi.fn(),
}));

vi.mock("@/lib/sptrans-client", () => sptransClientMock);

function makeRequest(path: string) {
  return new NextRequest(new Request(`http://localhost${path}`));
}

describe("health route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns ok when required env vars are configured", async () => {
    vi.stubEnv("SPTRANS_TOKEN", "secret-token");
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "public-token");

    const { GET } = await import("@/app/api/health/route");
    const response = await GET(makeRequest("/api/health"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      checks: {
        sptransTokenConfigured: true,
        publicMapboxTokenConfigured: true,
      },
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns degraded when any required env var is missing", async () => {
    vi.stubEnv("SPTRANS_TOKEN", "secret-token");
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "");

    const { GET } = await import("@/app/api/health/route");
    const response = await GET(makeRequest("/api/health"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "degraded",
      checks: {
        sptransTokenConfigured: true,
        publicMapboxTokenConfigured: false,
      },
    });
  });

  it("returns upstream diagnostics when requested and SPTrans is reachable", async () => {
    vi.stubEnv("SPTRANS_TOKEN", "secret-token");
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "public-token");
    sptransClientMock.getAllPositions.mockResolvedValueOnce({
      hr: "17:15",
      l: [
        { vs: [{}, {}] },
        { vs: [{}] },
      ],
    });

    const { GET } = await import("@/app/api/health/route");
    const response = await GET(makeRequest("/api/health?upstream=1"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      checks: {
        sptransTokenConfigured: true,
        publicMapboxTokenConfigured: true,
      },
      upstream: {
        sptransReachable: true,
        lineCount: 2,
        vehicleCount: 3,
        referenceTime: "17:15",
      },
    });
  });

  it("returns degraded when upstream probing is requested and SPTrans fails", async () => {
    vi.stubEnv("SPTRANS_TOKEN", "secret-token");
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "public-token");
    sptransClientMock.getAllPositions.mockRejectedValueOnce(new Error("SPTrans auth failed"));

    const { GET } = await import("@/app/api/health/route");
    const response = await GET(makeRequest("/api/health?upstream=1"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "degraded",
      checks: {
        sptransTokenConfigured: true,
        publicMapboxTokenConfigured: true,
      },
      upstream: {
        sptransReachable: false,
        error: "SPTrans auth failed",
      },
    });
  });
});