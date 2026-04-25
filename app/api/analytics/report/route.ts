export async function GET(request: Request) {
  const { handleAnalyticsReport } = await import("@/server/controllers/analyticsController");
  return handleAnalyticsReport(request);
}
