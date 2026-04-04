import { NextRequest, NextResponse } from "next/server";
import { searchStops } from "@/lib/sptrans-client";
import { normalizeSearchTerm } from "@/app/api/sptrans/_validation";

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("q");
  if (!term) {
    return NextResponse.json({ error: "Missing query param: q" }, { status: 400 });
  }

  const normalizedTerm = normalizeSearchTerm(term);
  if (!normalizedTerm) {
    return NextResponse.json({ error: "Invalid query param: q" }, { status: 400 });
  }

  try {
    const stops = await searchStops(normalizedTerm);
    return NextResponse.json(stops, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (err) {
    console.error("stops error", err);
    return NextResponse.json({ error: "Failed to fetch stops" }, { status: 502 });
  }
}
