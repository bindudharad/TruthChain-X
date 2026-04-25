import { NextResponse } from "next/server";
import { loginUser, registerUser } from "@/server/services/identity/auth";
import { issueSessionTokens, refreshAccessToken, revokeRefreshToken } from "@/services/auth/session";
import { storeIdentitySnapshot } from "@/server/services/blockchain/registry";
import { applyRouteRateLimit } from "@/server/middlewares/rate-limit";
import { readJsonBody } from "@/server/utils/read-json";

function sessionHeaders(accessToken: string, refreshToken?: string) {
  return {
    "Set-Cookie": [
      `tcx_token=${encodeURIComponent(accessToken)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=14400`,
      refreshToken ? `tcx_refresh=${encodeURIComponent(refreshToken)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800` : null
    ]
      .filter(Boolean)
      .join(", ")
  };
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") || "";
  const target = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return target ? decodeURIComponent(target.split("=")[1] || "") : "";
}

export async function handleRegister(request: Request) {
  const limited = applyRouteRateLimit(request, "auth-register", 20);
  if (limited) return limited;

  const parsed = await readJsonBody<{ email?: string; password?: string; displayName?: string }>(request);
  if (parsed.error) return parsed.error;
  const body = parsed.data!;

  if (!body.email || !body.password || !body.displayName) {
    return NextResponse.json({ error: "Missing email, password, or displayName." }, { status: 400 });
  }

  try {
    const user = await registerUser({
      email: body.email,
      password: body.password,
      displayName: body.displayName
    });
    const { accessToken, refreshToken } = issueSessionTokens({
      userId: user.userId,
      role: user.role,
      plan: user.plan,
      name: user.displayName
    });
    await storeIdentitySnapshot(user.blockchainIdentityHash, user.trustScore);

    return NextResponse.json({ token: accessToken, refreshToken, user }, { headers: sessionHeaders(accessToken, refreshToken) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to register user." }, { status: 400 });
  }
}

export async function handleLogin(request: Request) {
  const limited = applyRouteRateLimit(request, "auth-login", 30);
  if (limited) return limited;

  const parsed = await readJsonBody<{ email?: string; password?: string }>(request);
  if (parsed.error) return parsed.error;
  const body = parsed.data!;

  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Missing email or password." }, { status: 400 });
  }

  try {
    const user = await loginUser(body.email, body.password);
    const { accessToken, refreshToken } = issueSessionTokens({
      userId: user.userId,
      role: user.role,
      plan: user.plan,
      name: user.displayName
    });

    return NextResponse.json({ token: accessToken, refreshToken, user }, { headers: sessionHeaders(accessToken, refreshToken) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to login." }, { status: 401 });
  }
}

export async function handleRefresh(request: Request) {
  const refreshToken = readCookie(request, "tcx_refresh");
  if (!refreshToken) {
    return NextResponse.json({ error: "Missing refresh session." }, { status: 401 });
  }

  const accessToken = refreshAccessToken(refreshToken);
  if (!accessToken) {
    return NextResponse.json({ error: "Refresh session invalid or expired." }, { status: 401 });
  }

  return NextResponse.json({ token: accessToken }, { headers: sessionHeaders(accessToken) });
}

export async function handleLogout(request: Request) {
  const refreshToken = readCookie(request, "tcx_refresh");
  if (refreshToken) revokeRefreshToken(refreshToken);

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie":
          "tcx_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0, tcx_refresh=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
      }
    }
  );
}
