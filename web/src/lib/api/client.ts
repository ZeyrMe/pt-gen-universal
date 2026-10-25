export type OutputFormat = 'bbcode' | 'markdown' | 'json';

export interface SearchResult {
  title?: string;
  subtitle?: string;
  year?: string;
  subtype?: string;
  link: string;
}

export interface InfoResponse {
  success: boolean;
  error?: string | null;
  format?: string;
  formats?: Record<OutputFormat, string>;
}

interface SearchResponse {
  success: boolean;
  error?: string | null;
  data?: SearchResult[];
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function parseApiResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const rawText = await response.text();
  if (/<!doctype html>|<html[\s>]/i.test(rawText)) {
    throw new ApiRequestError(
      '接口返回了 HTML 页面，请确认 /api/* 已正确路由到服务端函数',
      response.status
    );
  }

  try {
    return JSON.parse(rawText);
  } catch {
    throw new ApiRequestError(
      `接口返回了非 JSON 内容（${contentType || 'unknown'}）`,
      response.status
    );
  }
}

function getErrorMessage(data: unknown, status: number): string {
  if (
    data &&
    typeof data === 'object' &&
    'error' in data &&
    typeof data.error === 'string' &&
    data.error
  ) {
    return data.error;
  }

  return status === 429 ? '请求过于频繁，请稍后再试' : '网络请求失败';
}

export async function fetchMediaInfo(url: string, apiKey: string): Promise<InfoResponse> {
  const params = new URLSearchParams({ url });
  if (apiKey) params.set('apikey', apiKey);

  const response = await fetch(`/api/v1/info?${params.toString()}`);
  const data = (await parseApiResponse(response)) as InfoResponse;
  if (!response.ok || !data.success) {
    throw new ApiRequestError(getErrorMessage(data, response.status), response.status);
  }

  return data;
}

export async function searchMedia(
  query: string,
  source: string,
  apiKey: string
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ search: query, source });
  if (apiKey) params.set('apikey', apiKey);

  const response = await fetch(`/api/v1/search?${params.toString()}`);
  const data = (await parseApiResponse(response)) as SearchResponse;
  if (!response.ok || !data.success) {
    throw new ApiRequestError(getErrorMessage(data, response.status), response.status);
  }

  return Array.isArray(data.data) ? data.data : [];
}
