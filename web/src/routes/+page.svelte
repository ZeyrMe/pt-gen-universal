<script lang="ts">
  import SearchWorkbench from '#lib/components/SearchWorkbench.svelte';

  const supportedLinks = [
    ['豆瓣', 'https://movie.douban.com/subject/...'],
    ['IMDb', 'https://www.imdb.com/title/tt…'],
    ['Bangumi', 'https://bgm.tv/subject/…'],
    ['TMDB', 'https://www.themoviedb.org/…'],
    ['Steam', 'https://store.steampowered.com/app/…'],
    ['GOG', 'https://www.gog.com/game/…'],
    ['Indienova', 'https://indienova.com/game/…'],
  ] as const;

  const alternatives = [
    {
      href: 'https://github.com/rabbitwit/PT-Gen-Refactor',
      name: 'rabbitwit/PT-Gen-Refactor',
      description: 'PT 站资源信息生成工具重构版',
    },
    {
      href: 'https://greasyfork.org/zh-CN/scripts/329484-%E8%B1%86%E7%93%A3%E8%B5%84%E6%BA%90%E4%B8%8B%E8%BD%BD%E5%A4%A7%E5%B8%88-1%E7%A7%92%E6%90%9E%E5%AE%9A%E8%B1%86%E7%93%A3%E7%94%B5%E5%BD%B1-%E9%9F%B3%E4%B9%90-%E5%9B%BE%E4%B9%A6%E4%B8%8B%E8%BD%BD',
      name: '豆瓣资源下载大师',
      description: '一键获取豆瓣电影、音乐、图书资源信息',
    },
    {
      href: 'https://git.io/fjm3l',
      name: 'Bangumi Info Export',
      description: '导出 Bangumi 番组信息的脚本',
    },
  ] as const;
</script>

<svelte:head>
  <title>PT Gen - 资源信息生成工具</title>
  <meta
    name="description"
    content="从豆瓣、IMDb、Bangumi、TMDB、Steam、GOG 和 Indienova 生成资源信息。"
  />
</svelte:head>

<div class="page-shell">
  <SearchWorkbench />

  <section class="surface" aria-labelledby="instructions-title">
    <h2 id="instructions-title" class="surface-title mb-4">使用说明</h2>
    <div class="text-[0.95rem] leading-[1.8] text-muted-foreground">
      <h3 class="mb-4 font-semibold text-foreground">快速开始:</h3>
      <ol class="mb-6 list-decimal space-y-2 pl-6">
        <li>选择数据源 (豆瓣/IMDb/Bangumi/TMDB/Steam/GOG)</li>
        <li>输入关键词搜索,或直接粘贴完整链接</li>
        <li>点击查询按钮,等待结果生成</li>
        <li>复制生成的简介信息到 PT 站发布页面</li>
      </ol>
      <h3 class="mb-2 font-semibold text-foreground">支持的链接格式:</h3>
      <ul class="list-disc space-y-1 pl-6">
        {#each supportedLinks as [name, example]}
          <li>
            {name}:
            <code class="break-all rounded bg-muted px-1.5 py-0.5 text-foreground">{example}</code>
          </li>
        {/each}
      </ul>
    </div>
  </section>

  <section class="surface" aria-labelledby="alternatives-title">
    <h2 id="alternatives-title" class="surface-title mb-4">相关替代</h2>
    <ul class="grid list-none grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 p-0">
      {#each alternatives as item}
        <li>
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer noopener"
            class="block rounded-md p-2 text-sm text-foreground no-underline transition-colors hover:bg-muted hover:text-primary focus-visible:outline-3 focus-visible:outline-primary/30"
          >
            <span>{item.name}</span>
            <span class="mt-1 block text-xs text-muted-foreground">{item.description}</span>
          </a>
        </li>
      {/each}
    </ul>
  </section>
</div>
