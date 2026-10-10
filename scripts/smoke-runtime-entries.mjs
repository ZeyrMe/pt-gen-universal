const entryChecks = [
  {
    name: 'vercel api route',
    url: new URL('../api/[[...route]].ts', import.meta.url),
    validate(mod) {
      if (mod.config?.runtime !== 'edge') {
        throw new Error('expected config.runtime to be "edge"');
      }
      if (typeof mod.default !== 'function') {
        throw new Error('expected default export to be a function');
      }
    },
    async smoke(mod) {
      const response = await mod.default(new Request('http://runtime-smoke.local/'));
      if (response.status !== 200) {
        throw new Error(`expected Vercel Edge homepage status 200, got ${response.status}`);
      }
    },
  },
  {
    name: 'edgeone runtime entry',
    url: new URL('../edge-functions/index.ts', import.meta.url),
    validate(mod) {
      if (typeof mod.default !== 'function') {
        throw new Error('expected default export to be a function');
      }
    },
    async smoke(mod) {
      const response = await mod.default({
        request: new Request('http://runtime-smoke.local/'),
        env: { STORAGE_PROVIDER: 'memory' },
        waitUntil() {},
      });
      if (response.status !== 200) {
        throw new Error(`expected EdgeOne Edge homepage status 200, got ${response.status}`);
      }
    },
  },
  {
    name: 'edgeone default passthrough entry',
    url: new URL('../edge-functions/[[default]].ts', import.meta.url),
    validate(mod) {
      if (typeof mod.default !== 'function') {
        throw new Error('expected default export to be a function');
      }
    },
  },
  {
    name: 'netlify edge entry',
    url: new URL('../netlify/edge-functions/app.ts', import.meta.url),
    validate(mod) {
      if (typeof mod.default !== 'function') {
        throw new Error('expected default export to be a function');
      }
      if (mod.config?.path !== '/*') {
        throw new Error('expected config.path to be "/*"');
      }
    },
  },
];

const originalStorageProvider = process.env.STORAGE_PROVIDER;
process.env.STORAGE_PROVIDER = 'memory';

try {
  for (const entry of entryChecks) {
    const mod = await import(entry.url);
    entry.validate(mod);
    if (entry.smoke) await entry.smoke(mod);
    console.log(`[runtime-smoke] ok: ${entry.name}`);
  }

  const { createNodeRuntime } = await import('../src/runtime/node.ts');
  const nodeRuntime = await createNodeRuntime('node', { STORAGE_PROVIDER: 'memory' });
  const nodeResponse = await nodeRuntime.app.fetch(new Request('http://runtime-smoke.local/'));
  if (nodeResponse.status !== 200) {
    throw new Error(`expected Node homepage status 200, got ${nodeResponse.status}`);
  }
  console.log('[runtime-smoke] ok: node runtime app');
} finally {
  if (originalStorageProvider === undefined) {
    delete process.env.STORAGE_PROVIDER;
  } else {
    process.env.STORAGE_PROVIDER = originalStorageProvider;
  }
}
