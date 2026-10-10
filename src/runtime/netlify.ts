import { MemoryStorage } from '../storage/memory';
import { NetlifyBlobsStorage } from '../storage/netlify-blobs';
import { VercelRedisStorage } from '../storage/vercel-redis';
import { createRuntimeApp } from './runtime-factory';

export async function createNetlifyRuntime(env: Record<string, unknown>) {
  const { app } = await createRuntimeApp({
    platform: 'netlify',
    env,
    createStorage: async (setup) => {
      switch (setup.storageProvider) {
        case 'netlify-blobs':
          return await NetlifyBlobsStorage.fromStoreName(setup.storeName);
        case 'vercel-redis':
          return await VercelRedisStorage.fromEnv(setup.values);
        case 'memory':
          return new MemoryStorage();
        default:
          throw new Error(`Storage provider ${setup.storageProvider} is not supported on Netlify`);
      }
    },
    fallbackMessage: '[ptgen] Failed to initialize Netlify storage, falling back to memory.',
  });

  return app;
}
