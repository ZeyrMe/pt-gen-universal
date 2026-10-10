import { handle } from 'hono/vercel';
import { createVercelRuntime } from './runtime/vercel';
import { readGlobalProcessEnv } from './runtime/env';

let cachedHandlerPromise: Promise<(req: Request) => Response | Promise<Response>> | null = null;

async function getHandler() {
  if (!cachedHandlerPromise) {
    const env = readGlobalProcessEnv();
    cachedHandlerPromise = createVercelRuntime(env).then((app) => handle(app));
  }

  return await cachedHandlerPromise;
}

export default async function vercelEntry(request: Request) {
  const handler = await getHandler();
  return await handler(request);
}
