# PT-Gen Universal

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FYunFeng86%2Fpt-gen-universal.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2FYunFeng86%2Fpt-gen-universal?ref=badge_shield&issueType=license)

一个面向 PT 和自动化工具的媒体信息 API：从豆瓣、IMDb、TMDB、Bangumi、Steam 和 GOG 获取资料，并输出 JSON、BBCode 或 Markdown。

## 功能

- 支持媒体详情和关键词搜索
- 提供 JSON、BBCode、Markdown 三种输出格式
- 兼容 V1 API，同时提供统一的 V2 API
- 支持海报代理、缓存、API Key 和请求限流
- 支持 Cloudflare Workers、Vercel 和 EdgeOne 等 Edge 平台

## 支持来源

| 来源      | 详情 | 搜索 |
| --------- | ---- | ---- |
| Douban    | ✅   | ✅   |
| IMDb      | ✅   | ✅   |
| Bangumi   | ✅   | ✅   |
| TMDB      | ✅   | ✅   |
| Steam     | ✅   | ✅   |
| GOG       | ✅   | ✅   |
| Indienova | ✅   | -    |

## 部署

Cloudflare Workers、Vercel 和 EdgeOne 是推荐的部署目标。三者都提供适合轻量部署的 Edge 运行环境，并有适合个人项目的免费额度。

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ZeyrMe/pt-gen-universal)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FZeyrMe%2Fpt-gen-universal&env=APIKEY,TMDB_API_KEY,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,DOUBAN_COOKIE,INDIENOVA_COOKIE&envDescription=PT-Gen%20%E8%BF%90%E8%A1%8C%E6%89%80%E9%9C%80%E7%9A%84%20API%20%E5%AF%86%E9%92%A5%E3%80%81Redis%20REST%20%E5%8F%8A%20Cookie&envLink=https%3A%2F%2Fgithub.com%2FZeyrMe%2Fpt-gen-universal%23%E9%85%8D%E7%BD%AE)

[![Use EdgeOne Pages to deploy](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2FZeyrMe%2Fpt-gen-universal&install-command=npx%20pnpm%409.15.9%20install%20--frozen-lockfile&build-command=npx%20pnpm%409.15.9%20run%20build%3Aedgeone&output-directory=.)

| 平台               | 运行时 | 推荐存储      |
| ------------------ | ------ | ------------- |
| Cloudflare Workers | Edge   | Cloudflare KV |
| Vercel             | Edge   | Upstash Redis |
| EdgeOne            | Edge   | Pages KV      |

项目也提供 Netlify Edge、Node.js 和 Bun 入口，适合已有对应运行环境的部署场景。

## 快速开始

### 环境要求

- Node.js `20.19.0+`
- pnpm `9.15.9`

```bash
git clone https://github.com/ZeyrMe/pt-gen-universal.git
cd pt-gen-universal
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install --frozen-lockfile
pnpm run dev
```

默认地址：`http://localhost:3000`

如需配置 API Key、TMDB 或持久化缓存：

```bash
cp .env.example .env
```

## API

### 获取详情

```bash
GET /api/v2/info?url=https://movie.douban.com/subject/1292052/
GET /api/v2/info/douban/1292052
```

### 搜索

```bash
GET /api/v2/search?q=肖申克&source=douban
```

### 指定输出格式

```bash
curl -X POST "http://localhost:3000/api/v2/info" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "url": "https://movie.douban.com/subject/1292052/",
    "format": "bbcode"
  }'
```

`format` 支持 `json`、`bbcode` 和 `markdown`。API Key 也可以通过 `?apikey=xxx` 或 `Authorization: Bearer xxx` 传递。

旧版入口仍然可用：`/api/v1/info`、`/api/v1/search`、`/api/info` 和 `/?url=...`。

## 配置

| 变量                       | 用途                                    |
| -------------------------- | --------------------------------------- |
| `APIKEY`                   | API 访问密钥                            |
| `TMDB_API_KEY`             | TMDB 搜索和详情                         |
| `DOUBAN_COOKIE`            | 豆瓣抓取辅助                            |
| `INDIENOVA_COOKIE`         | Indienova 抓取辅助                      |
| `IMAGE_CDN_PREFIX`         | 海报代理地址                            |
| `CACHE_TTL`                | 缓存时间，单位为秒                      |
| `PT_GEN_STORE`             | Cloudflare / EdgeOne KV 绑定            |
| `UPSTASH_REDIS_REST_URL`   | Vercel Redis 地址                       |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel Redis Token                      |
| `REDIS_URL`                | Node.js / Railway / Zeabur Redis 连接串 |

未配置持久化存储时，服务会使用内存缓存。完整变量示例见 [.env.example](.env.example)。

## 开发

```bash
pnpm run check
```

常用命令：

```bash
pnpm run dev          # Node.js 本地开发
pnpm run dev:cf       # Wrangler 本地模拟 Cloudflare
pnpm run test:run     # 运行测试
```

## 致谢

本项目基于 [Rhilip/pt-gen-cfworker](https://github.com/Rhilip/pt-gen-cfworker) 改写，并使用 [Hono](https://hono.dev/) 提供跨平台运行时支持。

## License

MIT
