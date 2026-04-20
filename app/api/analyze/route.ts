export async function POST(request: Request) {
  const { handleAnalyze } = await import("@/server/controllers/analyzeController");
  return handleAnalyze(request);
}
