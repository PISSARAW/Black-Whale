import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { FIXED_STEP } from './fightClock'
import { readCounterplay } from './fightCounterplay'
import { moveCounterplayOpponent } from './counterplayOpponent'
import { styleReactionFrames } from './styleMobility'
import { createRisingSun, inSolarHeat } from './feitanSun'
import { callHanzoBody } from './hanzoBodyCall'
import { melodyRestrictsCombat } from './melodyRules'
import { canStartFighterAttack } from './fighterAttacks'
import { counterplayAttackSlots } from './styleCounterAttack'
import {
  EMPTY_INPUT,
  type ArcadeFighter,
  type FightProjectile,
  type FightState,
  type FighterId,
} from './types'

function duel(player: FighterId = 'franklin', opponent: FighterId = 'hisoka'): FightState {
  const state = beginFight(
    createFight(player, opponent, { mode: 'versus-ai', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 10, aura: 100 },
    opponent: { ...state.opponent, x: 64, aura: 100 },
  }
}
function projectile(update: Partial<FightProjectile> = {}): FightProjectile {
  return {
    id: 1,
    owner: 'player',
    fighterId: 'franklin',
    x: 22,
    y: 6,
    velocityX: 82,
    width: 0.5,
    height: 0.2,
    damage: 10,
    hitstun: 12,
    blockstun: 8,
    hitstop: 4,
    knockback: 1,
    targetZone: 'torso',
    shape: 'bullet',
    colour: '#fff',
    age: 0,
    lifetime: 200,
    matter: 'nen',
    guard: 'mid',
    ...update,
  }
}
function step(state: FightState, count = 1): FightState {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, ai: false })
  return state
}
function withShot(update: Partial<FightProjectile> = {}): FightState {
  return { ...duel(), projectiles: [projectile(update)] }
}
function react(state: FightState): ArcadeFighter {
  return moveCounterplayOpponent({ state, fighter: state.opponent, target: state.player })
}
function prime(state: FightState): FightState {
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

describe('counterplay uses only accessible manifestations', () => {
  it('does not reveal an aura projectile concealed by In without ocular Gyo', () => {
    expect(readCounterplay(withShot({ concealed: true }), 'opponent')).toBeNull()
  })
  it('reveals it through an available Gyo, but not through sealed sight or Zetsu', () => {
    const state = withShot({ concealed: true })
    state.opponent.nen = { ...state.opponent.nen, gyo: true }
    expect(readCounterplay(state, 'opponent')?.kind).toBe('projectile')
    expect(
      readCounterplay(
        {
          ...state,
          opponent: {
            ...state.opponent,
            hatsuEffects: { ...state.opponent.hatsuEffects, senseSeals: 1 },
          },
        },
        'opponent',
      ),
    ).toBeNull()
    expect(
      readCounterplay(
        {
          ...state,
          opponent: { ...state.opponent, nen: { ...state.opponent.nen, mode: 'zetsu' } },
        },
        'opponent',
      ),
    ).toBeNull()
  })
  it('allows En to locate physical motion, but not aura hidden by In, without sight', () => {
    const state = withShot({ concealed: true, matter: 'object', x: 50 })
    state.opponent = {
      ...createFight('hisoka', 'hinrigh').opponent,
      x: state.opponent.x,
      aura: 100,
    }
    state.opponent.nen = { ...state.opponent.nen, mode: 'ren', en: { radius: 18 } }
    state.opponent.hatsuEffects = { ...state.opponent.hatsuEffects, senseSeals: 1 }
    expect(readCounterplay(state, 'opponent')?.kind).toBe('projectile')
    expect(
      readCounterplay(
        { ...state, projectiles: [projectile({ concealed: true, x: 50 })] },
        'opponent',
      ),
    ).toBeNull()
    expect(
      readCounterplay(
        { ...state, projectiles: [projectile({ concealed: true, matter: 'object', x: 40 })] },
        'opponent',
      ),
    ).toBeNull()
    expect(
      readCounterplay(
        { ...state, opponent: { ...state.opponent, moonlightZetsu: true } },
        'opponent',
      ),
    ).toBeNull()
  })
  it('keeps a physical projectile visible under In and does not invent vision for a blind observer', () => {
    const state = withShot({ matter: 'object', concealed: true })
    expect(readCounterplay(state, 'opponent')?.kind).toBe('projectile')
    state.opponent.hatsuEffects = { ...state.opponent.hatsuEffects, senseSeals: 1 }
    expect(readCounterplay(state, 'opponent')).toBeNull()
  })
  it.each([{ owner: 'opponent' as const }, { x: 70 }, { y: -3 }])(
    'ignores an unavailable incoming trajectory %j',
    (update) => {
      expect(readCounterplay(withShot(update), 'opponent')).toBeNull()
    },
  )
  it('does not consult the opponent’s queued command or private witness information', () => {
    const state = duel()
    state.player.bufferedAttack = {
      kind: 'special',
      auraCharged: true,
      concealed: true,
      hatsuSource: 'franklin',
    }
    state.player.hatsuEffects = { ...state.player.hatsuEffects, witnessedHatsu: 'camilla' }
    expect(readCounterplay(state, 'opponent')).toBeNull()
    expect(react(state).counterplayRead).toBeUndefined()
  })
  it('does not inspect an opponent’s future branch to give anticipation to another character', () => {
    const state = withShot()
    state.parallelFuture = {
      owner: 'player',
      phase: 'vision',
      frames: [],
      preparation: 30,
      cursor: 0,
      previewCursor: 0,
      controls: null,
    }
    expect(readCounterplay(state, 'opponent')).toBeNull()
    expect(react(state).counterplayRead).toBeUndefined()
  })
  it('reports a hidden tether only after perception reveals it, without dispelling it', () => {
    const state = duel('hisoka', 'kurapika')
    state.bungeeGum = { owner: 'player', target: 'opponent', hidden: true, retracting: true }
    expect(readCounterplay(state, 'opponent')).toBeNull()
    state.opponent.nen = { ...state.opponent.nen, gyo: true }
    expect(readCounterplay(state, 'opponent')?.kind).toBe('tether')
    const result = react(prime(state))
    expect(state.bungeeGum.hidden).toBe(true)
    expect(result.aura).toBe(state.opponent.aura)
  })
})

describe('ordinary responses have a readable delay and physical consequences', () => {
  it('waits its reaction window before choosing a mobile jump', () => {
    let state = withShot()
    for (let i = 0; i < styleReactionFrames(state.opponent); i++) {
      state = { ...state, opponent: react(state) }
      expect(state.opponent.motion?.prejumpFrames ?? 0).toBe(0)
    }
    state = { ...state, opponent: react(state) }
    expect(state.opponent.motion!.prejumpFrames).toBeGreaterThan(0)
    expect(state.opponent.wakeupInvulnerableFrames).toBe(0)
  })
  it('lets a mobile fighter physically jump a visible distant projectile', () => {
    const start = withShot()
    const result = step(start, 34)
    expect(result.opponent.health).toBe(start.opponent.health)
    expect(result.opponent.y).toBeGreaterThan(0)
    expect(result.opponent.counterplayRead).toBeUndefined()
    expect(result.opponent.wakeupInvulnerableFrames).toBe(0)
  })
  it('gives a control fighter a guarded response instead of the same jump', () => {
    const base = duel('franklin', 'kurapika')
    const state = prime({
      ...base,
      projectiles: [projectile({ guard: 'low', targetZone: 'head' })],
    })
    const result = react(state)
    expect(result.blocking).toBe(true)
    expect(result.crouching).toBe(true)
    expect(result.motion?.prejumpFrames ?? 0).toBe(0)
  })
  it('does not give an immediate perfect defense against a newly visible close shot', () => {
    const start = withShot({ x: 62 })
    const result = step(start, 3)
    expect(result.opponent.health).toBeLessThan(start.opponent.health)
  })
  it('does not run AI counterplay for a locally controlled opponent', () => {
    const start = withShot()
    const result = tickFight({ ...start, mode: 'versus-local' }, EMPTY_INPUT, {
      dt: FIXED_STEP,
      opponentInput: EMPTY_INPUT,
      ai: false,
    })
    expect(result.opponent.counterplayRead).toBeUndefined()
    expect(result.opponent.x).toBe(start.opponent.x)
  })
  it('restarts observation after the threat disappears instead of retaining an instant response', () => {
    const state = prime(withShot())
    const cleared = react({ ...state, projectiles: [] })
    expect(cleared.counterplayRead).toBeUndefined()
    const fresh = react({ ...state, frame: state.frame + 13, opponent: cleared })
    expect(fresh.counterplayRead?.frames).toBe(1)
  })
})

describe('responses honor each Hatsu’s actual counterconditions', () => {
  it('approaches visible Phinks preparation without taking away completed rotations', () => {
    const state = duel('phinks', 'kurapika')
    state.player.cyclotronWindup = { frame: 15 }
    state.player.hatsuEffects = { ...state.player.hatsuEffects, cyclotronTurns: 3 }
    expect(readCounterplay(state, 'opponent')?.kind).toBe('preparation')
    const prepared = prime(state)
    expect(react(prepared).x).toBeLessThan(state.opponent.x)
    expect(state.player.hatsuEffects.cyclotronTurns).toBe(3)
    expect(
      counterplayAttackSlots(
        {
          ...prepared,
          opponent: {
            ...prepared.opponent,
            counterplayRead: { ...prepared.opponent.counterplayRead!, frames: 15 },
          },
        },
        6,
      ),
    ).toEqual(['standingLight', 'forwardLight'])
  })
  it('returns detached coordinates instead of leaking the actor’s private fields', () => {
    const state = duel('phinks', 'kurapika')
    state.player.cyclotronWindup = { frame: 10 }
    state.player.hatsuEffects.witnessedHatsu = 'camilla'
    const cue = readCounterplay(state, 'opponent')!
    expect(Object.keys(cue.position).sort()).toEqual(['x', 'y'])
    cue.position.x = 99
    expect(state.player.x).toBe(10)
  })
  it('does not infer the preparation through sealed sight', () => {
    const state = duel('phinks', 'kurapika')
    state.player.cyclotronWindup = { frame: 15 }
    state.opponent.hatsuEffects = { ...state.opponent.hatsuEffects, senseSeals: 1 }
    expect(readCounterplay(state, 'opponent')).toBeNull()
  })
  it('seeks the real sleeping body, but a speech seal still prevents calling it', () => {
    const state = duel('hanzo', 'kurapika')
    state.player.hanzoProjection = {
      bodyX: 50,
      bodyFacing: 1,
      bodyNen: state.player.nen,
      startupFrames: 0,
    }
    state.player.x = 90
    const cue = readCounterplay(state, 'opponent')!
    expect(cue.position.x).toBe(50)
    expect(react(prime(state)).x).toBeLessThan(state.opponent.x)
    const muted = {
      ...state,
      opponent: {
        ...state.opponent,
        hatsuEffects: { ...state.opponent.hatsuEffects, senseSeals: 4 },
      },
    }
    expect(callHanzoBody(muted, 'opponent')).toBe(muted)
    expect(callHanzoBody(state, 'opponent').player.hanzoProjection).toBeUndefined()
  })
  it.each([7, 50, 93])(
    'escapes visible solar heat at x=%i without treating guard as protection',
    (x) => {
      const state = duel('feitan', 'kurapika')
      state.player = { ...state.player, x }
      const sun = createRisingSun(state.player, 20)
      state.player.hatsuEffects.painPacker = { injuries: 0, packedDamage: 20, armour: true, sun }
      state.opponent = { ...state.opponent, x, blocking: true, guardFrames: 50 }
      const result = react(prime(state))
      expect(result.blocking).toBe(false)
      expect(result.x).not.toBe(x)
      expect(Math.abs(result.x - sun.x)).toBeGreaterThan(0)
      expect(state.player.hatsuEffects.painPacker.sun).toBe(sun)
    },
  )
  it('holds outside solar heat rather than walking back into it', () => {
    const state = duel('feitan', 'kurapika')
    state.player.hatsuEffects.painPacker = {
      injuries: 0,
      packedDamage: 20,
      armour: true,
      sun: createRisingSun(state.player, 20),
    }
    expect(inSolarHeat(state.opponent, state.player.hatsuEffects.painPacker.sun!)).toBe(false)
    const result = react(prime(state))
    expect(result.x).toBe(state.opponent.x)
    expect(result.blocking).toBe(false)
  })
  it('covering the ears against music occupies the hands and stops when the performance stops', () => {
    const state = duel('melody', 'kurapika')
    state.player.x = 50
    state.player.melodyPerformance = {
      moveId: 'melody:neutralSpecial',
      originX: 50,
      startupFrames: 0,
      playingFrames: 20,
    }
    const result = react(prime(state))
    expect(result.coveringEars).toBe(true)
    expect(result.blocking).toBe(false)
    expect(melodyRestrictsCombat(result)).toBe(true)
    expect(canStartFighterAttack(result, 'light')).toBe(false)
    const stopped = react({
      ...state,
      opponent: result,
      player: { ...state.player, melodyPerformance: undefined },
    })
    expect(stopped.coveringEars).toBe(false)
  })
  it.each([2, 3])('does not defend against inaudible music with sense seals %i', (senseSeals) => {
    const state = duel('melody', 'kurapika')
    state.player.x = 50
    state.player.melodyPerformance = {
      moveId: 'melody:neutralSpecial',
      originX: 50,
      startupFrames: 0,
      playingFrames: 20,
    }
    state.opponent.hatsuEffects = { ...state.opponent.hatsuEffects, senseSeals }
    expect(readCounterplay(state, 'opponent')).toBeNull()
  })
})
