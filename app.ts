import type { Hono } from 'hono';
import { readGlobalProcessEnv } from './src/runtime/env';
import { createVercelRuntime } from './src/runtime/vercel';

const app = (await createVercelRuntime(readGlobalProcessEnv())) satisfies Hono;

export default app;
