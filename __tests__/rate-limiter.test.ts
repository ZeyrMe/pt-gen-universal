import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../lib/rate-limiter';
import { AppError, ErrorCode } from '../lib/errors';

describe('RateLimiter 频率限制器', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ rate: 5, capacity: 10 });
  });

  describe('tryAcquire', () => {
    it('应该成功获取令牌', async () => {
      const result = await limiter.tryAcquire('test');
      expect(result).toBe(true);
    });

    it('令牌耗尽时应该返回 false', async () => {
      // 消耗所有令牌
      for (let i = 0; i < 10; i++) {
        await limiter.tryAcquire('test');
      }

      const result = await limiter.tryAcquire('test');
      expect(result).toBe(false);
    });

    it('不同站点应该有独立的令牌桶', async () => {
      // 消耗 site1 的所有令牌
      for (let i = 0; i < 10; i++) {
        await limiter.tryAcquire('site1');
      }

      // site2 应该还有令牌
      const result = await limiter.tryAcquire('site2');
      expect(result).toBe(true);
    });
  });

  describe('明确的调用语义', () => {
    it('可选请求在没有令牌时返回 false', async () => {
      const emptyLimiter = new RateLimiter({ rate: 0, capacity: 1 });
      await emptyLimiter.tryAcquire('test');

      await expect(emptyLimiter.tryAcquireOptional('test')).resolves.toBe(false);
    });

    it('核心请求等待超时后抛出 UPSTREAM_THROTTLED', async () => {
      const emptyLimiter = new RateLimiter({ rate: 0, capacity: 1 });
      await emptyLimiter.tryAcquire('douban');

      await expect(emptyLimiter.acquireRequired('douban', 0)).rejects.toMatchObject({
        code: ErrorCode.UPSTREAM_THROTTLED,
        httpStatus: 503,
      } satisfies Partial<AppError>);
    });
  });

  describe('令牌补充机制', () => {
    it('应该随时间补充令牌', async () => {
      // 消耗所有令牌
      for (let i = 0; i < 10; i++) {
        await limiter.tryAcquire('test');
      }

      // 等待一段时间让令牌补充
      await limiter.sleep(1000); // 1秒应该补充5个令牌

      // 应该能获取新令牌
      const result = await limiter.tryAcquire('test');
      expect(result).toBe(true);
    });
  });

  describe('reset', () => {
    it('应该重置指定站点的限制', async () => {
      // 消耗所有令牌
      for (let i = 0; i < 10; i++) {
        await limiter.tryAcquire('test');
      }

      // 重置
      limiter.reset('test');

      // 应该能再次获取令牌
      const result = await limiter.tryAcquire('test');
      expect(result).toBe(true);
    });
  });
});
