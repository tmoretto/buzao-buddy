import { NextRequest, NextResponse } from "next/server";
import { getPositionsForLine } from "@/lib/sptrans-client";
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
    const data = await getPositionsForLine(lineCode);
    return NextResponse.json(data);
  } catch (err) {
    console.error("positions/line error", err);
    return NextResponse.json({ error: "Failed to fetch positions" }, { status: 502 });
  }
}
