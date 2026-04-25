export async function POST(request: Request) {
  const { handleAdminTakedown } = await import("@/server/controllers/adminController");
  return handleAdminTakedown(request);
}
