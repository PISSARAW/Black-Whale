<script lang="ts">
  import FighterAvatar from './FighterAvatar.svelte'
  import { createFightState } from '$lib/fighting/fightState'
  import { fighterDefinition } from '$lib/fighting/roster'
  import type { FighterId } from '$lib/fighting/types'
  export let id: FighterId
  export let reverse = false
  $: fighter = createFightState(id, id).player
  $: definition = fighterDefinition(id)
</script>

<div class="clash-portrait" class:reverse style={`--portrait-accent:${definition.accent}`}>
  <span class="portrait-ring" aria-hidden="true"></span>
  {#key id}<FighterAvatar {fighter} preview />{/key}
</div>

<style>
  .clash-portrait {
    position: relative;
    display: grid;
    place-items: center;
    height: 100%;
    min-height: 220px;
    isolation: isolate;
  }
  .portrait-ring {
    position: absolute;
    width: 80%;
    aspect-ratio: 1;
    border: 1px solid color-mix(in srgb, var(--portrait-accent) 35%, transparent);
    border-radius: 50%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--portrait-accent) 20%, transparent),
      transparent 68%
    );
    box-shadow: 0 0 0 22px color-mix(in srgb, var(--portrait-accent) 4%, transparent);
  }
  .clash-portrait :global(.fighter-model) {
    position: relative;
    left: auto;
    width: 100%;
    height: 100%;
    min-height: 220px;
    transform: scale(1.16);
  }
  .reverse :global(.fighter-model) {
    transform: scale(-1.16, 1.16);
  }
  @media (prefers-reduced-motion: reduce) {
    .clash-portrait {
      contain: layout;
    }
  }
</style>
