<script lang="ts">
  import { Button } from '#lib/components/ui/button/index.js';
  import * as Tooltip from '#lib/components/ui/tooltip/index.js';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import Moon from '@lucide/svelte/icons/moon';
  import Sun from '@lucide/svelte/icons/sun';
  import { mode, toggleMode } from 'mode-watcher';

  let isDark = $derived(mode.current === 'dark');
</script>

<header
  class="sticky top-0 z-50 flex min-h-18 items-center justify-between bg-card px-8 py-4 shadow-md transition-colors max-sm:px-5"
>
  <a
    href="/"
    class="flex items-center gap-2 text-xl font-bold text-foreground no-underline"
    aria-label="PT Gen 首页"
  >
    <BookOpen class="size-6" aria-hidden="true" />
    <span>PT <span class="text-primary">Gen</span></span>
  </a>

  <Tooltip.Provider>
    <div class="flex items-center gap-1">
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="icon-lg"
              href="https://github.com/ZeyrMe/pt-gen-universal"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="访问项目主页"
              class="rounded-full text-muted-foreground hover:text-primary"
            >
              <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path
                  d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z"
                />
              </svg>
            </Button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content side="bottom" sideOffset={6}>访问项目主页</Tooltip.Content>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="icon-lg"
              class="rounded-full text-muted-foreground hover:text-primary"
              onclick={toggleMode}
              aria-label={isDark ? '切换浅色模式' : '切换深色模式'}
              aria-pressed={isDark}
            >
              {#if isDark}
                <Sun class="size-5" aria-hidden="true" />
              {:else}
                <Moon class="size-5" aria-hidden="true" />
              {/if}
            </Button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content side="bottom" sideOffset={6}>切换模式</Tooltip.Content>
      </Tooltip.Root>
    </div>
  </Tooltip.Provider>
</header>
