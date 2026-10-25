import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SEARCHABLE_SITE_IDS } from '../../src/registry';
import { createHomePage } from '../../src/runtime/page';
import { SOURCE_OPTIONS } from '../../web/src/lib/sources';

describe('static homepage api contract', () => {
  const workbenchSource = readFileSync(
    fileURLToPath(new URL('../../web/src/lib/components/SearchWorkbench.svelte', import.meta.url)),
    'utf8'
  );
  const layoutStyles = readFileSync(
    fileURLToPath(new URL('../../web/src/routes/layout.css', import.meta.url)),
    'utf8'
  );
  const createStaticHomePage = (searchEnabled = true) =>
    createHomePage({
      platform: 'node',
      storageProvider: 'memory',
      searchEnabled,
    });

  it('keeps every runtime homepage aligned with the checked-in static ui', () => {
    const html = createStaticHomePage();

    expect(
      createHomePage({
        platform: 'node',
        storageProvider: 'memory',
        searchEnabled: true,
      })
    ).toBe(html);
    expect(
      createHomePage({
        platform: 'bun',
        storageProvider: 'memory',
        searchEnabled: true,
      })
    ).toBe(html);
    expect(
      createHomePage({
        platform: 'cloudflare',
        storageProvider: 'memory',
        searchEnabled: true,
      })
    ).toBe(html);
  });

  it('injects runtime bootstrap config when search is disabled', () => {
    const html = createStaticHomePage();
    const disabledHomePage = createStaticHomePage(false);

    expect(html).toContain(
      '<script id="ptgen-home-config" type="application/json">{"searchEnabled":true}</script>'
    );
    expect(disabledHomePage).toContain('{"searchEnabled":false}');
    expect(disabledHomePage).not.toBe(html);
  });

  it('uses explicit v1 api endpoints instead of the root path redirect', () => {
    expect(workbenchSource).toContain('fetchMediaInfo');
    expect(workbenchSource).toContain('searchMedia');

    const apiClientSource = readFileSync(
      fileURLToPath(new URL('../../web/src/lib/api/client.ts', import.meta.url)),
      'utf8'
    );
    expect(apiClientSource).toContain('/api/v1/info');
    expect(apiClientSource).toContain('/api/v1/search');
  });

  it('shows a readable error when the api returns html instead of json', () => {
    const apiClientSource = readFileSync(
      fileURLToPath(new URL('../../web/src/lib/api/client.ts', import.meta.url)),
      'utf8'
    );
    expect(apiClientSource).toContain('接口返回了 HTML 页面');
  });

  it('adds semantic labels and live regions for accessibility', () => {
    const html = createStaticHomePage();

    expect(html).toContain('class="skip-link"');
    expect(html).toContain('href="#main-content"');
    expect(html).toContain('for="source-select"');
    expect(html).toContain('for="search-input"');
    expect(html).toContain('for="api-key-input"');
    expect(html).toContain('aria-live="polite"');
    expect(workbenchSource).toContain('<Dialog.Root');
  });

  it('renders search results through escaped Svelte expressions', () => {
    expect(workbenchSource).not.toContain('{@html');
    expect(workbenchSource).not.toContain('innerHTML');
    expect(workbenchSource).toContain('hasText(item.title)');
  });

  it('guards optional result metadata before rendering tags', () => {
    expect(workbenchSource).toContain('hasText(item.year)');
    expect(workbenchSource).toContain('hasText(item.subtitle)');
    expect(workbenchSource).toContain('hasText(item.subtype)');
  });

  it('uses accessible interactive semantics and motion-safe styles', () => {
    expect(workbenchSource).toContain('<button');
    expect(layoutStyles).toContain('focus-visible');
    expect(layoutStyles).toContain('prefers-reduced-motion: reduce');
    expect(layoutStyles).not.toContain('transition: all');
  });

  it('lists every searchable registry source on the homepage and keeps indienova as direct-link only', () => {
    const optionValues = SOURCE_OPTIONS.map((option) => option.value);

    expect(optionValues).toEqual(SEARCHABLE_SITE_IDS);
    expect(optionValues).not.toContain('indienova');
    expect(createStaticHomePage()).toContain('Indienova');
  });
});
