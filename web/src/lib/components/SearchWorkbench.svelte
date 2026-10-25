<script lang="ts">
  import {
    ApiRequestError,
    fetchMediaInfo,
    searchMedia,
    type InfoResponse,
    type OutputFormat,
    type SearchResult,
  } from '#lib/api/client.js';
  import { Button } from '#lib/components/ui/button/index.js';
  import * as Dialog from '#lib/components/ui/dialog/index.js';
  import { Input } from '#lib/components/ui/input/index.js';
  import * as Select from '#lib/components/ui/select/index.js';
  import * as Tabs from '#lib/components/ui/tabs/index.js';
  import { Textarea } from '#lib/components/ui/textarea/index.js';
  import { SOURCE_OPTIONS, type SourceId } from '#lib/sources.js';
  import Clipboard from '@lucide/svelte/icons/clipboard';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import Search from '@lucide/svelte/icons/search';
  import Settings from '@lucide/svelte/icons/settings';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  type ResultMode = 'text' | 'list';

  const DEFAULT_HOME_CONFIG = Object.freeze({ searchEnabled: true });
  const OUTPUT_FORMATS: { value: OutputFormat; label: string }[] = [
    { value: 'bbcode', label: 'BBCode' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'json', label: 'RAW JSON' },
  ];

  let query = $state('');
  let source = $state<SourceId>('douban');
  let apiKey = $state('');
  let apiKeyDraft = $state('');
  let apiKeyDialogOpen = $state(false);
  let searchEnabled = $state(true);
  let loading = $state(false);
  let queryError = $state('');
  let resultMode = $state<ResultMode>('text');
  let resultTitle = $state('生成结果');
  let resultStatus = $state('');
  let output = $state('');
  let results = $state<SearchResult[]>([]);
  let currentData = $state<InfoResponse | null>(null);
  let format = $state<OutputFormat>('bbcode');
  let outputElement: HTMLTextAreaElement | null = $state(null);

  let directInput = $derived(/^http/i.test(query.trim()));
  let sourceDisabled = $derived(!searchEnabled || directInput);
  let sourceLabel = $derived(
    SOURCE_OPTIONS.find((option) => option.value === source)?.label ?? source
  );

  function readHomeConfig(): { searchEnabled: boolean } {
    const configNode = document.getElementById('ptgen-home-config');
    if (!configNode) return DEFAULT_HOME_CONFIG;

    try {
      const parsed = JSON.parse(configNode.textContent ?? '{}') as Partial<
        typeof DEFAULT_HOME_CONFIG
      >;
      return { ...DEFAULT_HOME_CONFIG, ...parsed };
    } catch {
      return DEFAULT_HOME_CONFIG;
    }
  }

  function isOutputFormat(value: string | null): value is OutputFormat {
    return value === 'bbcode' || value === 'markdown' || value === 'json';
  }

  onMount(() => {
    searchEnabled = readHomeConfig().searchEnabled !== false;
    apiKey = localStorage.getItem('APIKEY') ?? '';
    const savedFormat = localStorage.getItem('info_format');
    if (isOutputFormat(savedFormat)) format = savedFormat;
  });

  function announce(message: string) {
    resultStatus = '';
    requestAnimationFrame(() => {
      resultStatus = message;
    });
  }

  function setFormat(nextFormat: OutputFormat) {
    format = nextFormat;
    localStorage.setItem('info_format', nextFormat);
    if (currentData?.formats) {
      output = currentData.formats[nextFormat] || currentData.format || '';
      announce(`已切换为 ${nextFormat.toUpperCase()} 格式`);
    }
  }

  function showError(message: string) {
    resultMode = 'text';
    output = `错误: ${message}`;
    announce(`发生错误：${message}`);
    toast.error(message);
  }

  async function runQuery(value = query.trim()) {
    queryError = '';
    if (!value) {
      queryError = '请输入链接或关键词';
      toast.error(queryError);
      announce(queryError);
      return;
    }

    const isDirect = /^http/i.test(value);
    if (!isDirect && !searchEnabled) {
      queryError = '当前部署已禁用关键词搜索，请输入资源链接';
      toast.error(queryError);
      announce(queryError);
      return;
    }

    loading = true;
    output = '';
    currentData = null;

    try {
      if (isDirect) {
        const data = await fetchMediaInfo(value, apiKey);
        currentData = data;
        resultMode = 'text';
        output = data.formats?.[format] || data.format || '';
        resultTitle = '生成结果';
        announce('已生成结果');
      } else {
        results = await searchMedia(value, source, apiKey);
        resultMode = 'list';
        resultTitle = `搜索结果 (${results.length})`;
        announce(`找到 ${results.length} 条搜索结果`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '网络请求失败';
      if (
        error instanceof ApiRequestError &&
        error.status === 403 &&
        message === 'apikey required.'
      ) {
        apiKeyDraft = apiKey;
        apiKeyDialogOpen = true;
        showError('需要 API Key');
      } else {
        showError(message);
      }
    } finally {
      loading = false;
    }
  }

  function submitQuery(event: SubmitEvent) {
    event.preventDefault();
    void runQuery();
  }

  function openApiKeyDialog() {
    apiKeyDraft = apiKey;
    apiKeyDialogOpen = true;
  }

  function saveApiKey() {
    apiKey = apiKeyDraft.trim();
    localStorage.setItem('APIKEY', apiKey);
    apiKeyDialogOpen = false;
    toast.success('API Key 已保存');
    announce('API Key 已保存');
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      outputElement?.select();
      document.execCommand('copy');
    }
    toast.success('已复制到剪贴板');
    announce('已复制到剪贴板');
  }

  function hasText(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }
</script>

<section class="surface" aria-labelledby="workbench-title">
  <h1 id="workbench-title" class="sr-only">资源信息生成工具</h1>

  <form class="mb-6 flex flex-wrap gap-2.5" onsubmit={submitQuery}>
    <label class="sr-only" for="source-select">选择数据源</label>
    <Select.Root type="single" bind:value={source} disabled={sourceDisabled}>
      <Select.Trigger
        id="source-select"
        class="focus-brand h-12 min-w-30 rounded-xl bg-muted px-4 py-0 text-base leading-6 shadow-none data-[size=default]:h-12"
        aria-label="选择数据源"
        title={!searchEnabled ? '当前部署已禁用关键词搜索' : undefined}
      >
        <span data-slot="select-value">{sourceLabel}</span>
      </Select.Trigger>
      <Select.Content>
        {#each SOURCE_OPTIONS as option}
          <Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>

    <div class="min-w-70 flex-1">
      <label class="sr-only" for="search-input">资源链接或关键词</label>
      <Input
        id="search-input"
        name="query"
        type="text"
        bind:value={query}
        autocomplete="off"
        spellcheck="false"
        inputmode="search"
        aria-describedby="query-error"
        aria-invalid={queryError ? 'true' : undefined}
        placeholder={searchEnabled
          ? '输入链接（https://…）或关键词（如：肖申克的救赎）'
          : '请输入资源链接（当前部署已禁用关键词搜索）'}
        class="focus-brand h-12 rounded-xl bg-muted px-4 text-base shadow-none"
        oninput={() => (queryError = '')}
      />
    </div>

    <Button
      type="submit"
      size="lg"
      class="h-12 rounded-xl px-6 text-base font-semibold"
      disabled={loading}
    >
      {#if loading}
        <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
        查询中…
      {:else}
        <Search class="size-4" aria-hidden="true" />
        查询
      {/if}
    </Button>

    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      class="size-12 rounded-xl bg-muted shadow-none"
      onclick={openApiKeyDialog}
      title="API Key 设置"
      aria-label="打开 API Key 设置"
    >
      <Settings class="size-4" aria-hidden="true" />
    </Button>
  </form>

  {#if queryError}
    <p id="query-error" class="-mt-3 mb-4 text-sm text-destructive" role="alert">{queryError}</p>
  {:else}
    <p id="query-error" class="sr-only"></p>
  {/if}

  <div aria-busy={loading} class:opacity-70={loading}>
    <div class="mb-4 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
      <div class="flex flex-wrap items-center gap-2.5">
        <h2 class="surface-title">{resultTitle}</h2>
        <Tabs.Root value={format} onValueChange={(value) => setFormat(value as OutputFormat)}>
          <Tabs.List class="h-auto rounded-full border bg-muted p-1">
            {#each OUTPUT_FORMATS as item}
              <Tabs.Trigger
                value={item.value}
                class="h-8 rounded-full px-4 text-[0.85rem] text-muted-foreground transition-colors hover:text-foreground data-active:bg-card data-active:text-primary data-active:shadow-sm data-active:ring-1 data-active:ring-border/80 data-active:hover:text-primary dark:data-active:bg-background dark:data-active:text-primary dark:data-active:ring-border"
              >
                {item.label}
              </Tabs.Trigger>
            {/each}
          </Tabs.List>
        </Tabs.Root>
      </div>

      {#if resultMode === 'text'}
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="bg-muted shadow-none"
          onclick={copyOutput}
          aria-label="复制当前结果"
        >
          <Clipboard aria-hidden="true" />
          复制
        </Button>
      {/if}
    </div>

    <p class="sr-only" aria-live="polite" aria-atomic="true">{resultStatus}</p>

    {#if resultMode === 'text'}
      <Textarea
        bind:ref={outputElement}
        bind:value={output}
        readonly
        aria-label="生成结果输出"
        placeholder="这里将显示生成的简介信息…"
        class="focus-brand min-h-75 resize-y rounded-xl bg-muted p-4 font-mono text-sm shadow-none"
      />
    {:else}
      <div class="grid gap-2.5" aria-live="polite">
        {#if results.length === 0}
          <p class="py-8 text-center text-muted-foreground">未找到相关结果</p>
        {:else}
          {#each results as item}
            <button
              type="button"
              class="focus-brand flex min-h-14 w-full items-center justify-between rounded-lg border bg-muted p-4 text-left transition-colors hover:border-primary"
              onclick={() => void runQuery(item.link)}
              aria-label={`选择 ${hasText(item.title) ? item.title.trim() : '未命名结果'}`}
            >
              <span class="min-w-0">
                <span class="block font-semibold">
                  {hasText(item.title) ? item.title.trim() : '未命名结果'}
                  {#if hasText(item.year)}
                    <span
                      class="ml-2 rounded bg-border px-2 py-0.5 text-xs font-normal text-muted-foreground"
                      >{item.year.trim()}</span
                    >
                  {/if}
                </span>
                {#if hasText(item.subtitle)}
                  <span class="mt-1 block text-sm text-muted-foreground"
                    >{item.subtitle.trim()}</span
                  >
                {/if}
              </span>
              {#if hasText(item.subtype)}
                <span class="ml-2 rounded bg-border px-2 py-0.5 text-xs text-muted-foreground"
                  >{item.subtype.trim()}</span
                >
              {/if}
            </button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</section>

<Dialog.Root bind:open={apiKeyDialogOpen}>
  <Dialog.Content class="rounded-xl p-8 sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>API 配置</Dialog.Title>
      <Dialog.Description>请输入您的 API Key 以继续使用。</Dialog.Description>
    </Dialog.Header>
    <label class="sr-only" for="api-key-input">API Key</label>
    <Input
      id="api-key-input"
      type="text"
      bind:value={apiKeyDraft}
      autocomplete="off"
      spellcheck="false"
      placeholder="输入 API Key"
      class="focus-brand h-12 rounded-xl bg-muted px-4 shadow-none"
      onkeydown={(event) => {
        if (event.key === 'Enter') saveApiKey();
      }}
    />
    <Dialog.Footer>
      <Dialog.Close>
        {#snippet child({ props })}
          <Button {...props} variant="outline">取消</Button>
        {/snippet}
      </Dialog.Close>
      <Button onclick={saveApiKey}>保存</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
