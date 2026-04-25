type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitEntry>;

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

function getStore(): RateLimitStore {
  const globalStore = globalThis as typeof globalThis & {
    __threadsToolRateLimitStore?: RateLimitStore;
  };

  if (!globalStore.__threadsToolRateLimitStore) {
    globalStore.__threadsToolRateLimitStore = new Map();
  }

  return globalStore.__threadsToolRateLimitStore;
}

export function takeRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const store = getStore();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    cleanupStore(store, now);

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  current.count += 1;
  store.set(key, current);
  cleanupStore(store, now);

  const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));

  if (current.count > limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds,
  };
}

export function applyRateLimitHeaders(response: Response, result: RateLimitResult) {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("Retry-After", String(result.retryAfterSeconds));
  return response;
}

function cleanupStore(store: RateLimitStore, now: number) {
  if (store.size < 500) {
    return;
  }

  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}
