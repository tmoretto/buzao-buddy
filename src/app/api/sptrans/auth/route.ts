import { NextResponse } from "next/server";
import { ensureAuthenticated, SpTransError } from "@/lib/sptrans-client";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await ensureAuthenticated();
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("auth error", err);

    const status = err instanceof SpTransError ? err.status : 502;
    return NextResponse.json({ error: "SPTrans auth failed" }, { status });
  }
}
