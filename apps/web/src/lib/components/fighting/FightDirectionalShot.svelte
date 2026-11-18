<script lang="ts">
  import { directionalComboShot } from '$lib/fighting/directionalComboCamera'
  import type { FightState } from '$lib/fighting/types'
  export let state: FightState
  export let intensity: number
  $: shot = intensity > 0 ? directionalComboShot(state) : undefined
</script>

{#if shot}
  <div
    class="directional-shot"
    data-ending={shot.ending}
    style:opacity={shot.weight * intensity}
  ></div>
{/if}

<style>
  .directional-shot {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at 50% 49%, transparent 34%, #1c0e25aa);
  }
  .directional-shot[data-ending='ground'] {
    background: radial-gradient(ellipse at 50% 65%, transparent 34%, #2b180eb0);
  }
  .directional-shot[data-ending='air'] {
    background: radial-gradient(ellipse at 50% 35%, transparent 39%, #101932a8);
  }
  @media (prefers-reduced-motion: reduce) {
    .directional-shot {
      display: none;
    }
  }
</style>
