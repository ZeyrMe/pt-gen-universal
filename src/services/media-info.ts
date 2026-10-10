import { BBCodeFormatter } from '../../lib/formatters/bbcode';
import { MarkdownFormatter } from '../../lib/formatters/markdown';
import { Orchestrator } from '../../lib/orchestrator';
import { AppError, ErrorCode } from '../../lib/errors';
import type { MediaInfo } from '../../lib/types/schema';
import type { AppConfig } from '../../lib/types/config';
import { getPosterUrl } from '../../lib/utils/poster';

export interface MediaLocator {
  url?: string;
  site?: string;
  sid?: string;
}

export type MediaInfoFormat = 'json' | 'bbcode' | 'markdown';

export interface MediaResolveResult {
  site: string;
  sid: string;
  info: MediaInfo;
}

export type PublicMediaInfo = MediaInfo & {
  poster_proxy: string | null;
};

export class MediaInfoService {
  private readonly bbcodeFormatter: BBCodeFormatter;
  private readonly markdownFormatter: MarkdownFormatter;
  private readonly imageCdnPrefix?: string;
  private readonly inFlight = new Map<string, Promise<MediaResolveResult>>();

  constructor(
    private readonly orchestrator: Orchestrator,
    config: AppConfig = {}
  ) {
    this.imageCdnPrefix = config.imageCdnPrefix?.trim() || undefined;
    this.bbcodeFormatter = new BBCodeFormatter(this.imageCdnPrefix);
    this.markdownFormatter = new MarkdownFormatter(this.imageCdnPrefix);
  }

  async resolve(locator: MediaLocator): Promise<MediaResolveResult> {
    let site: string;
    let sid: string;

    if (locator.url) {
      ({ site, sid } = this.orchestrator.matchUrl(locator.url));
    } else if (locator.site && locator.sid) {
      site = locator.site;
      sid = locator.sid;
    } else {
      throw new AppError(ErrorCode.INVALID_PARAM, "Missing 'url' or 'site/sid' parameters");
    }

    const key = JSON.stringify([site, sid]);
    const existing = this.inFlight.get(key);
    if (existing) return await existing;

    const pending = this.orchestrator.getMediaInfo(site, sid).then((info) => ({ site, sid, info }));
    this.inFlight.set(key, pending);

    try {
      return await pending;
    } finally {
      if (this.inFlight.get(key) === pending) {
        this.inFlight.delete(key);
      }
    }
  }

  renderFormats(info: MediaInfo): { bbcode: string; markdown: string; json: string } {
    return {
      bbcode: this.bbcodeFormatter.format(info),
      markdown: this.markdownFormatter.format(info),
      json: JSON.stringify(this.toPublicInfo(info), null, 2),
    };
  }

  toPublicInfo(info: MediaInfo): PublicMediaInfo {
    return {
      ...info,
      poster_proxy:
        info.poster && this.imageCdnPrefix ? getPosterUrl(info.poster, this.imageCdnPrefix) : null,
    };
  }

  renderFormat(info: MediaInfo, format: MediaInfoFormat): string | undefined {
    if (format === 'json') return undefined;
    if (format === 'markdown') return this.markdownFormatter.format(info);
    return this.bbcodeFormatter.format(info);
  }
}
