<script lang="ts">
  import { onMount, type Snippet } from 'svelte'
  import { page } from '$app/stores'
  import { routePath } from '$lib/i18n'
  import ArenaMainMenu from './ArenaMainMenu.svelte'

  let { children }: { children: Snippet } = $props()
  let mounted = $state(false)

  onMount(() => {
    mounted = true
  })
</script>

{#if $routePath === '/arena' && !$page.data.openMatch && !(mounted && $page.url.hash.startsWith('#replay='))}
  <ArenaMainMenu />
{:else}
  {@render children()}
{/if}
