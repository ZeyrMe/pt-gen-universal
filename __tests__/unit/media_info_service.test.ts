import { describe, expect, it, vi } from 'vitest';
import type { MediaInfo } from '../../lib/types/schema';
import { AppError } from '../../lib/errors';
import { MediaInfoService } from '../../src/services/media-info';

const fakeInfo: MediaInfo = {
  site: 'douban',
  id: '1292052',
  chinese_title: '肖申克的救赎',
  foreign_title: 'The Shawshank Redemption',
  aka: [],
  trans_title: [],
  this_title: [],
  year: '1994',
  playdate: ['1994-09-23'],
  region: ['美国'],
  genre: ['剧情'],
  language: ['英语'],
  duration: '142分钟',
  episodes: '',
  seasons: '',
  poster: 'https://example.com/poster.jpg',
  director: ['Frank Darabont'],
  writer: ['Stephen King'],
  cast: ['Tim Robbins'],
  introduction: '希望让人自由',
  awards: '',
  tags: [],
};

describe('MediaInfoService', () => {
  it('优先使用 url 解析资源并拉取信息', async () => {
    const orchestrator = {
      matchUrl: vi.fn().mockReturnValue({ site: 'douban', sid: '1292052' }),
      getMediaInfo: vi.fn().mockResolvedValue(fakeInfo),
    } as any;
    const service = new MediaInfoService(orchestrator);

    const result = await service.resolve({
      url: 'https://movie.douban.com/subject/1292052/',
      site: 'ignored',
      sid: 'ignored',
    });

    expect(orchestrator.matchUrl).toHaveBeenCalledWith('https://movie.douban.com/subject/1292052/');
    expect(orchestrator.getMediaInfo).toHaveBeenCalledWith('douban', '1292052');
    expect(result).toMatchObject({
      site: 'douban',
      sid: '1292052',
      info: fakeInfo,
    });
  });

  it('支持直接使用 site/sid 解析资源', async () => {
    const orchestrator = {
      matchUrl: vi.fn(),
      getMediaInfo: vi.fn().mockResolvedValue(fakeInfo),
    } as any;
    const service = new MediaInfoService(orchestrator);

    const result = await service.resolve({ site: 'douban', sid: '1292052' });

    expect(orchestrator.matchUrl).not.toHaveBeenCalled();
    expect(orchestrator.getMediaInfo).toHaveBeenCalledWith('douban', '1292052');
    expect(result.sid).toBe('1292052');
  });

  it('缺少定位信息时抛出 INVALID_PARAM', async () => {
    const service = new MediaInfoService({} as any);

    await expect(service.resolve({})).rejects.toBeInstanceOf(AppError);
    await expect(service.resolve({})).rejects.toMatchObject({
      code: 'INVALID_PARAM',
    });
  });

  it('生成三种格式的输出', () => {
    const service = new MediaInfoService({} as any);
    const formats = service.renderFormats(fakeInfo);

    expect(formats.bbcode).toContain('◎年　　代　1994');
    expect(formats.markdown).toContain('## 基本信息');
    expect(formats.json).toContain('"site": "douban"');
    expect(JSON.parse(formats.json).poster_proxy).toBeNull();
  });

  it('在公共 JSON 中同时保留原海报和代理海报', () => {
    const service = new MediaInfoService({} as any, {
      imageCdnPrefix: ' https://cdn.example/? ',
    });

    const publicInfo = service.toPublicInfo(fakeInfo);
    expect(publicInfo.poster).toBe(fakeInfo.poster);
    expect(publicInfo.poster_proxy).toBe(`https://cdn.example/?${fakeInfo.poster}`);
    expect(JSON.parse(service.renderFormats(fakeInfo).json)).toMatchObject(publicInfo);
  });

  it('json 格式不重复附加文本输出', () => {
    const service = new MediaInfoService({} as any);

    expect(service.renderFormat(fakeInfo, 'json')).toBeUndefined();
    expect(service.renderFormat(fakeInfo, 'bbcode')).toContain('◎年　　代　1994');
    expect(service.renderFormat(fakeInfo, 'markdown')).toContain('## 基本信息');
  });

  it('透传下游异常，交给上层统一映射', async () => {
    const orchestrator = {
      getMediaInfo: vi.fn().mockRejectedValue(new Error('boom')),
    } as any;
    const service = new MediaInfoService(orchestrator);

    await expect(service.resolve({ site: 'douban', sid: '1292052' })).rejects.toThrow('boom');
  });

  it('合并同一资源的并发抓取请求', async () => {
    let complete!: (info: MediaInfo) => void;
    const pending = new Promise<MediaInfo>((resolve) => {
      complete = resolve;
    });
    const orchestrator = {
      getMediaInfo: vi.fn().mockReturnValue(pending),
    } as any;
    const service = new MediaInfoService(orchestrator);

    const first = service.resolve({ site: 'douban', sid: '1292052' });
    const second = service.resolve({ site: 'douban', sid: '1292052' });

    expect(orchestrator.getMediaInfo).toHaveBeenCalledOnce();
    complete(fakeInfo);
    await expect(Promise.all([first, second])).resolves.toEqual([
      { site: 'douban', sid: '1292052', info: fakeInfo },
      { site: 'douban', sid: '1292052', info: fakeInfo },
    ]);
  });

  it('失败后清理并发状态并允许下一次请求重试', async () => {
    const orchestrator = {
      getMediaInfo: vi
        .fn()
        .mockRejectedValueOnce(new Error('temporary'))
        .mockResolvedValue(fakeInfo),
    } as any;
    const service = new MediaInfoService(orchestrator);

    await expect(service.resolve({ site: 'douban', sid: '1292052' })).rejects.toThrow('temporary');
    await expect(service.resolve({ site: 'douban', sid: '1292052' })).resolves.toMatchObject({
      info: fakeInfo,
    });
    expect(orchestrator.getMediaInfo).toHaveBeenCalledTimes(2);
  });

  it('不会合并不同资源的并发请求', async () => {
    const orchestrator = {
      getMediaInfo: vi.fn().mockResolvedValue(fakeInfo),
    } as any;
    const service = new MediaInfoService(orchestrator);

    await Promise.all([
      service.resolve({ site: 'douban', sid: '1' }),
      service.resolve({ site: 'douban', sid: '2' }),
    ]);

    expect(orchestrator.getMediaInfo).toHaveBeenCalledTimes(2);
  });
});
