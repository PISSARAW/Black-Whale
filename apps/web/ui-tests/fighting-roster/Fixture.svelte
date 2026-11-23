<script lang="ts">
  import FightCharacterSelection from '$lib/components/fighting/FightCharacterSelection.svelte'
  import FightTeamSelection from '$lib/components/fighting/FightTeamSelection.svelte'
  import FightCombatSchool from '$lib/components/fighting/FightCombatSchool.svelte'
  import { createCombatSchool } from '$lib/fighting/combatSchool'
  import { FIGHTING_ROSTER } from '$lib/fighting/roster'
  import { combatRoutesFor } from '$lib/fighting/combatRoutes'
  import type { FighterId } from '$lib/fighting/types'
  import { readFightAudioSettings, saveFightAudioSettings } from '$lib/fighting/audio/settings'
  let player: FighterId = 'kurapika'
  let opponent: FighterId = 'hisoka'
  let team: FighterId[] = ['kurapika', 'chrollo', 'hisoka']
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
  export function mutePicker(muted: boolean) {
    saveFightAudioSettings({ ...readFightAudioSettings(), muted })
  }
  export function roster() {
    return FIGHTING_ROSTER.map(({ id, name }) => ({ id, name, routes: combatRoutesFor(id).length }))
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
      onContinue={() => (screen = 'academy')}
    />
  {:else if screen === 'team'}
    <FightTeamSelection
      {language}
      roster={team}
      side="player"
      interactive={false}
      onChange={(roster) => (team = roster)}
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
