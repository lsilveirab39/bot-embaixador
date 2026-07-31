interface Bucket {
  count: number;
  resetAt: number;
}

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  consume(key: string, now = Date.now()): { allowed: boolean; retryAfterMs: number } {
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, retryAfterMs: 0 };
    }
    if (current.count >= this.limit) {
      return { allowed: false, retryAfterMs: current.resetAt - now };
    }
    current.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  }
}
