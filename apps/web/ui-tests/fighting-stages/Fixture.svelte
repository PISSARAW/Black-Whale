<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import StagePicker from '$lib/components/fighting/StagePicker.svelte'
  import { createFightState } from '$lib/fighting/fightState'
  import { createFightEnvironment, type FightEnvironment } from '$lib/fighting/fightEnvironment'
  import { FIGHT_STAGES, type FightStageId } from '$lib/fighting/stages'

  let environment = createFightEnvironment({ stageId: 'royal-salon' })
  let state = fresh()
  let language: 'fr' | 'en' = 'fr'
  function fresh() {
    return {
      ...createFightState('kurapika', 'hisoka', { environment, mode: 'versus-local' }),
      phase: 'fighting' as const,
    }
  }
  function choose(next: FightEnvironment) {
    environment = next
    state = fresh()
  }
  export function stages() {
    return FIGHT_STAGES
  }
  export async function showStage(id: FightStageId, view = 'normal') {
    environment = createFightEnvironment({ stageId: id })
    const biscuit = view === 'biscuit'
    const base = createFightState(
      biscuit ? 'biscuit' : 'kurapika',
      biscuit ? 'biscuit' : 'hisoka',
      {
        environment,
        mode: 'versus-local',
      },
    )
    state = {
      ...base,
      phase: 'fighting',
      previousPositions: undefined,
      player: { ...base.player, x: view === 'edges' ? 0 : 25, biscuitTrueForm: biscuit },
      opponent: { ...base.opponent, x: view === 'edges' ? 100 : 75, biscuitTrueForm: biscuit },
    }
    await tick()
  }
  export async function setLanguage(next: 'fr' | 'en') {
    language = next
    await tick()
  }
</script>

<main>
  <h1>{FIGHT_STAGES.find((stage) => stage.id === environment.stageId)?.nameFr}</h1>
  <div class="fight-arena">
    <FightHud {state} {language} detailed={false} />
    {#key `${environment.stageId}:${state.player.id}:${state.opponent.id}`}
      <FightScene {state} stageId={environment.stageId} {language} />
    {/key}
  </div>
  <StagePicker {environment} {language} onSelect={choose} />
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080f15;
  }
  main {
    padding: 12px;
    max-width: 1200px;
    margin: auto;
  }
  h1 {
    color: #e6edf1;
    font-size: 1rem;
    margin: 0 0 12px;
  }
  .fight-arena {
    position: relative;
    overflow: hidden;
    min-height: 360px;
    height: min(68vh, 720px);
  }
  @media (max-width: 700px) {
    .fight-arena {
      height: 56vh;
    }
  }
</style>
