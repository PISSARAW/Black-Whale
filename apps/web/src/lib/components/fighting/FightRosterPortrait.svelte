<script lang="ts">
  import { onMount } from 'svelte'
  import { createFightState } from '$lib/fighting/fightState'
  import type { FighterId } from '$lib/fighting/types'
  import FighterAvatar from './FighterAvatar.svelte'
  export let id: FighterId
  let target: HTMLSpanElement
  let visible = false
  $: fighter = createFightState(id, id).player
  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      visible = true
      observer.disconnect()
    })
    observer.observe(target)
    return () => observer.disconnect()
  })
</script>

<span class="roster-portrait" bind:this={target} aria-hidden="true">
  {#if visible}<FighterAvatar {fighter} preview />{/if}
</span>

<style>
  .roster-portrait {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .roster-portrait :global(.fighter-model) {
    width: 110px;
    height: 165px;
    top: -8px;
  }
</style>
