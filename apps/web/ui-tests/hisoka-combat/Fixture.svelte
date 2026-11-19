<script lang="ts">
  import { tick } from 'svelte'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import {
    beginFight,
    createFight,
    performAttack,
    performMove,
    tickFight,
  } from '$lib/fighting/engine'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FightState } from '$lib/fighting/types'

  type Mode = 'card' | 'retreat' | 'duel'
  let mode: Mode = 'card'
  let state = fresh(mode, false)
  let generation = 0
  const comfort = defaultFightComfort()

  function fresh(selected: Mode, left: boolean): FightState {
    const base = beginFight(
      createFight('phinks', 'hisoka', {
        mode: 'versus-ai',
        formatId: 'arcade',
        environment: { stageId: 'heavens-arena' },
      }),
    )
    const gap = selected === 'retreat' ? 11 : 48
    const x = left ? 28 : 72
    let s = {
      ...base,
      player: {
        ...base.player,
        x: x + (left ? gap : -gap),
        facing: (left ? -1 : 1) as 1 | -1,
        aura: 100,
      },
      opponent: { ...base.opponent, x, facing: (left ? 1 : -1) as 1 | -1, aura: 100 },
    }
    if (selected === 'card') s = performAttack(s, 'opponent', 'ranged')
    if (selected === 'retreat') s = performMove({ state: s, side: 'player', action: 'heavy' })
    return s
  }

  export async function reset(selected: Mode, left = false) {
    mode = selected
    state = fresh(selected, left)
    generation++
    await tick()
  }

  export async function advance(count: number) {
    for (let i = 0; i < count; i++) {
      if (mode === 'duel' && state.frame > 200 && state.frame % 90 === 0)
        state = performMove({ state, side: 'player', action: 'heavy' })
      const direction = Math.sign(state.opponent.x - state.player.x)
      const chase =
        mode === 'duel' && state.frame > 200 && Math.abs(state.player.x - state.opponent.x) > 12
      state = tickFight(
        state,
        {
          ...EMPTY_INPUT,
          left: chase && direction < 0,
          right: chase && direction > 0,
        },
        {
          dt: 1 / 60,
          ai: mode !== 'card',
          ...(mode === 'card' ? { opponentInput: EMPTY_INPUT } : {}),
        },
      )
    }
    await tick()
  }

  export function snapshot() {
    return state
  }
</script>

<main>
  <header>
    <span>CLASH / HISOKA</span>
    <h1>
      {mode === 'card'
        ? 'Lancer de carte'
        : mode === 'retreat'
          ? 'Retrait et contre'
          : 'Combat arcade'}
    </h1>
  </header>
  <div class="arena">
    {#key generation}<FightLiveScene
        {state}
        {comfort}
        stageId="heavens-arena"
        viewer="player"
      />{/key}
    <FightHud {state} language="fr" />
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #090c12;
    color: #eee9df;
    font-family: system-ui;
  }
  main {
    max-width: 1440px;
    margin: auto;
  }
  header {
    padding: 18px 24px;
  }
  header span {
    color: #d1b777;
    font-size: 11px;
    letter-spacing: 0.18em;
  }
  h1 {
    font-size: 22px;
    margin: 4px 0;
  }
  .arena {
    position: relative;
    height: min(75vh, 720px);
    min-height: 360px;
    overflow: hidden;
  }
</style>
