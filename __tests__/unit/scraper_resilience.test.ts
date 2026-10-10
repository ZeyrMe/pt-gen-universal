import { afterEach, describe, expect, it, vi } from 'vitest';
import { BangumiScraper } from '../../lib/scrapers/bangumi';
import { GogScraper } from '../../lib/scrapers/gog';
import { ImdbScraper } from '../../lib/scrapers/imdb';
import { SteamScraper } from '../../lib/scrapers/steam';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('optional scraper enrichment', () => {
  it('keeps Bangumi main HTML when the characters page rejects', async () => {
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const value = String(url);
      if (value.endsWith('/characters')) throw new Error('characters unavailable');
      return new Response('<html>main</html>');
    }) as typeof fetch;

    const result = await new BangumiScraper().fetch('1', {});

    expect(result.success).toBe(true);
    expect(result.main_html).toContain('main');
    expect(result.characters_html).toBe('');
  });

  it('keeps IMDb main data when the release page rejects', async () => {
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const value = String(url);
      if (value.endsWith('/releaseinfo')) throw new Error('release info unavailable');
      return new Response(
        '<script type="application/ld+json">{"@type":"Movie","name":"Example"}</script>'
      );
    }) as typeof fetch;

    const result = await new ImdbScraper().fetch('tt1', {});

    expect(result.success).toBe(true);
    expect(result.json_ld).toMatchObject({ name: 'Example' });
    expect(result.release_date).toEqual([]);
  });

  it('keeps Steam store HTML when SteamCN enrichment rejects', async () => {
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const value = String(url);
      if (value.includes('steamdb.keylol.com')) throw new Error('SteamCN unavailable');
      return new Response('<html>steam</html>');
    }) as typeof fetch;

    const result = await new SteamScraper().fetch('730', {});

    expect(result.success).toBe(true);
    expect(result.main_html).toContain('steam');
    expect(result.steamcn_data).toEqual({});
  });

  it('keeps GOG API data when the store page rejects', async () => {
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      const value = String(url);
      if (value.includes('api.gog.com/products/')) {
        return Response.json({ slug: 'example-game', title: 'Example Game' });
      }
      if (value.includes('www.gog.com/en/game/')) throw new Error('store page unavailable');
      throw new Error(`unexpected URL: ${value}`);
    }) as typeof fetch;

    const result = await new GogScraper().fetch('123', {});

    expect(result.success).toBe(true);
    expect(result.api_data).toMatchObject({ title: 'Example Game' });
    expect(result.store_page_html).toBe('');
  });
});
