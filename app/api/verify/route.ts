export async function GET(request: Request) {
  const { handleVerifyGet } = await import("@/server/controllers/verifyController");
  return handleVerifyGet(request);
}

export async function POST(request: Request) {
  const { handleVerifyPost } = await import("@/server/controllers/verifyController");
  return handleVerifyPost(request);
}
