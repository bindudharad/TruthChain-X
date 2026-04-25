import { NextResponse } from "next/server";
import { extractPrincipal, planMeetsMinimum, verifyJwt } from "@/lib/platform";
import { ApiPlan, PlatformPrincipal, PlatformRole } from "@/lib/types";

export function getPrincipalFromRequest(request: Request): PlatformPrincipal | null {
  const direct = extractPrincipal(request);
  if (direct && direct.source !== "guest") return direct;

  const cookieHeader = request.headers.get("cookie") || "";
  const tokenCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("tcx_token="));

  if (!tokenCookie) return direct;
  const token = decodeURIComponent(tokenCookie.split("=")[1] || "");
  const payload = verifyJwt(token);
  if (!payload) return direct;

  return {
    id: payload.sub,
    role: payload.role,
    plan: payload.plan,
    name: payload.name,
    source: "jwt"
  };
}

export function requireAuth(request: Request) {
  const principal = getPrincipalFromRequest(request);
  if (!principal || principal.source === "guest") {
    return {
      error: NextResponse.json({ error: "Authentication required." }, { status: 401 })
    };
  }

  return { principal };
}

export function checkRole(principal: PlatformPrincipal, roles: PlatformRole[]) {
  return roles.includes(principal.role);
}

export function requireRole(request: Request, roles: PlatformRole[], minimumPlan?: ApiPlan) {
  const auth = requireAuth(request);
  if (auth.error) return auth;
  if (!checkRole(auth.principal, roles)) {
    return {
      error: NextResponse.json({ error: "Insufficient role for this action." }, { status: 403 })
    };
  }
  if (minimumPlan && !planMeetsMinimum(auth.principal.plan, minimumPlan)) {
    return {
      error: NextResponse.json({ error: `This action requires the ${minimumPlan} plan or higher.` }, { status: 403 })
    };
  }
  return auth;
}
