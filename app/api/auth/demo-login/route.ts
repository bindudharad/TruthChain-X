import { NextResponse } from "next/server";
import { createDemoPrincipal } from "@/lib/platform";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { role?: "user" | "moderator" | "admin" | "enterprise"; plan?: "free" | "pro" | "enterprise" | "internal" };
  const role = body.role || "enterprise";
  const plan = body.plan || (role === "enterprise" ? "enterprise" : "pro");

  return NextResponse.json({
    token: createDemoPrincipal(role, plan),
    role,
    plan
  });
}
