/**
 * Minimal in-process fixed-window rate limiter.
 *
 * Mirrors apps/admin/src/lib/server/rate-limit.ts. The simulation form actions
 * persist rows on behalf of unauthenticated visitors; they used to sit behind
 * @nestjs/throttler on the API, so they need an equivalent budget now that
 * SvelteKit serves them directly. It is per-process, so it bounds abuse rather
 * than enforcing a global quota.
 */

type Bucket = { count: number; resetAt: number };

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
