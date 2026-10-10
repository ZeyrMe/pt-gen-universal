import { EdgeOneKVStorage } from '../storage/edgeone';
import { MemoryStorage } from '../storage/memory';
import { VercelRedisStorage } from '../storage/vercel-redis';
import { createRuntimeApp } from './runtime-factory';

export async function createEdgeOneRuntime(env: Record<string, unknown>) {
  const { app } = await createRuntimeApp({
    platform: 'edgeone',
    env,
    bindings: env,
    createStorage: async (setup) => {
      switch (setup.storageProvider) {
        case 'edgeone-kv':
          if (!env.PT_GEN_STORE) throw new Error('PT_GEN_STORE binding is required');
          return new EdgeOneKVStorage(env.PT_GEN_STORE);
        case 'vercel-redis':
          return await VercelRedisStorage.fromEnv(setup.values);
        case 'memory':
          return new MemoryStorage();
        default:
          throw new Error(`Storage provider ${setup.storageProvider} is not supported on EdgeOne`);
      }
    },
    fallbackMessage: '[ptgen] Failed to initialize EdgeOne storage, falling back to memory.',
  });

  return app;
}
