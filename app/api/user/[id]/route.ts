export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { handleUserLookup } = await import("@/server/controllers/userController");
  const { id } = await params;
  return handleUserLookup(request, id);
}
