<script lang="ts">
  import { tick } from 'svelte'
  import { cinematicDuel, cinematicCommand } from '$lib/fighting/cinematicFixtures'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import { performMove, tickFight } from '$lib/fighting/engine'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { recordFightInjuries } from '$lib/fighting/feitanPain'
  import { toggleEmperorTime } from '$lib/fighting/kurapikaActions'
  import { observeFraming } from '../../demos/fighting-camera-showcase/framing'
  import { EMPTY_INPUT, type FighterId, type FightSide } from '$lib/fighting/types'

  let state = fresh('kurapika', 'player')
  let selectedSide: FightSide = 'player'
  let comfort = defaultFightComfort()
  let language: 'fr' | 'en' = 'fr'
  let generation = 0
  let solarStates: (typeof state)[] = []
  let solarIndex = 0
  const framing = observeFraming(() => ({ state, frame: state.frame, chapter: generation }))
  export function diagnostics() {
    return framing()
  }
  export async function solar(moment: 'ko' | 'vision' | 'diverging' = 'ko') {
    const { createSolarShowcase } = await import('../../demos/fighting-showcase/solarChoreography')
    const film = createSolarShowcase()
    solarStates = film.states
    const index = film.states.findIndex((s) =>
      moment === 'ko'
        ? s.parallelFuture?.phase === 'diverging' &&
          s.parallelFuture.frames[Math.max(0, s.parallelFuture.cursor - 1)].opponent.health === 0
        : s.parallelFuture?.phase === moment,
    )
    if (index < 0) throw new Error('Solar forecast does not contain the predicted knockout')
    state = film.states[index]
    solarIndex = index
    selectedSide = 'opponent'
    generation++
    await tick()
  }
  export async function solarAdvance(count: number) {
    solarIndex = Math.min(solarStates.length - 1, solarIndex + count)
    state = solarStates[solarIndex]
    await tick()
  }
  export function solarStatus() {
    return { health: state.opponent.health, cursor: state.parallelFuture?.cursor }
  }
  function fresh(id: FighterId, side: FightSide) {
    return cinematicDuel(id, side)
  }
  export async function reset(id: FighterId, side: FightSide = 'player') {
    generation++
    selectedSide = side
    state = fresh(id, side)
    comfort = defaultFightComfort()
    await tick()
  }
  export async function awaken(
    kind: 'emperor' | 'biscuit' | 'armour' | 'sun',
    side: FightSide = 'player',
  ) {
    if (kind === 'emperor') state = toggleEmperorTime(state, side)
    else {
      if (kind === 'armour')
        state = recordFightInjuries(state, {
          ...state,
          [side]: { ...state[side], health: state[side].health - 40 },
        })
      state = performMove({ state, side, action: kind === 'sun' ? 'finisher' : 'special' })
    }
    await tick()
  }
  export async function advance(count: number) {
    for (let i = 0; i < count; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    await tick()
  }
  export async function act() {
    state = cinematicCommand(state, selectedSide)
    await tick()
  }
  export async function cast() {
    state = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, right: true },
    })
    await tick()
  }
  export async function settings(stable: boolean, locale: 'fr' | 'en' = 'fr') {
    comfort = { ...comfort, camera: stable ? 0 : 1 }
    language = locale
    await tick()
  }
  export function snapshot() {
    return state
  }
</script>

<div class="arena">
  {#key generation}
    <FightLiveScene
      {state}
      {comfort}
      {language}
      stageId={state.environment.stageId}
      viewer={selectedSide}
    />
  {/key}
  <FightHud {state} {language} />
</div>

<style>
  :global(body) {
    margin: 0;
    background: #080b12;
    color: #e8f5fc;
  }
  .arena {
    position: relative;
    height: min(80vh, 720px);
    min-height: 420px;
    overflow: hidden;
  }
</style>
