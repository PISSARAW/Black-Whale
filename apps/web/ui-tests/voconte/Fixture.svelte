<script lang="ts">
  import { onMount, tick } from 'svelte'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import { beginFight, createFight, performAttack, tickFight } from '$lib/fighting/engine'
  import { EMPTY_INPUT, type AttackKind, type FightState } from '$lib/fighting/types'
  let state = fresh()
  let language: 'fr' | 'en' = 'fr'
  function fresh(): FightState {
    const base = beginFight(
      createFight('voconte', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
    )
    return { ...base, player: { ...base.player, aura: 100 }, opponent: { ...base.opponent, x: 82 } }
  }
  function advance(current: FightState, frames: number): FightState {
    for (let i = 0; i < frames; i++)
      current = tickFight(current, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    return current
  }
  async function showCase(
    phase: 'inactive' | 'setup' | 'active' | 'transit',
    locale: 'fr' | 'en' = 'fr',
  ) {
    language = locale
    state = fresh()
    if (phase !== 'inactive')
      state = advance(performAttack(state, 'player', 'special'), phase === 'setup' ? 9 : 31)
    if (phase === 'transit') await cross()
    await tick()
    return current()
  }
  async function cross() {
    state = { ...state, player: { ...state.player, x: 29.95 } }
    state = tickFight(
      state,
      { ...EMPTY_INPUT, right: true },
      { dt: 1 / 60, opponentInput: EMPTY_INPUT },
    )
    await tick()
    return current()
  }
  function current() {
    return {
      x: state.player.x,
      active: state.voconteDoors?.networks.player?.active,
      pending: state.voconteDoors?.networks.player?.pending,
      aura: state.player.aura,
    }
  }
  function attack(kind: AttackKind) {
    state = performAttack(state, 'player', kind)
  }
  onMount(() => {
    Object.assign(window, { voconteFixture: { showCase, current, cross } })
  })
</script>

<main style="max-width: 1200px; margin: 0 auto; padding: 12px;">
  <FightStage
    {state}
    {language}
    onAttack={attack}
    onThrow={() => {}}
    onCall={() => {}}
    onFinisher={() => {}}
    onControl={() => {}}
    showControls={true}
  />
</main>
