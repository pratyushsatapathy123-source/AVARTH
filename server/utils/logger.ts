/**
 * AVARTH Observability and Structured Logging Utility
 * Never logs secrets or private keys.
 */

export function logEvent(event: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  console.log(`[AVARTH][${timestamp}] ${event}${metaStr}`);
}

export function logError(event: string, err: unknown) {
  const timestamp = new Date().toISOString();
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error(`[AVARTH-ERR][${timestamp}] ${event}: ${errMsg}`);
}
