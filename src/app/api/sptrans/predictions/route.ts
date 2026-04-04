import { NextRequest, NextResponse } from "next/server";
import { getPredictionsForStop } from "@/lib/sptrans-client";
import { parsePositiveIntParam } from "@/app/api/sptrans/_validation";

export async function GET(request: NextRequest) {
  const stopId = request.nextUrl.searchParams.get("stopId");
  if (!stopId) {
    return NextResponse.json({ error: "Missing query param: stopId" }, { status: 400 });
  }

  const parsedStopId = parsePositiveIntParam(stopId);
  if (parsedStopId === null) {
    return NextResponse.json({ error: "Invalid query param: stopId" }, { status: 400 });
  }

  try {
    const predictions = await getPredictionsForStop(parsedStopId);
    return NextResponse.json(predictions);
  } catch (err) {
    console.error("predictions error", err);
    return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 502 });
  }
}
