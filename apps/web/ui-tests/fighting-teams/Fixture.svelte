<script lang="ts">
  import { tick } from 'svelte'
  import FightTeams from '$lib/components/fighting/FightTeams.svelte'
  import FightTeamBattle from '$lib/components/fighting/FightTeamBattle.svelte'
  import { createTeamFight } from '$lib/fighting/teamMatch'
  let language: 'fr' | 'en' = 'fr'
  let view: 'selection' | 'battle' = 'selection'
  let state = scenario()
  let battle: FightTeamBattle | undefined
  function scenario() {
    return createTeamFight(
      { player: ['hisoka', 'kurapika', 'theta'], opponent: ['theta', 'chrollo', 'franklin'] },
      { arenaInteractions: true },
    )
  }
  function start() {
    state = scenario()
    view = 'battle'
  }
  export async function advance(count: number) {
    for (let i = 0; i < count; i++) battle?.advance(1 / 60)
    await tick()
  }
  export async function english() {
    language = 'en'
    await tick()
  }
  export function snapshot() {
    return {
      frame: state.frame,
      phase: state.phase,
      winner: state.winner,
      player: {
        id: state.player.id,
        x: state.player.x,
        health: state.player.health,
        aura: state.player.aura,
      },
      opponent: { id: state.opponent.id, x: state.opponent.x },
      team: state.teamMatch,
      entities: state.battlefield?.entities,
    }
  }
</script>

<main>
  <nav>
    <button type="button" onclick={() => (view = 'selection')}
      >{language === 'fr' ? 'Sélection' : 'Selection'}</button
    ><button type="button" onclick={start}
      >{language === 'fr' ? 'Essai de combat' : 'Battle fixture'}</button
    >
  </nav>
  {#if view === 'selection'}<FightTeams {language} />{:else}<FightTeamBattle
      bind:this={battle}
      bind:state
      {language}
      animate={false}
      victoryEnabled={false}
      onExit={() => (view = 'selection')}
    />{/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #0b1925;
    color: #edf4f8;
  }
  main {
    max-width: 1200px;
    margin: auto;
    padding: 1rem;
    box-sizing: border-box;
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  nav button {
    min-height: 44px;
    padding: 0.5rem;
    color: inherit;
    background: #22394a;
    border: 1px solid #6e869e;
  }
</style>
