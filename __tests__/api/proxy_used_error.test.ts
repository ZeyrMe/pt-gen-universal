import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp } from '../../src/application';
import { MemoryStorage } from '../../src/storage/memory';

describe('proxy_used in v2 error details', () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;

  beforeEach(() => {
    vi.restoreAllMocks();
    console.warn = vi.fn() as any;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  });

  it('includes details.proxy_used=true when a proxied scrape fails', async () => {
    globalThis.fetch = vi.fn(async (url: any) => {
      const u = String(url);
      // Steam scraper always sends Cookie; allowSensitiveHeaders must be enabled to proxy.
      if (u.includes('store.steampowered.com')) return new Response('', { status: 302 });
      return new Response('ok', { status: 200 });
    }) as any;

    const app = createApp(new MemoryStorage(), {
      cacheTTL: 0,
      proxyUrl: 'https://proxy.example/?url=',
      proxyAllowSensitiveHeaders: true,
    });

    const res = await app.request('http://localhost/api/v2/info?site=steam&sid=123');
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.details.proxy_used).toBe(true);
  });
});
