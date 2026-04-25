export async function GET(request: Request) {
  const { handlePermissionsLookup } = await import("@/server/controllers/userController");
  return handlePermissionsLookup(request);
}
