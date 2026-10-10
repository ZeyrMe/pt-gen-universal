import { describe, expect, it, vi } from 'vitest';
import type { Storage } from '../../src/storage/storage';
import { createRuntimeApp } from '../../src/runtime/runtime-factory';

class TrackingStorage implements Storage {
  public getCalls = 0;

  async get() {
    this.getCalls += 1;
    return null;
  }

  async put() {}

  async delete() {}
}

function createKVBinding() {
  return {
    async get() {
      return null;
    },
    async put() {},
    async delete() {},
  };
}

describe('runtime factory', () => {
  it('把解析后的 setup 传给 storage 工厂并构建可用 app', async () => {
    const storage = new TrackingStorage();
    const createStorage = vi.fn(async (setup) => {
      expect(setup.storageProvider).toBe('cloudflare-kv');
      expect(setup.appConfig.storageProvider).toBe('cloudflare-kv');
      return storage;
    });

    const { app, setup } = await createRuntimeApp({
      platform: 'cloudflare',
      env: { PT_GEN_STORE: createKVBinding(), CACHE_TTL: '60' },
      bindings: { PT_GEN_STORE: createKVBinding() },
      createStorage,
      fallbackMessage: 'should not fallback',
    });

    const res = await app.request('http://localhost/api/v2/info?site=unknown&sid=1');

    expect(res.status).toBe(400);
    expect(createStorage).toHaveBeenCalledOnce();
    expect(storage.getCalls).toBe(1);
    expect(setup.storageProvider).toBe('cloudflare-kv');
    expect(setup.requestedStorageProvider).toBe('auto');
  });

  it('storage 初始化失败时回退到 memory 语义并输出 warn', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fallbackStorage = new TrackingStorage();

    const { app, setup } = await createRuntimeApp({
      platform: 'vercel',
      env: {
        CACHE_TTL: '60',
        UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'token',
      },
      createStorage: async () => {
        throw new Error('redis init failed');
      },
      createFallbackStorage: async () => fallbackStorage,
      fallbackMessage: '[ptgen] test fallback',
    });

    const res = await app.request('http://localhost/api/v2/info?site=unknown&sid=1');

    expect(res.status).toBe(400);
    expect(fallbackStorage.getCalls).toBe(1);
    expect(setup.storageProvider).toBe('memory');
    expect(setup.requestedStorageProvider).toBe('auto');
    expect(setup.appConfig.storageProvider).toBe('memory');
    expect(setup.appConfig.runtimeStatus).toMatchObject({
      requestedStorageProvider: 'auto',
      effectiveStorageProvider: 'memory',
      storageDegraded: true,
    });
    expect(consoleWarn).toHaveBeenCalledWith('[ptgen] test fallback', expect.any(Error));

    consoleWarn.mockRestore();
  });

  it('显式 storage provider 初始化失败时默认快速失败', async () => {
    await expect(
      createRuntimeApp({
        platform: 'vercel',
        env: { STORAGE_PROVIDER: 'vercel-redis' },
        createStorage: async () => {
          throw new Error('redis init failed');
        },
        fallbackMessage: 'should not fallback',
      })
    ).rejects.toThrow('redis init failed');
  });

  it('显式 degrade 模式会回退并通过健康接口报告实际存储', async () => {
    const { app, setup } = await createRuntimeApp({
      platform: 'vercel',
      env: {
        STORAGE_PROVIDER: 'vercel-redis',
        STORAGE_FAILURE_MODE: 'degrade',
      },
      createStorage: async () => {
        throw new Error('redis init failed');
      },
      createFallbackStorage: async () => new TrackingStorage(),
      fallbackMessage: '[ptgen] test fallback',
    });

    const health = await (await app.request('http://localhost/health')).json();

    expect(setup.storageProvider).toBe('memory');
    expect(health).toEqual({
      status: 'degraded',
      platform: 'vercel',
      storage: {
        requested: 'vercel-redis',
        effective: 'memory',
        degraded: true,
      },
    });
  });
});
