import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "truthchain-x",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime())
  });
}
