import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    attempted: true,
    success: false,
    message: "Tampering blocked: blockchain fingerprint and stored hash do not match.",
    mismatchReason: "Immutable record conflict detected"
  });
}
