import { describe, expect, it } from 'vitest'
import { beginFight, createFight, opponentAttack, performMove, tickFight } from './engine'
import { readCounterplay } from './fightCounterplay'
import { moveCounterplayOpponent } from './counterplayOpponent'
import { PROJECTILE_BURST_GAP } from './projectileDefence'
import { styleReactionFrames } from './styleMobility'
import { EMPTY_INPUT, type FightProjectile, type FightState, type FighterId } from './types'

function duel(id: FighterId = 'hisoka'): FightState {
  const base = beginFight(createFight('franklin', id, { mode: 'versus-ai', formatId: 'knockout' }))
  return { ...base, player: { ...base.player, x: 10 }, opponent: { ...base.opponent, x: 70 } }
}
function shot(patch: Partial<FightProjectile> = {}): FightProjectile {
  return {
    id: 1,
    owner: 'player',
    fighterId: 'franklin',
    x: 30,
    y: 6,
    velocityX: 82,
    width: 0.45,
    height: 0.18,
    damage: 3,
    hitstun: 12,
    blockstun: 8,
    hitstop: 1,
    knockback: 0.35,
    targetZone: 'torso',
    shape: 'bullet',
    colour: '#fff',
    matter: 'nen',
    age: 0,
    lifetime: 120,
    guard: 'mid',
    ...patch,
  }
}
function react(state: FightState): FightState {
  return {
    ...state,
    opponent: moveCounterplayOpponent({ state, fighter: state.opponent, target: state.player }),
  }
}
function ready(state: FightState): FightState {
  const cue = readCounterplay(state, 'opponent')!
  return {
    ...state,
    opponent: {
      ...state.opponent,
      counterplayRead: {
        key: cue.key,
        frames: styleReactionFrames(state.opponent),
        coveringEars: false,
      },
    },
  }
}

describe('projectile collision anticipation', () => {
  it('prioritises a farther fast shot over a nearer slow one by time to collision', () => {
    const state = {
      ...duel(),
      projectiles: [shot({ x: 50, velocityX: 20 }), shot({ id: 2, x: 10, velocityX: 250 })],
    }
    const cue = readCounterplay(state, 'opponent')!
    expect(cue.key).toBe('projectile:2')
    expect(cue.impactFrames).toBeLessThan(20)
  })
  it.each([{ y: 30 }, { x: 80 }, { x: 5, velocityX: -82 }])(
    'ignores a trajectory that cannot meet the body: %j',
    (patch) => {
      expect(readCounterplay({ ...duel(), projectiles: [shot(patch)] }, 'opponent')).toBeNull()
    },
  )
  it('can observe a fast visible shot beyond the old forty-two-unit cutoff', () => {
    const cue = readCounterplay(
      { ...duel(), projectiles: [shot({ x: 5, velocityX: 180 })] },
      'opponent',
    )
    expect(cue?.kind).toBe('projectile')
  })
  it('does not peek at a concealed Nen shot or a buried remote punch', () => {
    for (const patch of [{ concealed: true }, { y: -3 }])
      expect(readCounterplay({ ...duel(), projectiles: [shot(patch)] }, 'opponent')).toBeNull()
  })
  it('forecasts a real landing instead of assuming the current airborne height stays safe', () => {
    const state = duel()
    state.opponent = { ...state.opponent, y: 12, velocityY: -30 }
    expect(
      readCounterplay({ ...state, projectiles: [shot({ x: 40, y: 2.5 })] }, 'opponent')?.kind,
    ).toBe('projectile')
  })
})

describe('trajectory-based ordinary defences', () => {
  it('crouches under high shots rather than jumping into their path', () => {
    const state = ready({ ...duel(), projectiles: [shot({ y: 10.1 })] })
    const result = react(state).opponent
    expect(result.crouching).toBe(true)
    expect(result.blocking).toBe(true)
    expect(result.motion?.prejumpFrames ?? 0).toBe(0)
    expect(result.aura).toBe(state.opponent.aura)
  })
  it('uses the ordinary prejump when the complete jump arc clears a mid-height shot', () => {
    const result = react(ready({ ...duel(), projectiles: [shot({ x: 42 })] })).opponent
    expect(result.motion?.prejumpFrames).toBeGreaterThan(0)
    expect(result.blocking).toBe(false)
    expect(result.wakeupInvulnerableFrames).toBe(0)
  })
  it('guards a shot arriving before takeoff instead of attempting a doomed jump', () => {
    const result = react(ready({ ...duel(), projectiles: [shot({ x: 66 })] })).opponent
    expect(result.blocking).toBe(true)
    expect(result.motion?.prejumpFrames ?? 0).toBe(0)
  })
  it('keeps a standing guard for a readable overhead even when a high shot follows it', () => {
    const state = ready({
      ...duel('kurapika'),
      projectiles: [shot({ x: 55, y: 6, guard: 'overhead' }), shot({ id: 2, x: 20, y: 10.1 })],
    })
    const result = react(state).opponent
    expect(result.blocking).toBe(true)
    expect(result.crouching).toBe(false)
    expect(result.motion?.prejumpFrames ?? 0).toBe(0)
  })
  it('can keep guarding during blockstun without granting movement or a new parry window', () => {
    let state = ready({ ...duel(), projectiles: [shot({ x: 55, guard: 'low', y: 2.5 })] })
    state = {
      ...state,
      opponent: { ...state.opponent, blocking: true, guardFrames: 20, blockStun: 6 },
    }
    const result = react(state).opponent
    expect(result).toMatchObject({ blocking: true, crouching: true, blockStun: 6, guardFrames: 21 })
    expect(result.x).toBe(state.opponent.x)
    expect(result.motion?.prejumpFrames ?? 0).toBe(0)
  })
  it('does not cancel an attack or escape hitstun to manufacture a defence', () => {
    const state = { ...duel(), projectiles: [shot({ x: 55 })] }
    const attacking = performMove({ state, side: 'opponent', action: 'heavy' })
    expect(react(ready(attacking)).opponent.attack).toEqual(attacking.opponent.attack)
    const stunned = ready({ ...state, opponent: { ...state.opponent, hitStun: 10 } })
    expect(react(stunned).opponent).toMatchObject({ hitStun: 10, blocking: false })
  })
  it('does not treat a homing manifestation as a guaranteed safe high-shot duck', () => {
    const result = react(
      ready({ ...duel('kurapika'), projectiles: [shot({ y: 10.1, jupiter: true })] }),
    ).opponent
    expect(result.blocking).toBe(true)
    expect(result.crouching).toBe(false)
  })
  it('preserves the original reaction delay against a newly visible close shot', () => {
    const state = { ...duel(), projectiles: [shot({ x: 68 })] }
    const result = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false })
    expect(result.opponent.health).toBeLessThan(state.opponent.health)
    expect(result.impact?.parried).toBe(false)
  })
})

describe('bounded volley observation', () => {
  function observedVolley(): FightState {
    let state = duel('kurapika')
    for (let frame = 1; frame <= 24; frame++)
      state = react({ ...state, frame, projectiles: [shot({ id: frame })] })
    return state
  }
  it('retains reaction progress across changing bullet IDs and bounds its memory', () => {
    const state = observedVolley()
    expect(state.opponent.projectileDefence?.frames).toBe(24)
    expect(state.opponent.projectileDefence?.ids.length).toBeLessThanOrEqual(16)
    expect(state.opponent.blocking).toBe(true)
    expect(state.opponent.guardFrames).toBe(24 - styleReactionFrames(state.opponent))
  })
  it('holds its guard through short gaps, then expires before a separate attack', () => {
    const volley = observedVolley()
    const held = react({ ...volley, frame: volley.frame + PROJECTILE_BURST_GAP, projectiles: [] })
    expect(held.opponent.blocking).toBe(true)
    expect(held.opponent.guardFrames).toBe(volley.opponent.guardFrames + 1)
    const expired = react({
      ...held,
      frame: volley.frame + PROJECTILE_BURST_GAP + 1,
      projectiles: [],
    })
    expect(expired.opponent.projectileDefence).toBeUndefined()
    const fresh = react({ ...expired, projectiles: [shot({ id: 100 })] })
    expect(fresh.opponent.counterplayRead?.frames).toBe(1)
  })
  it('does not renew the volley or learn a new ID from a concealed projectile', () => {
    const state = observedVolley()
    const result = react({
      ...state,
      frame: state.frame + 5,
      projectiles: [shot({ id: 999, concealed: true })],
    })
    expect(result.opponent.projectileDefence?.lastSeen).toBe(state.frame)
    expect(result.opponent.projectileDefence?.ids).not.toContain(999)
  })
  it('keeps a mixed-height volley grounded instead of jumping into a later bullet', () => {
    const result = react(
      ready({ ...duel(), projectiles: [shot({ y: 2.5 }), shot({ id: 2, x: 20, y: 10.1 })] }),
    ).opponent
    expect(result.blocking).toBe(true)
    expect(result.crouching).toBe(true)
    expect(result.motion?.prejumpFrames ?? 0).toBe(0)
  })
  it('does not let the AI replace its observed defence with an attack or preparation', () => {
    const state = observedVolley()
    expect(opponentAttack(state)).toBe(state)
  })
})
