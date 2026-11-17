<script lang="ts">
  import { routePath } from '$lib/i18n'
  import FightingGame from './FightingGame.svelte'
</script>

{#if /^\/fighting\/(pvp|profile|tournament|teams)(\/|$)/.test($routePath)}
  <slot />
{:else}
  <FightingGame />
  <slot />
{/if}
