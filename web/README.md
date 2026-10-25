# PT-Gen Web

PT-Gen 的 SvelteKit 静态前端，使用 Tailwind CSS 和 shadcn-svelte。生产构建会内联
JavaScript 与 CSS，再由仓库根目录的生成脚本嵌入 Hono 服务。

## 开发

先在仓库根目录启动 API：

```bash
pnpm run dev
```

再启动前端开发服务器：

```bash
pnpm run dev:web
```

Vite 会把 `/api/*` 代理到 `http://127.0.0.1:3000`。

## 构建

从仓库根目录执行：

```bash
pnpm run generate:homepage
```

提交前运行完整检查：

```bash
pnpm run check
```
