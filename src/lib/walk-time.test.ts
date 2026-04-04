import { describe, expect, it } from "vitest";
import { formatWalkTime, walkingMinutes } from "@/lib/walk-time";

describe("walk-time", () => {
  it("adds the street-crossing buffer", () => {
    expect(walkingMinutes(75)).toBe(2);
  });

  it("formats rounded walking time in Portuguese", () => {
    expect(formatWalkTime(150)).toBe("~3 min caminhando");
  });
});