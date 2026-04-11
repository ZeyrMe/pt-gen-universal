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
          return env.PT_GEN_STORE ? new EdgeOneKVStorage(env.PT_GEN_STORE) : new MemoryStorage();
        case 'vercel-redis':
          return await VercelRedisStorage.fromEnv(setup.values);
        default:
          return new MemoryStorage();
      }
    },
    fallbackMessage: '[ptgen] Failed to initialize EdgeOne storage, falling back to memory.',
  });

  return app;
}
