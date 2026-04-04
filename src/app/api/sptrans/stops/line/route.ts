import { NextRequest, NextResponse } from "next/server";
import { getStopsForLine } from "@/lib/sptrans-client";
import { parsePositiveIntParam } from "@/app/api/sptrans/_validation";

export async function GET(request: NextRequest) {
  const cl = request.nextUrl.searchParams.get("cl");
  if (!cl) {
    return NextResponse.json({ error: "Missing param: cl" }, { status: 400 });
  }

  const lineCode = parsePositiveIntParam(cl);
  if (lineCode === null) {
    return NextResponse.json({ error: "Invalid param: cl" }, { status: 400 });
  }

  try {
    const stops = await getStopsForLine(lineCode);
    return NextResponse.json(stops, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (err) {
    console.error("stops/line error", err);
    return NextResponse.json({ error: "Failed to fetch stops" }, { status: 502 });
  }
}
