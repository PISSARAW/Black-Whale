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
  import { CYCLOTRON_ROTATION_FRAMES } from '$lib/fighting/phinksCyclotron'
  import { EMPTY_INPUT, type AttackKind, type FightState } from '$lib/fighting/types'

  let state = fresh()
  let language: 'fr' | 'en' = 'fr'
  function fresh(): FightState {
    const base = beginFight(
      createFight('phinks', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
    )
    return {
      ...base,
      player: { ...base.player, x: 42, aura: 100 },
      opponent: { ...base.opponent, x: 70 },
    }
  }
  function advance(current: FightState, frames: number): FightState {
    for (let i = 0; i < frames; i++)
      current = tickFight(current, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    return current
  }
  async function showCase(
    phase: 'quarter' | 'half' | 'charged' | 'punch',
    locale: 'fr' | 'en' = 'fr',
  ) {
    language = locale
    state = performAttack(fresh(), 'player', 'special')
    const frames = {
      quarter: 9,
      half: 18,
      charged: CYCLOTRON_ROTATION_FRAMES * 15,
      punch: CYCLOTRON_ROTATION_FRAMES * 3,
    }
    state = advance(state, frames[phase])
    if (phase === 'punch')
      state = advance(performMove({ state, side: 'player', action: 'finisher' }), 14)
    await tick()
    return current()
  }
  function current() {
    return {
      turns: state.player.hatsuEffects.cyclotronTurns,
      frame: state.player.cyclotronWindup?.frame,
      punch: state.player.attack?.cyclotronTurns,
    }
  }
  function attack(kind: AttackKind) {
    state = performAttack(state, 'player', kind)
  }
  onMount(() => {
    Object.assign(window, { phinksFixture: { showCase, current } })
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
