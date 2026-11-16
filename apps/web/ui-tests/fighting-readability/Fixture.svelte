<script lang="ts">
  import { tick } from 'svelte'
  import FightDisplaySettings from '$lib/components/fighting/FightDisplaySettings.svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { beginFight, createFight, tickFight } from '$lib/fighting/engine'
  import { performTrainingAction } from '$lib/fighting/trainingAction'
  import { FIXED_STEP } from '$lib/fighting/fightClock'
  import { EMPTY_INPUT, type AttackKind, type FightInput } from '$lib/fighting/types'
  import type { TrainingAction } from '$lib/fighting/trainingTypes'
  let state = beginFight(createFight('melody', 'hisoka', { mode: 'training' }))
  state.player = { ...state.player, aura: 100, equipment: [] }
  let input: FightInput = { ...EMPTY_INPUT }
  let comfort = defaultFightComfort()
  let language: 'fr' | 'en' = 'fr'
  export async function attack(action: TrainingAction) {
    state = performTrainingAction({ state, side: 'player', action, input })
    await tick()
  }
  export async function advance(count: number) {
    for (let i = 0; i < count; i++)
      state = tickFight(state, input, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT, ai: false })
    await tick()
  }
  export function snapshot() {
    return { state, input, comfort }
  }
  export async function english() {
    language = 'en'
    await tick()
  }
  const useAttack = (kind: AttackKind) => {
    void attack(kind)
  }
</script>

<main>
  <FightDisplaySettings
    {language}
    formatId={state.formatId}
    target={undefined}
    onPause={() => {}}
    bind:comfort
  />
  <FightStage
    {state}
    {language}
    {comfort}
    showControls={true}
    onAttack={useAttack}
    onThrow={() => attack('throw')}
    onFinisher={() => attack('finisher')}
    onCall={() => {}}
    onControl={(key, active) => {
      input = { ...input, [key]: active }
    }}
  />
</main>

<style>
  :global(body) {
    margin: 0;
    background: #050c12;
    color: #dce5ea;
  }
  main {
    max-width: 1100px;
    margin: auto;
    padding: 0.5rem;
  }
</style>
