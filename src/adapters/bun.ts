import { createNodeRuntime } from '../runtime/node';

/**
 * Bun 运行时入口
 */

const runtime = await createNodeRuntime('bun', process.env);

// Bun 服务器配置
export default {
  fetch: runtime.app.fetch,
  hostname: runtime.hostname,
  port: runtime.port,
};

console.log(`PT-Gen server running on http://${runtime.hostname}:${runtime.port}`);
