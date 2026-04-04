import { describe, expect, it } from "vitest";
import { haversineDistance, sortStopsByDistance } from "@/lib/geo";

describe("geo", () => {
  it("returns zero distance for identical coordinates", () => {
    expect(haversineDistance(-23.55, -46.63, -23.55, -46.63)).toBe(0);
  });

  it("sorts stops from nearest to farthest", () => {
    const stops = [
      { cp: 1, np: "Far", ed: "A", py: -23.57, px: -46.67 },
      { cp: 2, np: "Near", ed: "B", py: -23.5501, px: -46.6301 },
      { cp: 3, np: "Mid", ed: "C", py: -23.555, px: -46.635 },
    ];

    const sorted = sortStopsByDistance(stops, -23.55, -46.63);
    expect(sorted.map((stop) => stop.cp)).toEqual([2, 3, 1]);
    expect(sorted[0].distance).toBeLessThan(sorted[1].distance);
    expect(sorted[1].distance).toBeLessThan(sorted[2].distance);
  });
});