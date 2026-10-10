import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { serve } from '@hono/node-server';
import { createNodeRuntime } from '../runtime/node';

/**
 * Node.js 运行时入口
 */

if (existsSync('.env')) {
  loadEnvFile('.env');
}

const runtime = await createNodeRuntime('node', process.env);

const server = serve(
  {
    fetch: runtime.app.fetch,
    hostname: runtime.hostname,
    port: runtime.port,
  },
  (info) => {
    console.log(`PT-Gen server running on http://${runtime.hostname}:${info.port}`);
  }
);

let shuttingDown = false;
const shutdown = (signal: NodeJS.Signals) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[ptgen] received ${signal}, shutting down`);
  server.close((error) => {
    if (error) {
      console.error('[ptgen] failed to close server cleanly', error);
      process.exitCode = 1;
    }
  });
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
