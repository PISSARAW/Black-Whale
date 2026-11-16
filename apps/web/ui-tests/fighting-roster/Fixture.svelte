<script lang="ts">
  import FightCharacterSelection from '$lib/components/fighting/FightCharacterSelection.svelte'
  import FightCombatSchool from '$lib/components/fighting/FightCombatSchool.svelte'
  import { createCombatSchool } from '$lib/fighting/combatSchool'
  import { FIGHTING_ROSTER } from '$lib/fighting/roster'
  import type { FighterId } from '$lib/fighting/types'
  let player: FighterId = 'kurapika'
  let opponent: FighterId = 'hisoka'
  let screen = 'selection'
  let language: 'fr' | 'en' = 'fr'
  const school = createCombatSchool()
  export function select(id: FighterId) {
    player = id
  }
  export function show(next: string) {
    screen = next
  }
  export function translate(next: 'fr' | 'en') {
    language = next
  }
  export function roster() {
    return FIGHTING_ROSTER.map(({ id, name }) => ({ id, name }))
  }
</script>

<main>
  {#if screen === 'selection'}
    <FightCharacterSelection
      {language}
      {player}
      {opponent}
      onPlayer={(id) => (player = id)}
      onOpponent={(id) => (opponent = id)}
      onContinue={() => {}}
    />
  {:else}
    <FightCombatSchool {language} {school} expanded onLaunch={() => {}} onExit={() => {}} />
  {/if}
</main>

<style>
  main {
    max-width: 1400px;
    margin: auto;
    padding: 2rem;
  }
  @media (max-width: 600px) {
    main {
      padding: 0.75rem;
    }
  }
</style>
