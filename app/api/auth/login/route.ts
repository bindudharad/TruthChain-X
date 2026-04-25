export async function POST(request: Request) {
  const { handleLogin } = await import("@/server/controllers/authController");
  return handleLogin(request);
}
