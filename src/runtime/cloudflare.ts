import { CloudflareKVStorage } from '../storage/cloudflare';
import { MemoryStorage } from '../storage/memory';
import { VercelRedisStorage } from '../storage/vercel-redis';
import { createRuntimeApp } from './runtime-factory';

export async function createCloudflareRuntime(env: Record<string, unknown>) {
  const { app } = await createRuntimeApp({
    platform: 'cloudflare',
    env,
    bindings: env,
    createStorage: async (setup) => {
      switch (setup.storageProvider) {
        case 'cloudflare-kv':
          return env.PT_GEN_STORE ? new CloudflareKVStorage(env.PT_GEN_STORE) : new MemoryStorage();
        case 'vercel-redis':
          return await VercelRedisStorage.fromEnv(setup.values);
        default:
          return new MemoryStorage();
      }
    },
    fallbackMessage: '[ptgen] Failed to initialize Cloudflare storage, falling back to memory.',
  });

  return app;
}
