import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performAttack, performMove, tickFight } from './engine'
import { advanceBiohazard } from './biohazardFrame'
import {
  BIOHAZARD_CAPTURE,
  BIOHAZARD_COST,
  BIOHAZARD_GRACE,
  BIOHAZARD_TRANSFORM,
  createBiohazardInventory,
} from './biohazard'
import { interceptBiohazardProjectile, strikeBiohazardMelee } from './biohazardImpact'
import { advanceProjectiles, projectileProfile } from './projectiles'
import { bindBiohazard, pigeonCanCapture } from './biohazardCapture'
import { moveForSlot, movesetFor } from './movesets'
import { attackData } from './frameData'
import { forceZetsu } from './nen'
import { hatsuDamageFactor, hatsuDefenceFactor } from './hatsu'
import { resolveFightOutcome } from './fightOutcome'
import { recordFightDeath } from './fightDeaths'
import { EMPTY_INPUT, type FightProjectile, type FightSide, type FightState } from './types'

function ready(): FightState {
  const state = beginFight(
    createFight('hinrigh', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 25, aura: 100 },
    opponent: { ...state.opponent, x: 65 },
  }
}
function frames(state: FightState, count: number): FightState {
  for (let n = 0; n < count; n++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function launch(state = ready()): FightState {
  return performAttack(state, 'player', 'special')
}
function flying(): FightState {
  const state = frames(launch(), BIOHAZARD_TRANSFORM)
  return {
    ...state,
    player: {
      ...state.player,
      biohazard: {
        objects: state.player.biohazard!.objects.map((o) => (o.id === 0 ? { ...o, x: 50 } : o)),
      },
    },
  }
}
function captured(): FightState {
  const state = flying()
  const object = {
    ...state.player.biohazard!.objects[0],
    phase: 'bound' as const,
    x: state.opponent.x,
  }
  return bindBiohazard(
    {
      ...state,
      player: {
        ...state.player,
        biohazard: {
          objects: [object, state.player.biohazard!.objects[1]],
        },
      },
    },
    'player',
    object,
  )
}
function shot(patch: Partial<FightProjectile> = {}): FightProjectile {
  return {
    id: 1,
    owner: 'opponent',
    fighterId: 'theta',
    x: 50,
    y: 6,
    velocityX: -100,
    width: 0.7,
    height: 0.2,
    damage: 10,
    hitstun: 10,
    blockstun: 10,
    hitstop: 3,
    knockback: 2,
    targetZone: 'torso',
    shape: 'bullet',
    colour: '#fff',
    matter: 'object',
    concealed: false,
    age: 0,
    lifetime: 120,
    ...patch,
  }
}

describe('Hinrigh’s physical Biohazard objects', () => {
  it('starts with two real pairs; activation transforms one without a damaging attack or stat buff', () => {
    const base = ready()
    expect(base.player.biohazard!.objects).toHaveLength(2)
    expect(base.opponent.biohazard).toBeUndefined()
    const state = launch(base)
    expect(state.player.aura).toBe(100 - BIOHAZARD_COST)
    expect(state.player.attack).toBeNull()
    expect(state.player.biohazard!.objects.map((o) => o.phase)).toEqual(['transforming', 'carried'])
    expect(state.opponent.health).toBe(base.opponent.health)
    expect(hatsuDamageFactor(state.player)).toBe(1)
    expect(hatsuDefenceFactor(state.player)).toBe(1)
  })
  it('commits 18 frames at the hand before the same object becomes a flying pigeon', () => {
    const start = launch()
    const partial = frames(start, BIOHAZARD_TRANSFORM - 1)
    expect(partial.player.biohazard!.objects[0].phase).toBe('transforming')
    expect(partial.player.x).toBe(start.player.x)
    const done = frames(partial, 1)
    expect(done.player.biohazard!.objects[0]).toMatchObject({
      id: 0,
      kind: 'handcuffs',
      phase: 'flying',
    })
    expect(done.player.hitStun).toBe(0)
    expect(performAttack(partial, 'player', 'heavy')).toBe(partial)
  })
  it('interrupts preparation on a received hit, returning the actual item without refunding spent aura', () => {
    const state = launch()
    const struck = advanceBiohazard({
      ...state,
      player: { ...state.player, hitStun: 10, health: state.player.health - 5 },
    })
    expect(struck.player.biohazard!.objects[0].phase).toBe('carried')
    expect(struck.player.aura).toBe(state.player.aura)
  })
  it('captures through the real flight path without HP damage, score, knockdown or forced Zetsu', () => {
    const base = ready()
    const state = frames(launch(base), 75)
    expect(state.opponent.biohazardRestraint?.owner).toBe('player')
    expect(state.player.biohazard!.objects[0].phase).toBe('bound')
    expect(state.opponent.health).toBe(base.opponent.health)
    expect(state.score).toEqual({ player: 0, opponent: 0 })
    expect(state.knockdowns).toEqual({ player: 0, opponent: 0 })
    expect(state.opponent.nen.mode).toBe(base.opponent.nen.mode)
    expect(state.opponent.hatsuEffects.forcedZetsuFrames).toBe(0)
  })
  it('holds position and prevents guard, movement, attacks and buffers, while leaving aura controllable', () => {
    const state = captured()
    expect(performAttack(state, 'opponent', 'heavy')).toBe(state)
    const next = tickFight(state, EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: {
        ...EMPTY_INPUT,
        right: true,
        jump: true,
        guard: true,
        aura: true,
        down: true,
      },
    })
    expect(next.opponent.x).toBe(state.opponent.x)
    expect(next.opponent.y).toBe(0)
    expect(next.opponent.blocking).toBe(false)
    expect(next.opponent.bufferedAttack).toBeNull()
    expect(next.opponent.nen.mode).toBe('zetsu')
  })
  it('expires after 48 combat frames, drops the same opened handcuffs and gives recapture immunity', () => {
    const state = frames(captured(), BIOHAZARD_CAPTURE)
    expect(state.opponent.biohazardRestraint).toBeUndefined()
    expect(state.opponent.biohazardGraceFrames).toBe(BIOHAZARD_GRACE)
    expect(state.player.biohazard!.objects[0].phase).toBe('dropped')
  })
  it('a damaging follow-up ends capture and breaks that pair instead of extending the lock', () => {
    const state = captured()
    const next = advanceBiohazard({
      ...state,
      opponent: { ...state.opponent, health: state.opponent.health - 5, hitStun: 12 },
    })
    expect(next.opponent.biohazardRestraint).toBeUndefined()
    expect(next.player.biohazard!.objects[0].phase).toBe('broken')
  })
  it.each(['guard', 'airborne', 'wakeup', 'hitstun', 'immune', 'already-bound'] as const)(
    'prevents capture on %s',
    (defence) => {
      const state = flying()
      let target = { ...state.opponent, x: 50 }
      if (defence === 'guard') target.blocking = true
      if (defence === 'airborne') target.y = 7
      if (defence === 'wakeup') target.wakeupInvulnerableFrames = 5
      if (defence === 'hitstun') target.hitStun = 5
      if (defence === 'immune') target.biohazardGraceFrames = 5
      if (defence === 'already-bound') target = captured().opponent
      expect(pigeonCanCapture(target, state.player.biohazard!.objects[0])).toBe(false)
    },
  )
  it('recalls free pigeons without refunding aura or creating equipment', () => {
    const state = flying()
    const recalled = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, down: true },
    })
    expect(recalled.player.biohazard!.objects[0].phase).toBe('returning')
    const returned = frames(recalled, 70)
    expect(returned.player.biohazard!.objects[0].phase).toBe('carried')
    expect(returned.player.biohazard!.objects).toHaveLength(2)
  })
  it('cannot transform or open latched cuffs remotely; recovering them requires real hand contact', () => {
    const state = captured()
    const distant = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, down: true },
    })
    expect(distant.opponent.biohazardRestraint).toEqual(state.opponent.biohazardRestraint)
    const near = { ...state, player: { ...state.player, x: state.opponent.x - 3 } }
    const opened = performMove({
      state: near,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, down: true },
    })
    expect(opened.opponent.biohazardRestraint).toBeUndefined()
    expect(opened.player.biohazard!.objects[0].phase).toBe('carried')
  })
  it('recovers a dropped object only by approaching it on the ground', () => {
    const state = frames(captured(), BIOHAZARD_CAPTURE)
    expect(state.player.biohazard!.objects[0].phase).toBe('dropped')
    const next = advanceBiohazard({ ...state, player: { ...state.player, x: state.opponent.x } })
    expect(next.player.biohazard!.objects[0].phase).toBe('carried')
  })
  it('runs out of available physical objects without creating replacements', () => {
    let state = launch()
    state = launch(frames(state, BIOHAZARD_TRANSFORM))
    state = frames(state, BIOHAZARD_TRANSFORM)
    expect(launch(state)).toBe(state)
    expect(state.player.biohazard!.objects).toHaveLength(2)
  })
  it.each(['zetsu', 'theft', 'drain'] as const)(
    'reverts flying animals to real dropped objects after %s',
    (reason) => {
      const state = flying()
      let owner = state.player
      if (reason === 'zetsu') owner = forceZetsu(owner)
      if (reason === 'theft')
        owner = { ...owner, hatsuEffects: { ...owner.hatsuEffects, hatsuStolen: 1 } }
      if (reason === 'drain') owner = { ...owner, aura: 0 }
      const next = advanceBiohazard({ ...state, player: owner })
      expect(next.player.biohazard!.objects[0].phase).toBe('dropped')
      expect(next.player.biohazard!.objects[0].kind).toBe('handcuffs')
    },
  )
  it('keeps already latched metal cuffs physical when their owner enters Zetsu', () => {
    const state = captured()
    const next = advanceBiohazard({ ...state, player: forceZetsu(state.player) })
    expect(next.opponent.biohazardRestraint?.frames).toBe(BIOHAZARD_CAPTURE - 1)
    expect(next.player.biohazard!.objects[0].phase).toBe('bound')
  })
  it('normal bullets are stopped by reinforced metal without a body hit or destruction', () => {
    const state = flying()
    const hit = interceptBiohazardProjectile(state, { projectile: shot(), previousX: 53 })
    expect(hit.intercepted).toBe(true)
    expect(hit.state.player.biohazard!.objects[0].durability).toBe(12)
    const flight = advanceProjectiles({ ...state, projectiles: [shot({ x: 52 })] }, 1 / 60)
    expect(flight.state.projectiles).toHaveLength(0)
    expect(flight.hits).toHaveLength(0)
  })
  it('Nen projectiles can destroy a pigeon and do not also hit its owner', () => {
    const state = flying()
    const next = interceptBiohazardProjectile(state, {
      previousX: 55,
      projectile: shot({ matter: 'nen', shape: 'orb', damage: 15, fighterId: 'hisoka' }),
    })
    expect(next.intercepted).toBe(true)
    expect(next.state.player.biohazard!.objects[0].phase).toBe('broken')
    expect(next.state.player.health).toBe(state.player.health)
  })
  it('an active melee strike repels or destroys the physical pigeon and is consumed once', () => {
    let state = flying()
    state = { ...state, opponent: { ...state.opponent, x: 56 } }
    state = performAttack(state, 'opponent', 'heavy')
    state = {
      ...state,
      opponent: {
        ...state.opponent,
        attack: { ...state.opponent.attack!, frame: attackData('heavy', state.opponent).startup },
      },
    }
    const next = strikeBiohazardMelee(state, 'player', state.player.biohazard!.objects[0])
    expect(next.player.biohazard!.objects[0].phase).not.toBe('flying')
    expect(next.opponent.attack?.impacted).toBe(true)
  })
  it('removes invented specials and the menagerie finisher; U throws a real knife without aura', () => {
    const state = ready()
    expect(moveForSlot('hinrigh', 'finisher')).toBeNull()
    expect(moveForSlot('hinrigh', 'forwardSpecial')).toBeNull()
    expect(movesetFor('hinrigh')!.moves.filter((m) => m.kind === 'special')).toHaveLength(2)
    expect(projectileProfile('hinrigh')).toMatchObject({ matter: 'object', shape: 'needle' })
    const next = performAttack(
      { ...state, player: { ...forceZetsu(state.player), aura: 0 } },
      'player',
      'ranged',
    )
    expect(next.player.attack?.kind).toBe('ranged')
    expect(next.player.aura).toBe(0)
  })
  it('does not give copies of Biohazard free equipment', () => {
    const state = ready()
    const empty = { ...state, player: { ...state.player, biohazard: undefined } }
    expect(launch(empty)).toBe(empty)
    const supplied = {
      ...empty,
      player: { ...empty.player, biohazard: createBiohazardInventory(1) },
    }
    expect(launch(supplied).player.biohazard!.objects[0].phase).toBe('transforming')
  })
  it('requires physical handcuffs for a real copied page and ends flight when that page closes', () => {
    const base = beginFight(createFight('chrollo', 'hisoka', { mode: 'versus-local' }))
    const state = {
      ...base,
      player: {
        ...base.player,
        aura: 100,
        chrolloBook: { pages: ['hinrigh'] as const, page: 0, open: true, bookmark: null },
      },
    }
    const empty = performAttack(state, 'player', 'special')
    expect(empty).toBe(state)
    const supplied = {
      ...state,
      player: { ...state.player, biohazard: createBiohazardInventory(1) },
    }
    const used = performMove({ state: supplied, side: 'player', action: 'special' })
    expect(used.player.biohazard!.objects[0].phase).toBe('transforming')
    expect(used.player.chrolloBook?.open).toBe(true)
    const closed = advanceBiohazard({
      ...used,
      player: { ...used.player, chrolloBook: { ...used.player.chrolloBook!, open: false } },
    })
    expect(closed.player.biohazard!.objects[0].phase).toBe('dropped')
  })
  it('releases a captured opponent after an actual damaging follow-up in the combat engine', () => {
    const base = captured()
    let state = { ...base, player: { ...base.player, x: base.opponent.x - 6 } }
    state = performAttack(state, 'player', 'heavy')
    const struck = frames(state, 30)
    expect(struck.opponent.health).toBeLessThan(base.opponent.health)
    expect(struck.opponent.biohazardRestraint).toBeUndefined()
    expect(struck.player.biohazard!.objects[0].phase).toBe('broken')
  })
  it('settles broken physical cuffs before Cat’s Name freezes a captured Camilla’s fatal follow-up', () => {
    const base = captured()
    const wounded = { ...base, opponent: { ...base.opponent, id: 'camilla' as const, health: 0 } }
    const next = resolveFightOutcome(
      recordFightDeath(wounded, { victimSide: 'opponent', killerSide: 'player', cause: 'strike' }),
    )
    expect(next.catsName).toBeDefined()
    expect(next.opponent.biohazardRestraint).toBeUndefined()
    expect(next.player.biohazard!.objects[0].phase).toBe('broken')
  })
  it('expires a detached pigeon back into the same physical object', () => {
    const state = flying()
    const next = advanceBiohazard({
      ...state,
      player: {
        ...state.player,
        biohazard: { objects: [{ ...state.player.biohazard!.objects[0], life: 0 }] },
      },
    })
    expect(next.player.biohazard!.objects[0]).toMatchObject({
      id: 0,
      kind: 'handcuffs',
      phase: 'dropped',
    })
  })
  it.each([
    { edge: 'left', x: 3, direction: -1 as const, pickup: 7 },
    { edge: 'right', x: 97, direction: 1 as const, pickup: 93 },
  ])(
    'keeps a missed pigeon recoverable at the $edge edge of the playable arena',
    ({ x, direction, pickup }) => {
      const base = flying()
      const state = {
        ...base,
        player: {
          ...base.player,
          biohazard: {
            objects: [{ ...base.player.biohazard!.objects[0], x, direction }],
          },
        },
      }
      const dropped = advanceBiohazard(state)
      expect(dropped.player.biohazard!.objects[0]).toMatchObject({ x: pickup, phase: 'dropped' })
      const recovered = advanceBiohazard({ ...dropped, player: { ...dropped.player, x: pickup } })
      expect(recovered.player.biohazard!.objects[0].phase).toBe('carried')
    },
  )
  it.each(['player', 'opponent'] as const)(
    'resets inventory and restraint on a new round for %s',
    (side: FightSide) => {
      const state = captured()
      const next = nextRound({ ...state, phase: 'finished', winner: side, matchWinner: null })
      expect(next.player.biohazard!.objects.every((o) => o.phase === 'carried')).toBe(true)
      expect(next.opponent.biohazardRestraint).toBeUndefined()
    },
  )
})
