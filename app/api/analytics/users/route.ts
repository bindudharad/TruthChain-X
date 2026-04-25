export async function GET(request: Request) {
  const { handleAdminUsers } = await import("@/server/controllers/adminController");
  return handleAdminUsers(request);
}
