import { NextRequest, NextResponse } from "next/server";
import { getAllPositions } from "@/lib/sptrans-client";

function isConfigured(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export async function GET(request: NextRequest) {
  const checks = {
    sptransTokenConfigured: isConfigured(process.env.SPTRANS_TOKEN),
    publicMapboxTokenConfigured: isConfigured(process.env.NEXT_PUBLIC_MAPBOX_TOKEN),
  };

  const upstreamRequested = request.nextUrl.searchParams.get("upstream") === "1";
  let upstream: {
    sptransReachable: boolean;
    lineCount?: number;
    vehicleCount?: number;
    referenceTime?: string;
    error?: string;
  } | null = null;

  if (upstreamRequested) {
    try {
      const positions = await getAllPositions();
      const lineCount = positions.l?.length ?? 0;
      const vehicleCount = (positions.l ?? []).reduce(
        (total, line) => total + (line.vs?.length ?? 0),
        0,
      );

      upstream = {
        sptransReachable: true,
        lineCount,
        vehicleCount,
        referenceTime: positions.hr,
      };
    } catch (error) {
      upstream = {
        sptransReachable: false,
        error: error instanceof Error ? error.message : "Unknown upstream error",
      };
    }
  }

  const ok = Object.values(checks).every(Boolean) && (upstream === null || upstream.sptransReachable);

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      checks,
      ...(upstream ? { upstream } : {}),
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}