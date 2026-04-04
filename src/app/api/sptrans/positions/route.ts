import { NextResponse } from "next/server";
import { getAllPositions } from "@/lib/sptrans-client";

export async function GET() {
  try {
    const data = await getAllPositions();
    return NextResponse.json(data);
  } catch (err) {
    console.error("positions error", err);
    return NextResponse.json({ error: "Failed to fetch positions" }, { status: 502 });
  }
}
