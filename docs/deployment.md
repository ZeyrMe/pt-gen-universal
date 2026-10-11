# 部署与配置

本文介绍 Cloudflare Workers、Vercel、EdgeOne Pages 和 Docker Compose 的部署步骤。选择一种方式完成即可。

## Cloudflare Workers

### 一键部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ZeyrMe/pt-gen-universal)

点击按钮后，登录 Cloudflare，进入“设置您的应用程序”页面。按下面的内容填写：

- **Git 帐户**：选择要使用的 Cloudflare 账号。
- **项目名称**：使用默认名称，或者填写 Worker 项目名称。
- **Select KV 命名空间**：选择已有 KV，或选择“+ 新建”。新建时将命名空间命名为 `pt-gen-universal` 即可，绑定名保持 `PT_GEN_STORE`。
- **Worker 变量**：按需填写 `APIKEY`、`TMDB_API_KEY`、`DOUBAN_COOKIE`、`INDIENOVA_COOKIE` 和 `IMAGE_CDN_PREFIX`。
- **创建专用 Git 存储库**：按需选择。勾选后，Cloudflare 会为项目创建一个 Git 存储库。

其余变量可以在“高级设置”中按需填写。填写完成后，点击页面底部的部署按钮。

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

首次部署时，如果 Wrangler 提示 KV 绑定尚未完成，按提示创建或选择一个 KV 命名空间，并保持绑定名为 `PT_GEN_STORE` 即可。

部署后如需补充变量，在 Worker 的 **Settings -> Variables and Secrets** 中添加，然后重新部署 Worker。

### 验证部署

打开 Worker 的访问域名，确认首页可以显示；然后访问一个详情接口：

```text
https://你的域名/api/v2/info/douban/1292052
```

如果中国大陆无法访问 Worker 自带域名，可以在 **Settings -> Domains & Routes -> Add Custom Domain** 中添加自己的域名，再使用自定义域名访问。

## Vercel

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FZeyrMe%2Fpt-gen-universal&env=APIKEY,TMDB_API_KEY,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,DOUBAN_COOKIE,INDIENOVA_COOKIE&envDescription=PT-Gen%20%E8%BF%90%E8%A1%8C%E6%89%80%E9%9C%80%E7%9A%84%20API%20%E5%AF%86%E9%92%A5%E3%80%81Redis%20REST%20%E5%8F%8A%20Cookie&envLink=https%3A%2F%2Fgithub.com%2FZeyrMe%2Fpt-gen-universal%23%E9%85%8D%E7%BD%AE)

点击按钮后进入 Vercel 的 **New Project** 页面。页面会显示正在从 GitHub 克隆 `ZeyrMe/pt-gen-universal` 的 `master` 分支。

先确认以下项目：

- **Git Scope**：选择要使用的 GitHub 账号或组织。
- **Private Repository Name**：填写要创建的仓库名称；根据右侧开关确定目前的仓库状态为私有还是公开。
- **Vercel Team**：选择部署到个人项目或团队。

点击 **Create** 后进入第二步 **Add Environment Variables**。部署按钮会预先填好变量名，直接填写对应的 **Value**：

| 变量名                     | 填写内容                                      |
| -------------------------- | --------------------------------------------- |
| `APIKEY`                   | 自行设置的 API 访问密钥                       |
| `TMDB_API_KEY`             | TMDB API 密钥；不使用 TMDB 时留空             |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST 地址；不使用 Redis 时留空  |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token；不使用 Redis 时留空 |
| `DOUBAN_COOKIE`            | 豆瓣 Cookie；不需要时留空                     |
| `INDIENOVA_COOKIE`         | Indienova Cookie；不需要时留空                |

填写完成后点击页面底部的 **Deploy**。Vercel 会自动安装依赖并完成构建。

### 验证部署

打开 Vercel 生成的项目域名，确认首页可以显示；然后访问：

```text
https://你的域名/api/v2/search?q=肖申克&source=douban
```

如果中国大陆无法访问 Vercel 自带域名，可以在 **Settings -> Domains** 中添加自己的域名，再使用自定义域名访问。

## EdgeOne Pages

### 一键部署

[![Use EdgeOne Pages to deploy](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2FZeyrMe%2Fpt-gen-universal&install-command=npx%20pnpm%409.15.9%20install%20--frozen-lockfile&build-command=npx%20pnpm%409.15.9%20run%20build%3Aedgeone&output-directory=.)

点击按钮后登录 EdgeOne，按页面左侧的三个步骤操作：`Select Git provider`、`Configure Project`、`Start Deployment`。

在 `Configure Project` 中填写：

- **Project name**：保持默认值或填写项目名称。
- **Repository name**：保持默认值 `pt-gen-universal`，或填写要创建的仓库名称。
- **Acceleration region**：按需要选择，默认使用 `Global (MLC excluded)`。
- **Repository type**：按需要选择 `Private` 或 `Public`。

构建设置使用仓库中的 `edgeone.json`：

- 安装命令：`npx pnpm@9.15.9 install --frozen-lockfile`
- 构建命令：`npx pnpm@9.15.9 run build:edgeone`
- 输出目录：`.`

在 `Environment Variables` 中按需添加：

- `APIKEY`
- `TMDB_API_KEY`
- `DOUBAN_COOKIE`
- `INDIENOVA_COOKIE`

需要持久化缓存时，在 EdgeOne 项目中创建 Pages KV，并将绑定名设置为 `PT_GEN_STORE`。填写完成后点击 **Create**，再进入 `Start Deployment`。

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
