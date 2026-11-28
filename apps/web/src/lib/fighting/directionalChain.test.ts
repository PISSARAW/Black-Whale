import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { attackData, INPUT_BUFFER_FRAMES } from './frameData'
import { prepareCombatRoute } from './combatRouteSetup'
import { selectedGumLink } from './bungeeNetwork'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'
import { directionalComboShot } from './directionalComboCamera'
import { fighterKeyedMove } from './fighterKeyedMove'
import { sampleTimeline } from './keyPoseTimeline'
import { moveById } from './movesets'
import { createCombatCamera } from './combatCamera'
import { fightWorldX } from './fightCoordinates'

type Fighter = 'kurapika' | 'hisoka'
const endings = ['ground', 'air', 'close', 'carry'] as const

function duel(
  fighter: Fighter,
  options: { facing?: 1 | -1; corner?: boolean; tether?: boolean } = {},
) {
  let state = beginFight(
    createFight(fighter, fighter === 'kurapika' ? 'hisoka' : 'kurapika', { mode: 'versus-local' }),
  )
  state = {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 50 },
  }
  if (options.tether) state = prepareCombatRoute(state, 'bungee')
  const facing = options.facing ?? 1
  const x = options.corner ? (facing === 1 ? 93 : 7) : 50
  return {
    ...state,
    player: { ...state.player, facing, x: x - 6 * facing },
    opponent: { ...state.opponent, facing: facing === 1 ? (-1 as const) : (1 as const), x },
  }
}

function tap(state: FightState, input: Partial<FightInput> = {}) {
  return performMove({
    state,
    side: 'player',
    action: 'light',
    input: { ...EMPTY_INPUT, ...input },
  })
}

function until(state: FightState, done: (value: FightState) => boolean, guard = true) {
  for (let i = 0; i < 90 && !done(state); i++)
    state = tickFight(state, EMPTY_INPUT, {
      dt: 1 / 60,
      ai: false,
      opponentInput: { ...EMPTY_INPUT, guard },
    })
  expect(done(state)).toBe(true)
  return state
}

function hit(state: FightState, count: number) {
  const result = until(state, (next) => next.impact?.comboHits === count, count > 1)
  expect(result.impact).toMatchObject({ attacker: 'player', comboHits: count, blocked: false })
  return result
}

function bridge(initial: FightState) {
  return hit(tap(hit(tap(initial), 1)), 2)
}

function cameraDepth(camera: ReturnType<typeof createCombatCamera>, state: FightState): number {
  const x = fightWorldX(state.player.x)
  const target = fightWorldX(state.opponent.x)
  return camera.update({
    state,
    base: { x: 0, y: 2.2, z: 8.2, lookY: 1.18 },
    span: { centre: (x + target) / 2, gap: Math.abs(x - target) },
    aspect: 16 / 9,
    dt: 1 / 60,
    intensity: 1,
  }).z
}

describe.each(['kurapika', 'hisoka'] as const)('%s directional finishes', (fighter) => {
  for (const facing of [1, -1] as const)
    for (const corner of [false, true])
      it.each(endings)('confirms %s facing ' + facing + ' corner=' + corner, (ending) => {
        const opening = bridge(duel(fighter, { facing, corner }))
        const input = {
          down: ending === 'ground',
          jump: ending === 'air',
          right: ending === 'carry' && facing === 1,
          left: ending === 'carry' && facing === -1,
        }
        const finished = hit(tap(opening, input), 3)
        expect(finished.player.attack?.directionalChain).toBe(ending)
        expect(directionalComboShot(finished)).toMatchObject({ ending, weight: 1 })
        if (ending === 'ground') expect(finished.opponent.knockdownFrames).toBeGreaterThan(0)
        if (ending === 'air') {
          expect(finished.opponent.velocityY).toBeGreaterThan(40)
          expect(finished.impact?.antiAir).toBe(false)
        }
        if (ending === 'close') expect(finished.opponent.knockdownFrames).toBe(0)
      })

  it('has different contact silhouettes for the four finishes', () => {
    const opening = bridge(duel(fighter))
    const strands = [{}, { down: true }, { jump: true }, { right: true }]
    const poses = strands.map((input) => {
      const state = hit(tap(opening, input), 3)
      const actor = state.player
      const frames = attackData(actor.attack!.kind, actor)
      const { timeline } = fighterKeyedMove(actor, moveById(actor.attack!.moveId)!.slot)
      return JSON.stringify(sampleTimeline(timeline, { frame: frames.startup, frames }))
    })
    expect(new Set(poses).size).toBe(4)
  })

  it('does not get a bridge on guard or after a whiff', () => {
    const initial = duel(fighter)
    const blocked = until(tap(initial), (next) => Boolean(next.impact?.blocked))
    expect(tap(blocked).player.attack?.directionalChain).toBeUndefined()
    const distant = { ...initial, opponent: { ...initial.opponent, x: 80 } }
    const buffered = tap(tap(distant))
    const ended = until(buffered, (next) => !next.player.attack)
    expect(ended.impact).toBeNull()
    expect(ended.player.bufferedAttack).toBeNull()
  })

  it('buffers the direction pressed before the second hit', () => {
    const first = hit(tap(duel(fighter)), 1)
    const second = tap(first)
    const { startup } = attackData(second.player.attack!.kind, second.player)
    const window = until(
      second,
      (state) => (state.player.attack?.frame ?? -1) >= Math.max(0, startup - INPUT_BUFFER_FRAMES),
    )
    expect(window.player.attack?.confirmedHit).toBe(false)
    const queued = tap(window, { jump: true })
    expect(queued.player.bufferedAttack?.directionalChain).toBe('air')
    const result = hit(queued, 3)
    expect(result.player.attack?.directionalChain).toBe('air')
    expect(result.opponent.velocityY).toBeGreaterThan(40)
  })

  it('opens the lens before takeoff and permits a light aerial follow-up', () => {
    const opening = bridge(duel(fighter))
    const camera = createCombatCamera()
    let depth = cameraDepth(camera, opening)
    let state = tap(opening, { jump: true })
    let largestStep = 0
    for (let frame = 0; frame < 80 && state.impact?.comboHits !== 4; frame++) {
      const launched = state.opponent.velocityY !== 0
      if (state.player.y > 1.8 && state.opponent.y > 1 && !state.player.attack) state = tap(state)
      state = tickFight(
        state,
        { ...EMPTY_INPUT, jump: launched, right: launched },
        {
          dt: 1 / 60,
          ai: false,
          opponentInput: { ...EMPTY_INPUT, guard: true },
        },
      )
      const z = cameraDepth(camera, state)
      largestStep = Math.max(largestStep, Math.abs(depth - z))
      depth = z
    }
    expect(state.impact?.comboHits).toBe(4)
    expect(largestStep).toBeLessThan(0.9)
  })
})

it('spends aura on Dowsing Whip and falls back without ever using Chain Jail', () => {
  const opening = bridge(duel('kurapika'))
  const whip = hit(tap(opening, { right: true }), 3)
  expect(whip.player.attack?.moveId).toBe('kurapika:forwardSpecial')
  expect(whip.player.aura).toBeLessThan(77)
  const empty = { ...opening, player: { ...opening.player, aura: 0 } }
  const physical = hit(tap(empty, { right: true }), 3)
  expect(physical.player.attack?.moveId).toBe('kurapika:forwardHeavy')
  expect(physical.opponent.chainJail).toBeUndefined()
})

it('uses and consumes only an existing gum link', () => {
  const unattached = hit(tap(bridge(duel('hisoka')), { right: true }), 3)
  expect(unattached.player.attack?.moveId).toBe('hisoka:forwardHeavy')
  expect(selectedGumLink(unattached, 'player')).toBeUndefined()
  const ready = bridge(duel('hisoka', { tether: true }))
  expect(selectedGumLink(ready, 'player')).toBeDefined()
  const withTether = hit(tap(ready, { right: true }), 3)
  expect(withTether.player.attack?.moveId).toBe('hisoka:finisher')
  expect(ready.player.aura - withTether.player.aura).toBeGreaterThan(54)
  expect(selectedGumLink(withTether, 'player')).toBeUndefined()
})
