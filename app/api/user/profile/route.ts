export async function GET(request: Request) {
  const { handleProfileLookup } = await import("@/server/controllers/userController");
  return handleProfileLookup(request);
}
