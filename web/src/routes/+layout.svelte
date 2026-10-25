<script lang="ts">
  import './layout.css';
  import { Toaster } from '#lib/components/ui/sonner/index.js';
  import SiteHeader from '#lib/components/SiteHeader.svelte';
  import { ModeWatcher } from 'mode-watcher';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
</script>

<ModeWatcher modeStorageKey="theme" />

<a class="skip-link" href="#main-content">跳到主要内容</a>
<SiteHeader />

<main id="main-content" tabindex="-1">
  {@render children()}
</main>

<Toaster position="bottom-center" richColors />
