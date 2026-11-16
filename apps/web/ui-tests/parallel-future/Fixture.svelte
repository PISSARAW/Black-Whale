<script lang="ts">
  import { onMount, tick } from 'svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import {
    beginFight,
    createFight,
    performAttack,
    performMove,
    tickFight,
  } from '$lib/fighting/engine'
  import { EMPTY_INPUT, type AttackKind, type FightState } from '$lib/fighting/types'

  let state = beginFight(
    createFight('tserriednich', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  let language: 'fr' | 'en' = 'fr'

  function advance(current: FightState, frames: number): FightState {
    for (let index = 0; index < frames; index++)
      current = tickFight(
        current,
        { ...EMPTY_INPUT, left: current.parallelFuture?.phase === 'diverging' },
        { dt: 1 / 60, opponentInput: EMPTY_INPUT },
      )
    return current
  }

  export async function showCase(
    phase: 'preparing' | 'vision' | 'diverging',
    locale: 'fr' | 'en' = 'fr',
  ) {
    language = locale
    state = beginFight(
      createFight('tserriednich', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
    )
    state = performAttack(state, 'opponent', 'ranged')
    state = performAttack(state, 'player', 'special')
    if (phase !== 'preparing') state = advance(state, 30)
    if (phase === 'diverging') state = advance(performAttack(state, 'player', 'special'), 50)
    await tick()
    return { phase: state.parallelFuture?.phase, frame: state.frame, x: state.player.x }
  }

  export function currentPhase() {
    return state.parallelFuture?.phase
  }
  function attack(kind: AttackKind) {
    state = performAttack(state, 'player', kind)
  }
  onMount(() => {
    Object.assign(window, { futureFixture: { showCase, currentPhase } })
  })
</script>

<main style="max-width: 1200px; margin: 0 auto; padding: 12px;">
  <FightStage
    {state}
    {language}
    onAttack={attack}
    onThrow={() => {}}
    onCall={() => {}}
    onFinisher={() => (state = performMove({ state, side: 'player', action: 'finisher' }))}
    onControl={() => {}}
    showControls={true}
  />
</main>
