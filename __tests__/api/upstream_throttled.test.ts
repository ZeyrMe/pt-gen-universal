import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import { MemoryStorage } from '../../src/storage/memory';
import { rateLimiter } from '../../lib/utils/rate-limiter';
import { AppError, ErrorCode } from '../../lib/errors';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('upstream throttle API contract', () => {
  it('returns a retry hint when a required upstream token is unavailable', async () => {
    vi.spyOn(rateLimiter, 'acquireRequired').mockRejectedValue(
      new AppError(ErrorCode.UPSTREAM_THROTTLED, 'throttled', { retry_after_ms: 3000 })
    );

    const app = createApp(new MemoryStorage(), { cacheTTL: 0 });
    const response = await app.request('http://localhost/api/v2/search?q=test&source=douban');

    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBe('3');
    expect(await response.json()).toMatchObject({
      error: {
        code: ErrorCode.UPSTREAM_THROTTLED,
        details: { retry_after_ms: 3000 },
      },
    });
  });
});
