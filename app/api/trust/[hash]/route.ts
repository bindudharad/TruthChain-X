export async function GET(request: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { handleTrustLookup } = await import("@/server/controllers/trustController");
  const { hash } = await params;
  return handleTrustLookup(request, hash);
}
