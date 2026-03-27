/**
 * Simple in-memory sliding-window rate limiter.
 * Works within a single Vercel function instance's lifetime.
 * Per-user keying prevents one user from affecting others.
 */

const store = new Map<string, number[]>();

/**
 * Returns true if the request is allowed, false if rate limit exceeded.
 * @param key      Unique key (e.g. userId + route)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window size in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (store.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    store.set(key, timestamps); // keep pruned list without adding new entry
    return false;
  }

  timestamps.push(now);
  store.set(key, timestamps);
  return true;
}
