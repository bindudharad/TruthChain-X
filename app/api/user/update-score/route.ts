export async function POST(request: Request) {
  const { handleUserScoreUpdate } = await import("@/server/controllers/userController");
  return handleUserScoreUpdate(request);
}
