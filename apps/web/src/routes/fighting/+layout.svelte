<script lang="ts">
  import { onMount } from 'svelte'
  import { routePath } from '$lib/i18n'
  import FightMenuMusic from '$lib/components/fighting/FightMenuMusic.svelte'
  import { suppressVoyageTheme } from '$lib/audio/ambient/theme'
  import FightingGame from './FightingGame.svelte'

  onMount(suppressVoyageTheme)
</script>

{#if $routePath === '/fighting'}<FightMenuMusic />{/if}

{#if /^\/fighting\/(pvp|profile|tournament|teams)(\/|$)/.test($routePath)}
  <slot />
{:else}
  <FightingGame />
  <slot />
{/if}
