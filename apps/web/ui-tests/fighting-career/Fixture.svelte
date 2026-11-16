<script lang="ts">
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import FightCareer from '$lib/components/fighting/FightCareer.svelte'
  import FightSeason from '$lib/components/fighting/FightSeason.svelte'
  import FightTournament from '$lib/components/fighting/FightTournament.svelte'
  import FightCeremony from '$lib/components/fighting/FightCeremony.svelte'
  import FightSpectator from '$lib/components/fighting/FightSpectator.svelte'
  import { clashCareer } from '$lib/fighting/career/profile'
  import { createCareerTracker } from '$lib/fighting/career/runtime'
  import { createFightMatchRuntime } from '$lib/fighting/fightMatchRuntime'
  import { beginFight, createFight } from '$lib/fighting/engine'
  import { fightReplayHash } from '$lib/fighting/fightReplayHash'
  import { EMPTY_INPUT } from '$lib/fighting/types'
  let language: 'fr' | 'en' = 'fr',
    watch: { token: string; endpoint: string } | null = null
  let state = createFight('hisoka', 'theta', { mode: 'versus-local', formatId: 'knockout' })
  function finish() {
    const runtime = createFightMatchRuntime(undefined, {
      record: false,
      career: createCareerTracker(clashCareer.record),
    })
    state = beginFight(state)
    state = {
      ...state,
      phase: 'fighting',
      matchWinner: null,
      winner: null,
      roundsWon: { player: 1, opponent: 0 },
      player: { ...state.player, x: 44, attack: null },
      opponent: { ...state.opponent, x: 50, health: 1 },
    }
    runtime.begin(state)
    runtime.enqueue(state, { kind: 'move', side: 'player', action: 'heavy', input: 0 })
    for (let frame = 0; frame < 50; frame++)
      state = runtime.advance(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  }
  async function showWatch() {
    watch = await fetch('/__watch', { method: 'POST' }).then((response) => response.json())
  }
  onMount(() => {
    Object.assign(window, {
      careerFixture: {
        hash: () => fightReplayHash(state),
        snapshot: () => ({
          phase: state.phase,
          winner: state.matchWinner,
          health: state.opponent.health,
          history: get(clashCareer).history.length,
          totals: get(clashCareer).totals,
        }),
        english: () => (language = 'en'),
      },
    })
  })
</script>

<main>
  <h1>Clash · Phase 8</h1>
  <button type="button" onclick={finish}>Terminer un duel</button><button
    type="button"
    onclick={showWatch}>Ouvrir le spectateur</button
  >
  <FightCeremony {state} {language} /><FightCareer {language} /><FightSeason
    {language}
    endpoint="/__career"
  /><FightTournament {language} />
  {#if watch}<FightSpectator {language} token={watch.token} endpoint={watch.endpoint} />{/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #07111a;
    color: #e3edf4;
    font-family: monospace;
  }
  main {
    max-width: 1150px;
    margin: auto;
    padding: 12px;
  }
  button {
    min-height: 44px;
    margin: 0.5rem;
    padding: 0.6rem;
    background: #203a4e;
    color: white;
    border: 1px solid #91a6b6;
  }
</style>
