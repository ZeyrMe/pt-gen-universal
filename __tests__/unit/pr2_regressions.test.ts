import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRuntimeSetup } from '../../src/runtime/env';
import { MediaInfoService } from '../../src/services/media-info';
import { Orchestrator } from '../../lib/orchestrator';
import { DoubanNormalizer } from '../../lib/normalizers/douban';
import { DoubanScraper } from '../../lib/scrapers/douban';
import * as fetchModule from '../../lib/utils/fetch';

const desktop = readFileSync(new URL('../fixtures/douban.html', import.meta.url), 'utf8');
const mobile = readFileSync(new URL('../fixtures/douban_m.html', import.meta.url), 'utf8');
const normalizer = new DoubanNormalizer();
const normalize = (html: string, extra = {}) =>
  normalizer.normalize({ site: 'douban', sid: '1292052', success: true, html, ...extra }, {});
afterEach(() => vi.restoreAllMocks());

function mockSubject(
  html: string,
  rexxar: unknown = { title: 'test', directors: [{ name: '导演' }] }
) {
  return vi.spyOn(fetchModule, 'fetchWithTimeout').mockImplementation(async (url) => {
    const u = String(url);
    const body = u.includes('/rexxar/') ? JSON.stringify(rexxar) : html;
    return { response: new Response(body, { status: 200 }), proxyUsed: false, finalUrl: u };
  });
}
const config = { doubanCookie: 'bid=test', doubanIncludeAwards: false, doubanIncludeImdb: false };

describe('PR #2 runtime and fallback regressions', () => {
  it('passes deployed env configuration into formatters without changing source JSON', () => {
    const setup = createRuntimeSetup({
      platform: 'cloudflare',
      env: { IMAGE_CDN_PREFIX: 'https://cdn.example/?', DOUBAN_INCLUDE_REXXAR: 'false' },
    });
    expect(setup.appConfig.doubanIncludeRexxar).toBe(false);
    const info = normalize(desktop);
    const formats = new MediaInfoService({} as Orchestrator, setup.appConfig).renderFormats(info);
    expect(formats.bbcode).toContain(`[img]https://cdn.example/?${info.poster}[/img]`);
    expect(formats.markdown).toContain(`![海报](https://cdn.example/?${info.poster})`);
    expect(JSON.parse(formats.json).poster).toBe(info.poster);
    const defaults = new MediaInfoService({} as Orchestrator).renderFormats(info);
    expect(defaults.bbcode).toContain(`[img]${info.poster}[/img]`);
  });
  it('does not request Rexxar for desktop subjects', async () => {
    const spy = mockSubject(desktop);
    await new DoubanScraper().fetch('1292052', config);
    expect(spy.mock.calls.some(([url]) => String(url).includes('/rexxar/'))).toBe(false);
  });
  it('honors the deployed off switch on mobile subjects', async () => {
    const spy = mockSubject(mobile);
    const setup = createRuntimeSetup({ platform: 'node', env: { DOUBAN_INCLUDE_REXXAR: 'false' } });
    await new DoubanScraper().fetch('1292052', { ...config, ...setup.appConfig });
    expect(spy.mock.calls.some(([url]) => String(url).includes('/rexxar/'))).toBe(false);
  });
  it('uses TV endpoint first when mobile HTML identifies a TV subject', async () => {
    const spy = mockSubject(mobile + '<a href="/tv/subject/1292052/">电视剧</a>');
    const raw = await new DoubanScraper().fetch('1292052', config);
    const calls = spy.mock.calls.filter(([url]) => String(url).includes('/rexxar/'));
    expect(calls).toHaveLength(1);
    expect(String(calls[0][0])).toContain('/rexxar/api/v2/tv/');
    expect(normalizer.normalize(raw, {}).director).toEqual(['导演']);
  });
  it('keeps HTML results when both enrichment requests throw', async () => {
    const spy = mockSubject(mobile);
    spy.mockImplementation(async (url) => {
      if (String(url).includes('/rexxar/')) throw new Error('network unavailable');
      return { response: new Response(mobile), proxyUsed: false, finalUrl: String(url) };
    });
    const raw = await new DoubanScraper().fetch('1292052', config);
    expect(raw.success).toBe(true);
    expect(raw.rexxar_data).toBeUndefined();
    expect(normalizer.normalize(raw, {}).chinese_title).toBeTruthy();
  });
  it('rejects API error payloads and still returns HTML data', async () => {
    mockSubject(mobile, { error: 'unavailable' });
    const raw = await new DoubanScraper().fetch('1292052', config);
    expect(raw.rexxar_data).toBeUndefined();
    expect(normalizer.normalize(raw, {}).chinese_title).toBeTruthy();
  });
  it('falls back to TV when movie API fails', async () => {
    const spy = mockSubject(mobile);
    spy.mockImplementation(async (url) => ({
      response: new Response(
        String(url).includes('/rexxar/api/v2/movie/')
          ? ''
          : String(url).includes('/rexxar/')
            ? JSON.stringify({ title: 'test', actors: [{ name: '演员' }] })
            : mobile,
        { status: String(url).includes('/rexxar/api/v2/movie/') ? 404 : 200 }
      ),
      proxyUsed: false,
      finalUrl: String(url),
    }));
    const raw = await new DoubanScraper().fetch('1292052', config);
    expect(normalizer.normalize(raw, {}).cast).toEqual(['演员']);
  });
  it('supports optional writers and cover_url without requiring pic', () => {
    const noPoster = mobile.replace(/<img[^>]*>/g, '');
    const info = normalize(noPoster, {
      rexxar_data: { writers: [{ name: '编剧' }], cover_url: 'https://example.com/poster.jpg' },
    });
    expect(info.writer).toEqual(['编剧']);
    expect(info.poster).toBe('https://example.com/poster.jpg');
  });
  it('extracts poster and rating from HTML when JSON-LD is absent', () => {
    const html =
      desktop.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '') +
      '<div id="mainpic"><img src="https://example.com/poster.jpg"></div><strong property="v:average">9.7</strong><span property="v:votes">123</span>';
    const info = normalize(html);
    expect(info.poster).toBe('https://example.com/poster.jpg');
    expect(info.ratings?.douban?.formatted).toBe('9.7/10 from 123 users');
  });
});
