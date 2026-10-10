import { MemoryStorage } from '../storage/memory';
import { VercelRedisStorage } from '../storage/vercel-redis';
import { createRuntimeApp } from './runtime-factory';

export async function createVercelRuntime(env: Record<string, unknown>) {
  const { app } = await createRuntimeApp({
    platform: 'vercel',
    env,
    createStorage: async (setup) => {
      switch (setup.storageProvider) {
        case 'vercel-redis':
          return await VercelRedisStorage.fromEnv(setup.values);
        case 'memory':
          return new MemoryStorage();
        default:
          throw new Error(`Storage provider ${setup.storageProvider} is not supported on Vercel`);
      }
    },
    fallbackMessage: '[ptgen] Failed to initialize Vercel storage, falling back to memory.',
  });

  return app;
}
