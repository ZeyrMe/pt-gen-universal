import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppError, ErrorCode } from '../../lib/errors';
import { DoubanScraper } from '../../lib/scrapers/douban';
import { rateLimiter } from '../../lib/utils/rate-limiter';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Douban scraper rate limiting', () => {
  it('does not call the search endpoint when required throttling fails', async () => {
    vi.spyOn(rateLimiter, 'acquireRequired').mockRejectedValue(
      new AppError(ErrorCode.UPSTREAM_THROTTLED, 'throttled')
    );
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(
      new DoubanScraper().search('test', { doubanCookie: 'bid=test' })
    ).rejects.toMatchObject({
      code: ErrorCode.UPSTREAM_THROTTLED,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
