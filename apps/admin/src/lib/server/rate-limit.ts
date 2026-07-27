/**
 * Minimal in-process fixed-window rate limiter.
 *
 * The admin panel runs as a single Node process, so an in-memory counter is a
 * genuine control here rather than a decoration. It exists to make password
 * guessing against /login expensive: without it the login form accepts
 * unlimited attempts at whatever rate the network allows.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>();

// Bound the map so a flood of distinct source addresses cannot grow it without limit.
const MAX_TRACKED_KEYS = 10_000;

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (buckets.size > MAX_TRACKED_KEYS) sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Clears the counter for a key — called after a successful login. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
