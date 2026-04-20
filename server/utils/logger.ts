export function logInfo(message: string, meta?: Record<string, unknown>) {
  console.info(`[TruthChain Server] ${message}`, meta || "");
}

export function logError(message: string, error?: unknown, meta?: Record<string, unknown>) {
  console.error(`[TruthChain Server] ${message}`, error, meta || "");
}
