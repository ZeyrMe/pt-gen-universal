import { handle } from 'hono/netlify';
import { createNetlifyRuntime } from '../../src/runtime/netlify';

let cachedHandlerPromise: Promise<(req: Request, context: any) => Response | Promise<Response>> | null =
  null;

const NETLIFY_ENV_KEYS = [
  'APIKEY',
  'ENABLE_DEBUG',
  'DISABLE_SEARCH',
  'DOUBAN_COOKIE',
  'INDIENOVA_COOKIE',
  'TMDB_API_KEY',
  'REQUEST_TIMEOUT_MS',
  'PORT',
  'CACHE_TTL',
  'STORAGE_PROVIDER',
  'CACHE_STORE_NAME',
  'RATE_LIMIT_MODE',
  'RATE_LIMIT_PER_MINUTE',
  'CACHE_MAX_ENTRIES',
  'CACHE_SWEEP_INTERVAL_MS',
  'PROXY_URL',
  'PROXY_ALLOW_SENSITIVE_HEADERS',
  'DOUBAN_USER_AGENT',
  'DOUBAN_ACCEPT_LANGUAGE',
  'DOUBAN_TIMEOUT_MS',
  'DOUBAN_WARMUP_TIMEOUT_MS',
  'IMDB_USER_AGENT',
  'IMDB_TIMEOUT_MS',
  'TMDB_USER_AGENT',
  'TMDB_TIMEOUT_MS',
  'REDIS_URL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
] as const;

type NetlifyEnvAccessors = Record<string, unknown> & {
  toObject?: () => Record<string, unknown>;
  get?: (key: string) => unknown;
  has?: (key: string) => boolean;
};

type NetlifyEdgeGlobals = typeof globalThis & {
  Netlify?: {
    env?: NetlifyEnvAccessors;
  };
};

function resolveNetlifyAccessorEnv(edgeEnv: NetlifyEnvAccessors): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const key of NETLIFY_ENV_KEYS) {
    if (typeof edgeEnv.has === 'function' && !edgeEnv.has(key)) continue;
    const value = edgeEnv.get?.(key);
    if (value !== undefined) {
      values[key] = value;
    }
  }

  return values;
}

export function resolveNetlifyEnv(globals: NetlifyEdgeGlobals = globalThis as NetlifyEdgeGlobals) {
  const edgeEnv = globals.Netlify?.env;
  if (edgeEnv && typeof edgeEnv.toObject === 'function') {
    return edgeEnv.toObject();
  }

  if (edgeEnv && typeof edgeEnv.get === 'function') {
    return resolveNetlifyAccessorEnv(edgeEnv);
  }

  if (edgeEnv) {
    return edgeEnv;
  }

  return typeof process !== 'undefined' ? process.env : {};
}

async function getHandler() {
  if (!cachedHandlerPromise) {
    const env = resolveNetlifyEnv();
    cachedHandlerPromise = createNetlifyRuntime(env).then((app) => handle(app));
  }

  return await cachedHandlerPromise;
}

export default async function netlifyEdgeEntry(request: Request, context: any) {
  const handler = await getHandler();
  return await handler(request, context);
}

export const config = {
  path: '/*',
};
