<script lang="ts">
  import { onMount, tick } from 'svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import FightMatchOverlays from '$lib/components/fighting/FightMatchOverlays.svelte'
  import { applyReplayCommand } from '$lib/fighting/fightReplayCommands'
  import type { PerceivedResultAction } from '$lib/fighting/futurePerceptionResults'
  import {
    beginFight,
    createFight,
    performAttack,
    performMove,
    tickFight,
  } from '$lib/fighting/engine'
  import { beginFutureDivergence } from '$lib/fighting/parallelFutureAbility'
  import { futureVisibleState } from '$lib/fighting/parallelFuturePresentation'
  import { EMPTY_INPUT, type AttackKind, type FightState } from '$lib/fighting/types'

  let state = beginFight(
    createFight('tserriednich', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  let language: 'fr' | 'en' = 'fr'
  let victoryActive = false
  $: visibleState = futureVisibleState(state, 'player')

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
  export async function showArcadeCase(
    phase: 'preparing' | 'vision' | 'hit' | 'revealed' | 'victory' | 'victory-revealed',
  ) {
    language = 'fr'
    state = beginFight(
      createFight('theta', 'tserriednich', { mode: 'versus-ai', formatId: 'knockout' }),
    )
    if (phase.startsWith('victory'))
      state = { ...state, opponent: { ...state.opponent, health: 1 } }
    state = performAttack(state, 'opponent', 'special')
    if (phase !== 'preparing') state = advance(state, 30)
    if (phase === 'hit' || phase === 'revealed' || phase.startsWith('victory')) {
      state = beginFutureDivergence(state, 'opponent')
      state = { ...state, opponent: { ...state.opponent, x: 10 } }
      state = advance(performAttack(state, 'player', 'ranged'), 160)
      if (phase === 'revealed' || phase === 'victory-revealed')
        state = advance(state, 600 - state.parallelFuture!.cursor)
    }
    await tick()
    return inspect()
  }
  function inspect() {
    const visible = futureVisibleState(state, 'player')
    return {
      realHealth: state.opponent.health,
      visibleHealth: visible.opponent.health,
      realX: state.opponent.x,
      visibleX: visible.opponent.x,
      phase: state.phase,
      winner: state.winner,
      visibleWinner: visible.winner,
      realRound: state.roundNumber,
      visibleRound: visible.roundNumber,
      realWins: state.roundsWon.player,
      visibleWins: visible.roundsWon.player,
    }
  }
  function resultAction(action: PerceivedResultAction) {
    state = applyReplayCommand(state, { kind: 'perceived-result', action })
  }
  async function reveal() {
    state = advance(state, 600 - state.parallelFuture!.cursor)
    await tick()
    return inspect()
  }
  function attack(kind: AttackKind) {
    state = performAttack(state, 'player', kind)
  }
  onMount(() => {
    Object.assign(window, {
      futureFixture: { showCase, showArcadeCase, currentPhase, inspect, reveal },
    })
  })
</script>

<main style="max-width: 1200px; margin: 0 auto; padding: 12px;">
  <div style="position: relative;">
    <FightStage
      {state}
      {language}
      onAttack={attack}
      onThrow={() => {}}
      onCall={() => {}}
      onFinisher={() => (state = performMove({ state, side: 'player', action: 'finisher' }))}
      onControl={() => {}}
      showControls={true}
      minimal={state.mode === 'versus-ai'}
      bind:victoryActive
    />
    {#if !victoryActive}<FightMatchOverlays
        state={visibleState}
        {language}
        startFight={() => {}}
        rematch={() => resultAction('rematch')}
        continueMatch={() => resultAction('continue')}
        chooseAgain={() => {}}
        quitFight={() => {}}
      />{/if}
  </div>
</main>
