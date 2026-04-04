import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sptransClientMock = vi.hoisted(() => ({
  ensureAuthenticated: vi.fn(),
  getPositionsForLine: vi.fn(),
  getPredictionsForStop: vi.fn(),
  getStopsForLine: vi.fn(),
  searchStops: vi.fn(),
  SpTransError: class SpTransError extends Error {
    constructor(
      message: string,
      readonly status: number = 502,
    ) {
      super(message);
    }
  },
}));

vi.mock("@/lib/sptrans-client", () => sptransClientMock);

function makeRequest(path: string) {
  return new NextRequest(new Request(`http://localhost${path}`));
}

async function readJson(response: Response) {
  return response.json();
}

describe("SPTrans route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects invalid stop ids before calling the upstream client", async () => {
    const { GET } = await import("@/app/api/sptrans/predictions/route");

    const response = await GET(makeRequest("/api/sptrans/predictions?stopId=abc"));

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: "Invalid query param: stopId",
    });
    expect(sptransClientMock.getPredictionsForStop).not.toHaveBeenCalled();
  });

  it("rejects invalid line codes for line stop lookup", async () => {
    const { GET } = await import("@/app/api/sptrans/stops/line/route");

    const response = await GET(makeRequest("/api/sptrans/stops/line?cl=-1"));

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({ error: "Invalid param: cl" });
    expect(sptransClientMock.getStopsForLine).not.toHaveBeenCalled();
  });

  it("normalizes stop search terms before delegating", async () => {
    sptransClientMock.searchStops.mockResolvedValueOnce([]);
    const { GET } = await import("@/app/api/sptrans/stops/route");

    const response = await GET(makeRequest("/api/sptrans/stops?q=%20paulista%20"));

    expect(response.status).toBe(200);
    expect(sptransClientMock.searchStops).toHaveBeenCalledWith("paulista");
  });

  it("returns 404 for the auth endpoint outside development", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { POST } = await import("@/app/api/sptrans/auth/route");

    const response = await POST();

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: "Not found" });
    expect(sptransClientMock.ensureAuthenticated).not.toHaveBeenCalled();
  });

  it("returns 204 for the auth endpoint in development after authenticating", async () => {
    vi.stubEnv("NODE_ENV", "development");
    sptransClientMock.ensureAuthenticated.mockResolvedValueOnce(undefined);
    const { POST } = await import("@/app/api/sptrans/auth/route");

    const response = await POST();

    expect(response.status).toBe(204);
    expect(sptransClientMock.ensureAuthenticated).toHaveBeenCalledTimes(1);
  });

  it("passes validated line codes through to positions lookup", async () => {
    sptransClientMock.getPositionsForLine.mockResolvedValueOnce({ hr: "12:00", l: [] });
    const { GET } = await import("@/app/api/sptrans/positions/line/route");

    const response = await GET(makeRequest("/api/sptrans/positions/line?cl=1234"));

    expect(response.status).toBe(200);
    expect(sptransClientMock.getPositionsForLine).toHaveBeenCalledWith(1234);
  });
});