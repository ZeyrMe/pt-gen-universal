# 部署与配置

本文介绍 Cloudflare Workers、Vercel、EdgeOne Pages 和 Docker Compose 的部署步骤。选择一种方式完成即可。

## Cloudflare Workers

### 一键部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ZeyrMe/pt-gen-universal)

点击按钮后，登录 Cloudflare，选择账号并确认部署。

部署完成后，在 Worker 的 **Settings -> Variables and Secrets** 中按需添加以下变量：

- `APIKEY`
- `TMDB_API_KEY`
- `DOUBAN_COOKIE`
- `INDIENOVA_COOKIE`
- `IMAGE_CDN_PREFIX`

KV 缓存使用绑定名 `PT_GEN_STORE`。Deploy Button 通常会根据仓库配置完成绑定；如果控制台要求选择或创建 KV namespace，请创建一个并将绑定名设为 `PT_GEN_STORE`。

### 手动部署

```bash
git clone https://github.com/ZeyrMe/pt-gen-universal.git
cd pt-gen-universal
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install --frozen-lockfile
pnpm exec wrangler login
pnpm run build:cf
```

首次部署时，如果 Wrangler 提示 KV 绑定尚未完成，按提示创建或选择一个 KV namespace，并保持绑定名为 `PT_GEN_STORE`即可。

敏感配置直接在 Cloudflare 控制台的 **Settings -> Variables and Secrets** 中添加，然后重新部署 Worker。

### 验证部署

打开 Worker 的访问域名，确认首页可以显示；然后访问一个详情接口：

```text
https://你的域名/api/v2/info/douban/1292052
```

如果中国大陆无法访问 Worker 自带域名，可以在 **Settings -> Domains & Routes -> Add Custom Domain** 中添加自己的域名，再使用自定义域名访问。

## Vercel

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FZeyrMe%2Fpt-gen-universal&env=APIKEY,TMDB_API_KEY,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,DOUBAN_COOKIE,INDIENOVA_COOKIE&envDescription=PT-Gen%20%E8%BF%90%E8%A1%8C%E6%89%80%E9%9C%80%E7%9A%84%20API%20%E5%AF%86%E9%92%A5%E3%80%81Redis%20REST%20%E5%8F%8A%20Cookie&envLink=https%3A%2F%2Fgithub.com%2FZeyrMe%2Fpt-gen-universal%23%E9%85%8D%E7%BD%AE)

点击按钮后登录 Vercel，选择账号和项目名，按页面提示填写需要的环境变量，然后点击 **Deploy**。Vercel 会自动克隆仓库、安装依赖并完成构建。

如果使用 Vercel Marketplace 的 Redis，先绑定 Redis 服务；如果服务提供的是 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN`，使用这两个变量即可。使用 Upstash 时填写：

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

其他变量按需填写：

- `APIKEY`
- `TMDB_API_KEY`
- `DOUBAN_COOKIE`
- `INDIENOVA_COOKIE`

### 验证部署

打开 Vercel 生成的项目域名，确认首页可以显示；然后访问：

```text
https://你的域名/api/v2/search?q=肖申克&source=douban
```

如果中国大陆无法访问 Vercel 自带域名，可以在 **Settings -> Domains** 中添加自己的域名，再使用自定义域名访问。

## EdgeOne Pages

### 一键部署

[![Use EdgeOne Pages to deploy](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2FZeyrMe%2Fpt-gen-universal&install-command=npx%20pnpm%409.15.9%20install%20--frozen-lockfile&build-command=npx%20pnpm%409.15.9%20run%20build%3Aedgeone&output-directory=.)

点击按钮后登录 EdgeOne，确认导入仓库；如果页面询问是否克隆或创建项目，选择确认即可。构建设置使用仓库中的 `edgeone.json`：

- 安装命令：`npx pnpm@9.15.9 install --frozen-lockfile`
- 构建命令：`npx pnpm@9.15.9 run build:edgeone`
- 输出目录：`.`

在项目配置中按需添加：

- `APIKEY`
- `TMDB_API_KEY`
- `DOUBAN_COOKIE`
- `INDIENOVA_COOKIE`

需要持久化缓存时，在 EdgeOne 项目中创建 Pages KV，并将绑定名设置为 `PT_GEN_STORE`。如果控制台提供了 KV 绑定选项，选择该绑定即可；不配置 KV 时服务仍可运行，但使用的是内存缓存。

### 验证部署

打开 EdgeOne 生成的项目域名，确认首页可以显示；然后访问：

```text
https://你的域名/api/v2/info/douban/1292052
```

如果需要使用自己的域名，可以在 EdgeOne Pages 项目的域名设置中添加自定义域名。中国大陆访问异常时，优先使用自定义域名进行访问。

## Docker Compose

Docker Compose 适合在自己的服务器或本地运行完整的应用和 Redis。这里不需要本地安装 Node.js，Docker 会在构建镜像时完成依赖安装。

### 准备环境

需要已安装 Docker Engine 和 Docker Compose v2。

```bash
git clone https://github.com/ZeyrMe/pt-gen-universal.git
cd pt-gen-universal
cp .env.example .env
```

根据需要编辑 `.env`，然后启动：

```bash
docker compose up --build -d
```

`compose.yaml` 会自动启动应用和 Redis，并将应用连接到 `redis://redis:6379`。不要把这个地址改成 `redis://127.0.0.1:6379`。

### 验证部署

打开 `http://localhost:3000`，确认首页可以显示；然后访问：

```text
http://localhost:3000/api/v2/info/douban/1292052
```

查看运行状态：

```bash
docker compose ps
docker compose logs -f app
```

更新服务：

```bash
docker compose up --build -d
```

停止服务并保留 Redis 数据：

```bash
docker compose down
```

## 部署后遇到问题

- 页面打不开：确认部署是否已经完成，并直接访问平台生成的项目域名。
- 详情或搜索请求失败：检查对应平台的 `TMDB_API_KEY`、Cookie 或 API Key 是否填写在当前部署环境。
- 中国大陆无法访问平台自带域名：为项目添加自定义域名后再访问。
- Docker Compose 启动失败：执行 `docker compose ps` 和 `docker compose logs app` 查看具体错误。
