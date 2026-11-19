<script lang="ts">
  import FightArenaMap from './FightArenaMap.svelte'
  import { fighterDefinition } from '$lib/fighting/roster'
  import { DOWSING_MAP_FRAMES } from '$lib/fighting/dowsingMapTypes'
  import type { FightSide, FightState } from '$lib/fighting/types'
  export let state: FightState
  export let side: FightSide
  export let language: 'fr' | 'en'
  $: search = state[side].dowsingMapSearch
  $: reading = state[side].dowsingMapReading
</script>

{#if search?.phase === 'searching'}
  <div role="status">
    <span>Dowsing · {language === 'fr' ? 'Recherche sur le plan' : 'Searching the map'}</span>
    <progress
      max={DOWSING_MAP_FRAMES}
      value={DOWSING_MAP_FRAMES - search.remainingFrames}
      aria-label={language === 'fr' ? 'Concentration sur le plan' : 'Map concentration'}
    ></progress>
  </div>
{/if}
{#if reading}
  <div role="status">
    <span
      >Dowsing · {language === 'fr' ? 'Dernière localisation' : 'Last location'} · {fighterDefinition(
        reading.appearance,
      ).name} ·
      {language === 'fr' ? 'manche' : 'round'}
      {reading.round} · {Math.floor(reading.frame / 60)} s</span
    >
    <FightArenaMap map={reading.map} point={reading.point} {language} />
    {#if !reading.point}<small
        >{language === 'fr'
          ? 'Aucune position dans la zone représentée par ce plan.'
          : 'No position in the area represented by this map.'}</small
      >{/if}
  </div>
{/if}

<style>
  div {
    display: grid;
    gap: 0.35rem;
    min-width: 0;
  }
  span,
  small {
    overflow-wrap: anywhere;
  }
  progress {
    width: 100%;
    height: 0.4rem;
    accent-color: #d7c075;
  }
</style>
