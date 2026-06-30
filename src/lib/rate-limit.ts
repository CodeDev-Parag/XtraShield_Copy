/**
 * Simple in-memory rate limiter for serverless functions.
 * Works on Vercel — each function instance has its own memory,
 * so limits are per-instance (good enough for most use cases).
 *
 * For distributed rate limiting, swap with @upstash/ratelimit.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /** Window duration in milliseconds */
  windowMs: number;
  /** Max requests per window */
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const PLAN_LIMITS: Record<string, Record<string, RateLimitConfig>> = {
  FREE: {
    'breach/email': { windowMs: 24 * 60 * 60 * 1000, max: 10 },
    'breach/password': { windowMs: 24 * 60 * 60 * 1000, max: 50 },
    'phishing/check': { windowMs: 24 * 60 * 60 * 1000, max: 20 },
    'scan/upload': { windowMs: 24 * 60 * 60 * 1000, max: 5 },
    'port-scan': { windowMs: 24 * 60 * 60 * 1000, max: 10 },
    default: { windowMs: 60 * 1000, max: 30 },
  },
  PRO: {
    'breach/email': { windowMs: 24 * 60 * 60 * 1000, max: 100 },
    'breach/password': { windowMs: 24 * 60 * 60 * 1000, max: 500 },
    'phishing/check': { windowMs: 24 * 60 * 60 * 1000, max: 200 },
    'scan/upload': { windowMs: 24 * 60 * 60 * 1000, max: 50 },
    'port-scan': { windowMs: 24 * 60 * 60 * 1000, max: 100 },
    default: { windowMs: 60 * 1000, max: 100 },
  },
  ENTERPRISE: {
    default: { windowMs: 60 * 1000, max: 1000 },
  },
};

/**
 * Check rate limit for a user + endpoint combination.
 *
 * @param userId - The user's ID (from session or API key)
 * @param endpoint - Endpoint identifier (e.g., 'breach/email')
 * @param plan - User's plan ('FREE', 'PRO', 'ENTERPRISE')
 * @returns RateLimitResult with allowed flag, remaining count, and reset time
 */
export function checkRateLimit(
  userId: string,
  endpoint: string,
  plan: string = 'FREE'
): RateLimitResult {
  const planLimits = PLAN_LIMITS[plan.toUpperCase()] || PLAN_LIMITS.FREE;
  const config = planLimits[endpoint] || planLimits.default;

  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  const entry = store.get(key);

  // Window expired or new entry — reset
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.max - 1, resetAt };
  }

  // Within window — check limit
  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.max - entry.count, resetAt: entry.resetAt };
}

/**
 * Get rate limit headers for HTTP response.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}
