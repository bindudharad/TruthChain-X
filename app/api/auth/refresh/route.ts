export async function POST(request: Request) {
  const { handleRefresh } = await import("@/server/controllers/authController");
  return handleRefresh(request);
}
