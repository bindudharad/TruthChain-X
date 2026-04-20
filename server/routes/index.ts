export const backendRoutes = {
  analyze: "POST /api/analyze",
  verify: "POST /api/verify",
  trust: "GET /api/trust/:hash",
  user: "GET /api/user/:id",
  updateScore: "POST /api/user/update-score"
} as const;
