import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Use Wrangler's pinned toolchain, including its actual workerd runtime.
const require = createRequire(import.meta.url);
const wranglerRequire = createRequire(require.resolve('wrangler/package.json'));
const { build } = wranglerRequire('esbuild');
const { Miniflare } = wranglerRequire('miniflare');
const root = fileURLToPath(new URL('../', import.meta.url));
const desktop = readFileSync(new URL('../__tests__/fixtures/douban.html', import.meta.url), 'utf8');
const mobile = readFileSync(
  new URL('../__tests__/fixtures/douban_m.html', import.meta.url),
  'utf8'
);
const bundle = await build({
  stdin: {
    contents: `
      import entry from './src/adapters/cloudflare.ts';
      let rexxarCalls = 0;
      globalThis.fetch = async (url) => {
        const u = String(url);
        if (u.includes('/rexxar/')) { rexxarCalls++; return Response.json({title:'test', directors:[{name:'API director'}]}); }
        if (u === 'https://movie.douban.com/subject/1292052/') return new Response(${JSON.stringify(desktop)});
        if (u === 'https://movie.douban.com/subject/100/') return new Response(${JSON.stringify(mobile)});
        return new Response('', {status:404});
      };
      export default { async fetch(request, env, ctx) {
        if (new URL(request.url).pathname === '/__probe') return Response.json({process:typeof process,rexxarCalls});
        return entry.fetch(request, env, ctx);
      }};
    `,
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
});
for (const enabled of [false, true]) {
  const mf = new Miniflare({
    modules: true,
    script: bundle.outputFiles[0].text,
    compatibilityDate: '2025-05-04',
    bindings: {
      STORAGE_PROVIDER: 'memory',
      CACHE_TTL: '0',
      IMAGE_CDN_PREFIX: 'https://cdn.example/?',
      DOUBAN_INCLUDE_REXXAR: String(enabled),
      DOUBAN_COOKIE: 'bid=test',
    },
  });
  try {
    const probe = await (await mf.dispatchFetch('http://worker/__probe')).json();
    assert.equal(probe.process, 'undefined');
    for (const sid of ['1292052', '100']) {
      const res = await mf.dispatchFetch('http://worker/api/v1/info/douban/' + sid);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.format.includes('[img]https://cdn.example/?'));
      assert.ok(data.formats.markdown.includes('![海报](https://cdn.example/?'));
      assert.equal(JSON.parse(data.formats.json).poster, data.poster);
      if (sid === '1292052') assert.ok(data.director[0].name.includes('Frank Darabont'));
      if (sid === '100' && enabled) assert.equal(data.director[0].name, 'API director');
    }
    const v2Json = await mf.dispatchFetch(
      'http://worker/api/v2/info?site=douban&sid=1292052&format=json'
    );
    assert.equal(v2Json.status, 200);
    const jsonBody = await v2Json.json();
    assert.ok(!jsonBody.data.poster.startsWith('https://cdn.example/'));
    const v2BBCode = await mf.dispatchFetch(
      'http://worker/api/v2/info?site=douban&sid=1292052&format=bbcode'
    );
    assert.equal(v2BBCode.status, 200);
    assert.ok((await v2BBCode.json()).data.format.includes('[img]https://cdn.example/?'));
    const after = await (await mf.dispatchFetch('http://worker/__probe')).json();
    assert.equal(after.rexxarCalls, enabled ? 1 : 0);
    console.log('[worker-smoke] passed with Rexxar ' + (enabled ? 'on' : 'off'));
  } finally {
    await mf.dispose();
  }
}
