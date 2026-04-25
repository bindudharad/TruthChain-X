export async function POST(request: Request) {
  const { handleRegister } = await import("@/server/controllers/authController");
  return handleRegister(request);
}
