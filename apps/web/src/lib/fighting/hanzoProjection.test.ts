import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAttack, performMove, tickFight } from './engine'
import { resolveFightImpacts } from './combatImpact'
import { activeHitbox, attackData, FIXED_STEP, hurtboxes } from './frameData'
import { hatsuAvoidsImpact, hatsuSourceFor } from './hatsu'
import { hatsuFor } from './hatsu/registry'
import { callHanzoBody, canCallHanzoBody } from './hanzoBodyCall'
import { HANZO_PROJECTION_STARTUP } from './hanzoProjection'
import { canUseMovesetMove, finisherReady, moveForSlot, movesetFor } from './movesets'
import { advanceProjectiles } from './projectiles'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightProjectile,
  type FightSide,
  type FightState,
} from './types'

function ready(
  player: 'hanzo' | 'chrollo' = 'hanzo',
  opponent: 'hisoka' | 'hanzo' = 'hisoka',
): FightState {
  const state = beginFight(createFight(player, opponent, { mode: 'versus-local' }))
  return {
    ...state,
    player: { ...state.player, x: 25, aura: 100 },
    opponent: { ...state.opponent, x: 80, aura: 100 },
  }
}

function frames(state: FightState, count: number, input: Partial<FightInput> = {}): FightState {
  for (let n = 0; n < count; n++) {
    state = tickFight(
      state,
      { ...EMPTY_INPUT, ...input },
      { dt: FIXED_STEP, opponentInput: EMPTY_INPUT },
    )
  }
  return state
}

function projected(): FightState {
  return frames(performAttack(ready(), 'player', 'special'), HANZO_PROJECTION_STARTUP)
}

function strike(state: FightState, side: FightSide, low = false): FightState {
  const armed = performMove({ state, side, action: 'light', input: { ...EMPTY_INPUT, down: low } })
  const fighter = armed[side]
  if (!fighter.attack) throw new Error('Attack must start')
  return resolveFightImpacts(
    {
      ...armed,
      [side]: {
        ...fighter,
        attack: { ...fighter.attack, frame: attackData('light', fighter).startup },
      },
    },
    [],
  )
}

const projectile = (x: number, y: number): FightProjectile => ({
  id: 1,
  owner: 'opponent',
  fighterId: 'hisoka',
  x,
  y,
  velocityX: 0,
  width: 0.5,
  height: 0.3,
  damage: 8,
  hitstun: 13,
  blockstun: 9,
  hitstop: 5,
  knockback: 2,
  targetZone: 'torso',
  shape: 'card',
  colour: '#fff',
  age: 0,
  lifetime: 120,
  matter: 'object',
})

describe('Hanzo Skill 4 in fighting', () => {
  it.each<FightSide>(['player', 'opponent'])(
    'projects on %s without a free strike, lunge or dodge',
    (side) => {
      const state = side === 'player' ? ready() : ready('hanzo', 'hanzo')
      const next = performAttack(state, side, 'special')
      expect(next[side].hanzoProjection).toMatchObject({ bodyX: state[side].x, startupFrames: 24 })
      expect(next[side].x).toBe(state[side].x)
      expect(next[side].aura).toBe(60)
      expect(next[side].attack).toBeNull()
      expect(activeHitbox(next[side])).toBeNull()
      expect(hatsuAvoidsImpact(next[side])).toBe(false)
    },
  )

  it('commits to startup before moving or attacking', () => {
    const started = performAttack(ready(), 'player', 'special')
    const preparing = frames(started, HANZO_PROJECTION_STARTUP - 1, { right: true, jump: true })
    expect(preparing.player.x).toBe(25)
    expect(preparing.player.y).toBe(0)
    expect(performAttack(preparing, 'player', 'light')).toBe(preparing)
    expect(performAttack(frames(preparing, 1), 'player', 'light').player.attack).not.toBeNull()
  })

  it('cannot project from the air, hitstun, Zetsu, a stolen Hatsu or insufficient aura', () => {
    for (const overrides of [{ y: 4 }, { hitStun: 8 }, { aura: 39 }]) {
      const base = ready()
      const state = { ...base, player: { ...base.player, ...overrides } }
      expect(performAttack(state, 'player', 'special').player.hanzoProjection).toBeUndefined()
    }
    const base = ready()
    for (const player of [
      { ...base.player, nen: { ...base.player.nen, mode: 'zetsu' as const } },
      { ...base.player, hatsuEffects: { ...base.player.hatsuEffects, hatsuStolen: 1 } },
    ])
      expect(
        performAttack({ ...base, player }, 'player', 'special').player.hanzoProjection,
      ).toBeUndefined()
  })

  it('floats and crosses the opponent while the sleeping body stays fixed', () => {
    const base = projected()
    const state = { ...base, player: { ...base.player, x: 75, y: 6 } }
    const moved = frames(state, 20, { right: true })
    expect(moved.player.x).toBeGreaterThan(moved.opponent.x)
    expect(moved.player.y).toBe(6)
    expect(moved.player.hanzoProjection?.bodyX).toBe(25)
    expect(moved.opponent.x).toBe(80)
    expect(frames(moved, 5, { down: true }).player.y).toBeLessThan(6)
    expect(hurtboxes(moved.player).every((box) => box.right < 30 && box.top <= 4.5)).toBe(true)
  })

  it('rejects a stolen Skill 4 without spending aura or starting an empty attack', () => {
    const base = ready()
    const state = {
      ...base,
      player: {
        ...base.player,
        hatsuEffects: { ...base.player.hatsuEffects, hatsuStolen: 1 },
      },
    }
    expect(performAttack(state, 'player', 'special')).toBe(state)
    expect(canUseMovesetMove(state, 'player', moveForSlot('hanzo', 'neutralSpecial')!)).toBe(false)
  })

  it('lets the double land physical blows from its own position', () => {
    const base = projected()
    const next = strike({ ...base, player: { ...base.player, x: 73 } }, 'player')
    expect(next.opponent.health).toBeLessThan(100)
    expect(next.player.hanzoProjection?.bodyX).toBe(25)
    expect(next.impact?.attacker).toBe('player')
  })

  it('ignores blows at the double but takes an unguarded hit at the sleeping body', () => {
    const base = projected()
    const away = {
      ...base,
      player: { ...base.player, x: 70, y: 5 },
      opponent: { ...base.opponent, x: 76 },
    }
    const missed = strike(away, 'opponent')
    expect(missed.player.health).toBe(100)
    expect(missed.player.hanzoProjection).toBeDefined()
    const struck = strike({ ...away, opponent: { ...away.opponent, x: 31 } }, 'opponent', true)
    expect(struck.player.health).toBeLessThan(100)
    expect(struck.player.hanzoProjection).toBeUndefined()
    expect(struck.player.x).toBeLessThan(25)
    expect(struck.player.hitStun).toBeGreaterThan(0)
    expect(struck.impact).toMatchObject({ blocked: false, avoided: false, antiAir: false })
  })

  it('makes projectiles hit the body and interrupt projection, even while the double guards', () => {
    const base = projected()
    const state = { ...base, player: { ...base.player, x: 70, y: 9, blocking: true } }
    const ghost = advanceProjectiles({ ...state, projectiles: [projectile(70, 10)] }, FIXED_STEP)
    expect(ghost.hits).toHaveLength(0)
    const body = advanceProjectiles({ ...state, projectiles: [projectile(25, 2)] }, FIXED_STEP)
    expect(body.hits).toHaveLength(1)
    const struck = resolveFightImpacts(body.state, body.hits)
    expect(struck.player.hanzoProjection).toBeUndefined()
    expect(struck.player.health).toBeLessThan(100)
    expect(struck.impact).toMatchObject({ blocked: false, avoided: false })
  })

  it('wakes on simple body contact without granting invulnerability or cancelling damage', () => {
    const base = projected()
    const state = {
      ...base,
      player: { ...base.player, x: 70 },
      opponent: { ...base.opponent, x: 25 },
    }
    const next = frames(state, 1)
    expect(next.player.hanzoProjection).toBeUndefined()
    expect(next.player.x).toBeLessThan(30)
    expect(next.player.health).toBe(100)
    expect(next.player.wakeupInvulnerableFrames).toBe(0)
  })

  it('requires rejoining the body to recall and charges no aura for recall', () => {
    const base = projected()
    const away = { ...base, player: { ...base.player, x: 70, aura: 1 } }
    expect(performAttack(away, 'player', 'special')).toBe(away)
    const near = { ...away, player: { ...away.player, x: 27, y: 1 } }
    const recalled = performMove({ state: near, side: 'player', action: 'special' })
    expect(recalled.player.hanzoProjection).toBeUndefined()
    expect(recalled.player.x).toBe(25)
    expect(recalled.player.y).toBe(0)
    expect(recalled.player.aura).toBe(1)
  })

  it('cannot throw a stone from the projected vessel or dismiss remotely through aura inputs', () => {
    const base = projected()
    expect(performAttack(base, 'player', 'ranged')).toBe(base)
    const away = { ...base, player: { ...base.player, x: 70 } }
    expect(frames(away, 1, { aura: true, down: true }).player.hanzoProjection).toBeDefined()
  })

  it('interrupts the projection on forced Zetsu and clears it between rounds', () => {
    const base = projected()
    const sealed = {
      ...base,
      player: {
        ...base.player,
        x: 70,
        hatsuEffects: { ...base.player.hatsuEffects, forcedZetsuFrames: 10 },
      },
    }
    expect(hatsuFor('hanzo').onFrame(sealed).player.hanzoProjection).toBeUndefined()
    const reset = nextRound({ ...base, phase: 'finished', winner: 'opponent' })
    expect(reset.player.hanzoProjection).toBeUndefined()
    const ended = frames({ ...base, time: FIXED_STEP, remainingFrames: 1 }, 1)
    expect(ended.phase).toBe('finished')
    expect(ended.player.hanzoProjection).toBeUndefined()
  })

  it('requires an active double for the close-range choke and keeps directional moves martial', () => {
    expect(finisherReady(ready(), 'player')).toBe(false)
    expect(finisherReady(projected(), 'player')).toBe(true)
    const moveset = movesetFor('hanzo')!
    expect(moveset.moves.find((move) => move.slot === 'finisher')?.tuning.reach).toBe(4)
    for (const slot of ['forwardSpecial', 'downSpecial', 'backSpecial', 'finisher']) {
      expect(hatsuSourceFor(projected().player, `hanzo:${slot}`)).toBeNull()
    }
  })

  it('applies the same vulnerable-body rule when Chrollo replays the stolen page', () => {
    const base = ready('chrollo')
    const state = {
      ...base,
      player: {
        ...base.player,
        chrolloBook: { pages: ['hanzo'] as const, page: 0, open: true, bookmark: null },
        hatsuEffects: { ...base.player.hatsuEffects, stolenHatsu: 'hanzo' as const },
      },
    }
    const next = performAttack(state, 'player', 'special')
    expect(next.player.hanzoProjection?.bodyX).toBe(25)
    expect(next.player.attack).toBeNull()
    expect(next.player.aura).toBe(100 - moveForSlot('chrollo', 'neutralSpecial')!.auraCost)
  })

  it('makes the AI approach the exposed body instead of chasing the double', () => {
    const base = projected()
    const next = tickFight({ ...base, player: { ...base.player, x: 90 } }, EMPTY_INPUT, FIXED_STEP)
    expect(next.opponent.x).toBeLessThan(80)
    expect(next.opponent.facing).toBe(-1)
    expect(next.player.hanzoProjection?.bodyX).toBe(25)
  })

  it('lets an exhausted AI double return to its body before recalling', () => {
    let state = performAttack(ready('hanzo', 'hanzo'), 'opponent', 'special')
    const projection = state.opponent.hanzoProjection!
    state = {
      ...state,
      opponent: {
        ...state.opponent,
        x: 50,
        aura: 1,
        hanzoProjection: { ...projection, startupFrames: 0 },
      },
    }
    for (let n = 0; n < 90; n++) state = tickFight(state, EMPTY_INPUT, FIXED_STEP)
    expect(state.opponent.hanzoProjection).toBeUndefined()
    expect(state.opponent.aura).toBeGreaterThan(0)
  })

  it('interrupts projection when the opponent speaks near the body, without damage', () => {
    const base = projected()
    const away = { ...base, player: { ...base.player, x: 70 } }
    expect(canCallHanzoBody(away, 'opponent')).toBe(false)
    expect(callHanzoBody(away, 'opponent')).toBe(away)
    const nearby = { ...away, opponent: { ...away.opponent, x: 38 } }
    const spoken = tickFight(nearby, EMPTY_INPUT, {
      dt: FIXED_STEP,
      opponentInput: { ...EMPTY_INPUT, call: true },
    })
    expect(spoken.player.hanzoProjection).toBeUndefined()
    expect(spoken.player.x).toBe(25)
    expect(spoken.player.health).toBe(100)
    expect(spoken.player.wakeupInvulnerableFrames).toBe(0)
  })

  it('does not wake the body when speaking only to the distant double', () => {
    const base = projected()
    const state = { ...base, player: { ...base.player, x: 78 } }
    const next = tickFight(state, EMPTY_INPUT, {
      dt: FIXED_STEP,
      opponentInput: { ...EMPTY_INPUT, call: true },
    })
    expect(next.player.hanzoProjection?.bodyX).toBe(25)
  })
})
