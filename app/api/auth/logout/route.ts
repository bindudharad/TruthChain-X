export async function POST(request: Request) {
  const { handleLogout } = await import("@/server/controllers/authController");
  return handleLogout(request);
}
