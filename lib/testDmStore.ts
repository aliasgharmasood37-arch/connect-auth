/**
 * In-memory store that lets /api/ai/test-dm hold its HTTP response open
 * while waiting for n8n to POST the AI reply to /api/ai/test-dm/respond.
 * Works for single-instance deployments and local development.
 */

const pending = new Map<string, (reply: string) => void>();

/** Hold open until n8n calls back (or timeout). Returns null on timeout. */
export function waitForReply(requestId: string, timeoutMs = 25_000): Promise<string | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      resolve(null);
    }, timeoutMs);

    pending.set(requestId, (reply) => {
      clearTimeout(timer);
      pending.delete(requestId);
      resolve(reply);
    });
  });
}

/** Called by the respond endpoint when n8n delivers the reply. */
export function resolveReply(requestId: string, reply: string): boolean {
  const resolve = pending.get(requestId);
  if (!resolve) return false;
  resolve(reply);
  return true;
}
