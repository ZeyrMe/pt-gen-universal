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
          if (!env.PT_GEN_STORE) throw new Error('PT_GEN_STORE binding is required');
          return new CloudflareKVStorage(env.PT_GEN_STORE);
        case 'vercel-redis':
          return await VercelRedisStorage.fromEnv(setup.values);
        case 'memory':
          return new MemoryStorage();
        default:
          throw new Error(
            `Storage provider ${setup.storageProvider} is not supported on Cloudflare`
          );
      }
    },
    fallbackMessage: '[ptgen] Failed to initialize Cloudflare storage, falling back to memory.',
  });

  return app;
}
