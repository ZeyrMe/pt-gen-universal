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
        default:
          return new MemoryStorage();
      }
    },
    fallbackMessage: '[ptgen] Failed to initialize Netlify storage, falling back to memory.',
  });

  return app;
}
