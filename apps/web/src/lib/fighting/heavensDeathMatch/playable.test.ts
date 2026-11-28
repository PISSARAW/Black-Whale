import { expect, it } from 'vitest'
import { beginFight, createFight, performMove, tickFight } from '../engine'
import { FIXED_STEP } from '../fightClock'
import { createFightEnvironment } from '../fightEnvironment'
import { EMPTY_INPUT, type FightState } from '../types'
import { DEATH_MATCH_BEATS } from './acts'
import { frontierBeat } from './chrolloPlan/phases'
import { REFEREE_ID } from './chrolloPlan/world'
import { decideHisokaInHall } from './hisokaPlan/hallTactics'
import { replayDeathMatch, scriptBefore } from './script'
import { historicalEnvironment } from './historicalSetup'
import { DEATH_MATCH_FORMAT } from './loadout'

function playableFight() {
  const environment = historicalEnvironment(createFightEnvironment(), { playMode: 'semi-free' })
  return beginFight(
    createFight('hisoka', 'chrollo', {
      mode: 'versus-ai',
      formatId: DEATH_MATCH_FORMAT,
      environment,
    }),
  )
}

function tick(state: FightState, context = false) {
  return tickFight(state, { ...EMPTY_INPUT, context }, { dt: FIXED_STEP, ai: true })
}

it('only acts on the referee when the player holds Context and can act', () => {
  let state = playableFight()
  for (
    let frame = 0;
    frame < 240 && frontierBeat(state.deathMatch!.scenario) !== 'hisoka-gum-to-referee';
    frame += 1
  )
    state = tick(state)
  const world = state.deathMatch!
  expect(frontierBeat(world.scenario)).toBe('hisoka-gum-to-referee')
  const spectators = world.crowd.spectators.map((body) =>
    body.id === REFEREE_ID ? { ...body, at: world.hisoka.at } : body,
  )
  const placed = { ...state, deathMatch: { ...world, crowd: { ...world.crowd, spectators } } }
  const stunned = { ...placed, player: { ...placed.player, hitStun: 15 } }
  const blocked = { ...placed, player: { ...placed.player, blockStun: 15 } }
  expect(tick(stunned).deathMatch!.hisoka.gumAnchors).toEqual([])
  expect(tick(blocked).deathMatch!.hisoka.gumAnchors).toEqual([])
  expect(tick(stunned, true).deathMatch!.hisoka.gumAnchors).toEqual([])
  expect(tick(placed, true).deathMatch!.hisoka.gumAnchors).toContain(REFEREE_ID)
})

it('closes the gap to a distant decoy before catching it', () => {
  const world = playableFight().deathMatch!
  const at = { ...world.hisoka.at, z: world.hisoka.at.z - 9 }
  const decoy = {
    ...world.crowd.spectators[0],
    id: 'decoy',
    nature: 'copy' as const,
    face: 'chrollo' as const,
    order: 'charge' as const,
    at,
  }
  const scene = {
    ...world,
    scenario: replayDeathMatch(scriptBefore('fake-chrollo-crushed'), world.scenario.options),
    crowd: { ...world.crowd, spectators: [decoy] },
  }
  expect(decideHisokaInHall(scene).intent).toEqual({ kind: 'move', to: at })
  const inRange = { ...scene, hisoka: { ...scene.hisoka, at } }
  expect(decideHisokaInHall(inRange).intent).toEqual({ kind: 'gum', target: decoy.id })
})

it.each([
  { holdFrom: 0 },
  { holdFrom: 163 },
  { holdFrom: 176 },
  { holdFrom: 180 },
  { holdFrom: 200, lightAt: 164 },
])(
  'plays the historical fight through Machi with Context from frame $holdFrom',
  ({ holdFrom, lightAt }) => {
    let state = playableFight()
    let counterLanded = false
    for (let frame = 0; frame < 60 * 240 && state.phase === 'fighting'; frame += 1) {
      if (frame === lightAt) {
        state = performMove({ state, side: 'player', action: 'light', input: EMPTY_INPUT })
      }
      const before = state
      state = tick(state, frame >= holdFrom)
      expect(state.opponent.chrolloBook).toBe(state.deathMatch?.chrollo.book)
      if (
        !before.deathMatch?.scenario.done.includes('double-head-counter') &&
        state.deathMatch?.scenario.done.includes('double-head-counter')
      ) {
        counterLanded = true
        expect(state.opponent.health).toBeLessThan(before.opponent.health)
        expect(state.opponent.hitStun).toBeGreaterThan(0)
        expect(state.impact?.position.z).toBeDefined()
      }
    }
    expect(counterLanded).toBe(true)
    const scenario = state.deathMatch?.scenario
    expect(scenario?.done, `Last beat: ${scenario?.done.at(-1)}`).toEqual(
      DEATH_MATCH_BEATS.map(({ id }) => id),
    )
    expect(state.deathMatch?.scenario.survival.hisoka).toBe('revived')
    expect(state.deathMatch?.hisoka.machiBound).toBe(true)
    expect(state.player.gumProstheses?.parts).toContain('right-lower-leg')
    expect(state.matchWinner).toBe('opponent')
    expect(state.phase).toBe('finished')
  },
  120_000,
)
