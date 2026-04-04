import { describe, expect, it, vi } from "vitest";
import { fetchJsonOrThrow } from "@/lib/http";

describe("http", () => {
  it("returns parsed JSON for successful responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJsonOrThrow<{ ok: boolean }>("/api/test")).resolves.toEqual({ ok: true });
  });

  it("throws a detailed error for failed responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("bad gateway", { status: 502 }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJsonOrThrow("/api/test")).rejects.toThrow("HTTP 502: bad gateway");
  });
});