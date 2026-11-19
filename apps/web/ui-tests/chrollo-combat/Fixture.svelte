<script lang="ts">
  import { tick } from 'svelte'
  import FightLiveScene from '$lib/components/fighting/FightLiveScene.svelte'
  import FightHud from '$lib/components/fighting/FightHud.svelte'
  import {
    beginFight,
    createFight,
    performMove,
    performAuraAttack,
    tickFight,
  } from '$lib/fighting/engine'
  import { performArsenalAction } from '$lib/fighting/arsenalExecution'
  import { defaultFightComfort } from '$lib/fighting/fightComfort'
  import { EMPTY_INPUT, type FightState } from '$lib/fighting/types'

  type Mode = 'palm' | 'knife' | 'kick' | 'closed' | 'duel'
  const labels: Record<Mode, string> = {
    palm: 'Main libre · Livre protégé',
    knife: 'Couteau de Ben · Main gauche',
    kick: 'Coup de pied · Sans poison',
    closed: 'Livre fermé · Main droite',
    duel: 'Combat arcade',
  }
  let mode: Mode = 'palm'
  let state = fresh(mode, false)
  let generation = 0
  const comfort = defaultFightComfort()

  function frames(s: FightState, count: number): FightState {
    for (let i = 0; i < count; i++)
      s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    return s
  }
  function fresh(selected: Mode, left: boolean): FightState {
    const base = beginFight(
      createFight('phinks', 'chrollo', {
        mode: 'versus-ai',
        formatId: 'arcade',
        environment: { stageId: 'heavens-arena' },
      }),
    )
    const gap = selected === 'duel' ? 48 : 14
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
    if (['knife', 'closed', 'kick'].includes(selected))
      s = frames(
        performArsenalAction(
          { state: s, side: 'opponent', command: { action: 'weapon-ready' } },
          performAuraAttack,
        ),
        12,
      )
    if (selected === 'closed')
      s = frames(
        performMove({
          state: s,
          side: 'opponent',
          action: 'special',
          input: { ...EMPTY_INPUT, down: true },
        }),
        24,
      )
    if (selected !== 'duel')
      s = performMove({
        state: s,
        side: 'opponent',
        action: selected === 'kick' ? 'heavy' : 'light',
      })
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
      if (mode !== 'duel') {
        state = frames(state, 1)
        continue
      }
      if (state.frame > 200 && state.frame % 110 === 0)
        state = performMove({ state, side: 'player', action: 'heavy' })
      const direction = Math.sign(state.opponent.x - state.player.x)
      const chase = state.frame > 200 && Math.abs(state.player.x - state.opponent.x) > 10
      state = tickFight(
        state,
        { ...EMPTY_INPUT, left: chase && direction < 0, right: chase && direction > 0 },
        { dt: 1 / 60, ai: true },
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
    <span>CLASH / CHROLLO</span>
    <h1>{labels[mode]}</h1>
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
