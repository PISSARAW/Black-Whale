<script lang="ts">
  import FightCombatReference from '../../src/lib/components/fighting/FightCombatReference.svelte'
  import { fightReplayHash } from '../../src/lib/fighting/fightReplayHash'
  import type { FightState } from '../../src/lib/fighting/types'
  let language: 'fr' | 'en' = 'fr'
  let state: FightState | null = null
  export function translate(next: 'fr' | 'en') {
    language = next
  }
  export function snapshot() {
    if (!state) return null
    return {
      hash: fightReplayHash(state),
      fighter: state.player.id,
      opponent: state.opponent.id,
      environment: state.environment,
      dummy: state.training!.settings.dummy,
      resources: state.training!.settings.resources,
      frame: state.frame,
    }
  }
</script>

<main><FightCombatReference {language} onLaunch={(next) => (state = next)} /></main>

<style>
  main {
    max-width: 45rem;
    padding: 1rem;
    font: 16px/1.5 sans-serif;
  }
</style>
