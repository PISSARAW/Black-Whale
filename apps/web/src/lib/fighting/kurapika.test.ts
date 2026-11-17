import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  performAttack,
  performAuraAttack,
  performMove,
  tickFight,
} from './engine'
import { attackData, activeHitbox } from './frameData'
import { advanceHatsuFrames } from './hatsu'
import { createKurapika, EMPEROR_BLACKOUT_THRESHOLD, EMPEROR_BLACKOUT_FRAMES } from './kurapika'
import { toggleEmperorTime } from './kurapikaActions'
import { canUseMovesetMove, finisherReady, moveForSlot } from './movesets'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type FighterId,
  type MoveSlot,
} from './types'

function duel(opponent: FighterId = 'chrollo'): FightState {
  const state = beginFight(
    createFight('kurapika', opponent, {
      mode: 'versus-local',
      formatId: 'knockout',
    }),
  )
  return {
    ...state,
    player: { ...state.player, x: 42, aura: 100 },
    opponent: { ...state.opponent, x: 48, aura: 10 },
  }
}
function advance(
  state: FightState,
  frames: number,
  player: FightInput = EMPTY_INPUT,
  opponent: FightInput = EMPTY_INPUT,
): FightState {
  for (let i = 0; i < frames; i++)
    state = tickFight(state, player, { dt: 1 / 60, opponentInput: opponent })
  return state
}
function cast(state: FightState, slot: MoveSlot, side: FightSide = 'player'): FightState {
  const move = moveForSlot(state[side].id, slot)!
  return performAuraAttack({
    state,
    side,
    kind: move.kind,
    variant: move.variant,
    moveId: move.id,
    auraCharged: false,
  })
}
function rested(state: FightState): FightState {
  return {
    ...state,
    hitstop: 0,
    player: { ...state.player, attack: null, aura: 100 },
    opponent: {
      ...state.opponent,
      hitStun: 0,
      blockStun: 0,
      knockdownFrames: 0,
    },
  }
}
function stolen(opponent: FighterId = 'hisoka'): FightState {
  const drained = advance(cast(duel(opponent), 'backSpecial'), 90)
  expect(drained.player.kurapika?.held).not.toBeNull()
  return rested(drained)
}

describe('Kurapika manga chains in the 2D engine', () => {
  it('starts without Emperor Time and toggles with Aura + H for either player', () => {
    const state = duel()
    expect(state.player.kurapika).toEqual(createKurapika())
    const active = performMove({
      state,
      side: 'player',
      action: 'finisher',
      input: { ...EMPTY_INPUT, aura: true },
    })
    expect(active.player.kurapika?.emperorTime).toBe(true)
    expect(active.player.aura).toBe(100)
    expect(active.player.attack).toBeNull()
    const mirrored = {
      ...state,
      player: state.opponent,
      opponent: state.player,
    }
    expect(
      performMove({
        state: mirrored,
        side: 'opponent',
        action: 'finisher',
        input: { ...EMPTY_INPUT, aura: true },
      }).opponent.kurapika?.emperorTime,
    ).toBe(true)
    expect(toggleEmperorTime(active, 'player').player.kurapika?.emperorTime).toBe(false)
  })

  it('charges exactly one hour of lifespan per second, including hitstop, with deterministic time steps', () => {
    const active = toggleEmperorTime(duel(), 'player')
    const held = { ...active, hitstop: 60 }
    expect(advance(held, 60).player.kurapika?.lifespanFrames).toBe(60)
    let chunked = active
    for (let i = 0; i < 10; i++)
      chunked = tickFight(chunked, EMPTY_INPUT, {
        dt: 0.1,
        opponentInput: EMPTY_INPUT,
      })
    expect(chunked.player.kurapika?.lifespanFrames).toBe(60)
    const off = toggleEmperorTime(advance(active, 60), 'player')
    expect(advance(off, 60).player.kurapika?.lifespanFrames).toBe(60)
  })

  it('tracks the three-hour collapse and nine-hour blackout without shortening manga times', () => {
    const active = toggleEmperorTime(duel(), 'player')
    const nearLimit = {
      ...active,
      player: {
        ...active.player,
        kurapika: {
          ...active.player.kurapika!,
          continuousFrames: EMPEROR_BLACKOUT_THRESHOLD - 1,
        },
      },
    }
    const collapsed = advance(nearLimit, 1)
    expect(collapsed.player.kurapika?.blackoutFrames).toBe(EMPEROR_BLACKOUT_FRAMES)
    expect(performAttack(collapsed, 'player', 'light').player.attack).toBeNull()
    expect(advance(collapsed, 20, { ...EMPTY_INPUT, right: true }).player.x).toBe(
      collapsed.player.x,
    )
    expect(advance(collapsed, 20).player.kurapika?.lifespanFrames).toBe(21)
  })

  it('preserves spent lifespan across rounds, and resets chains and activation', () => {
    const active = advance(toggleEmperorTime(duel(), 'player'), 60)
    const next = nextRound({ ...active, phase: 'finished', winner: 'player' })
    expect(next.player.kurapika).toEqual({
      ...createKurapika(),
      lifespanFrames: 60,
    })
    expect(next.opponent.chainJail).toBeUndefined()
  })

  it('holds a Spider immobile in Zetsu beyond three seconds and releases on a second L', () => {
    const bound = advance(cast(duel(), 'neutralSpecial'), 250, EMPTY_INPUT, {
      ...EMPTY_INPUT,
      right: true,
      aura: true,
    })
    expect(bound.opponent.chainJail?.owner).toBe('player')
    expect(bound.opponent.nen.mode).toBe('zetsu')
    expect(bound.opponent.x).toBe(bound.opponent.chainJail?.x)
    expect(performAttack(bound, 'opponent', 'light').opponent.attack).toBeNull()
    const released = performMove({
      state: rested(bound),
      side: 'player',
      action: 'special',
    })
    expect(released.opponent.chainJail).toBeUndefined()
  })

  it('enforces the lethal Chain Jail vow against non-Spiders, including Hisoka, without spending it on unavailable input', () => {
    const state = duel('hisoka')
    expect(canUseMovesetMove(state, 'player', moveForSlot('kurapika', 'neutralSpecial')!)).toBe(
      false,
    )
    const dead = performMove({ state, side: 'player', action: 'special' })
    expect(dead.player.health).toBe(0)
    expect(dead.winner).toBe('opponent')
    const unavailable = { ...state, player: { ...state.player, hitStun: 30 } }
    expect(performMove({ state: unavailable, side: 'player', action: 'special' })).toBe(unavailable)
  })

  it('cannot jail through a guard and releases a jail if the caster loses Nen', () => {
    const guarded = advance(cast(duel(), 'neutralSpecial'), 60, EMPTY_INPUT, {
      ...EMPTY_INPUT,
      guard: true,
    })
    expect(guarded.opponent.chainJail).toBeUndefined()
    const bound = advance(cast(duel(), 'neutralSpecial'), 60)
    const released = advance(bound, 1, {
      ...EMPTY_INPUT,
      aura: true,
      down: true,
    })
    expect(released.opponent.chainJail).toBeUndefined()
  })

  it('heals with the thumb, never hits the opponent, and benefits from Emperor Time efficiency', () => {
    const state = duel()
    state.player.health = 40
    const normal = advance(cast(state, 'downSpecial'), 60)
    expect(normal.player.health).toBe(58)
    expect(normal.opponent.health).toBe(normal.opponent.maxHealth)
    expect(normal.score.player).toBe(0)
    const enhanced = advance(cast(toggleEmperorTime(state, 'player'), 'downSpecial'), 60)
    expect(enhanced.player.health).toBe(70)
    expect(activeHitbox(cast(state, 'downSpecial').player)).toBeNull()
    const full = advance(
      cast(
        {
          ...state,
          player: { ...state.player, health: state.player.maxHealth - 2 },
        },
        'downSpecial',
      ),
      60,
    )
    expect(full.player.health).toBe(full.player.maxHealth)
  })

  it('does not heal an interrupted cast or revive a dead user', () => {
    const state = duel()
    const started = cast({ ...state, player: { ...state.player, health: 40 } }, 'downSpecial')
    const interrupted = {
      ...started,
      player: { ...started.player, attack: null, hitStun: 40 },
    }
    expect(advance(interrupted, 50).player.health).toBe(40)
    const dead = { ...state, player: { ...state.player, health: 0 } }
    expect(cast(dead, 'downSpecial')).toBe(dead)
  })

  it('drains only after syringe contact, steals one technique and disables that technique on the victim', () => {
    const held = stolen()
    expect(held.player.kurapika?.held).toMatchObject({
      source: 'hisoka',
      moveId: 'hisoka:neutralSpecial',
      loaded: false,
    })
    expect(held.opponent.aura).toBeLessThan(18)
    const recovered = {
      ...held,
      opponent: {
        ...held.opponent,
        aura: 100,
        auraExhausted: false,
        nen: { ...held.opponent.nen, mode: 'ten' as const },
      },
    }
    expect(canUseMovesetMove(recovered, 'opponent', moveForSlot('hisoka', 'neutralSpecial')!)).toBe(
      false,
    )
    expect(canUseMovesetMove(recovered, 'opponent', moveForSlot('hisoka', 'standingLight')!)).toBe(
      true,
    )
    const far = duel('hisoka')
    far.opponent.x = 90
    expect(advance(cast(far, 'backSpecial'), 90).player.kurapika?.held).toBeNull()
  })

  it('breaks the draining connection on range loss and does not invent an ability for martial-only fighters', () => {
    const state = duel('hisoka')
    const attached = advance(cast(state, 'backSpecial'), 19)
    const escaped = { ...attached, opponent: { ...attached.opponent, x: 90 } }
    expect(advance(escaped, 80).player.kurapika?.held).toBeNull()
    const martial = advance(cast(duel('theta'), 'backSpecial'), 90)
    expect(martial.opponent.aura).toBeLessThan(18)
    expect(martial.player.kurapika?.held).toBeNull()
  })

  it('requires Emperor Time to load Dolphin, locks it while loaded, and uses Bungee Gum only once', () => {
    const held = stolen()
    expect(cast(held, 'backSpecial')).toBe(held)
    const active = toggleEmperorTime(held, 'player')
    const loaded = cast(active, 'backSpecial')
    expect(loaded.player.kurapika?.held?.loaded).toBe(true)
    expect(toggleEmperorTime(loaded, 'player')).toBe(loaded)
    const used = cast(loaded, 'backSpecial')
    expect(used.player.attack?.moveId).toBe('hisoka:neutralSpecial')
    expect(used.player.attack?.hatsuSource).toBe('hisoka')
    expect(used.player.aura).toBe(
      loaded.player.aura - moveForSlot('hisoka', 'neutralSpecial')!.auraCost,
    )
    const stuck = advance(used, 80)
    expect(stuck.bungeeGum?.owner).toBe('player')
    expect(stuck.player.kurapika?.held?.used).toBe(true)
    expect(toggleEmperorTime(stuck, 'player')).toBe(stuck)
    const dismissed = cast(rested(stuck), 'backSpecial')
    expect(dismissed.bungeeGum).toBeNull()
    expect(dismissed.player.kurapika?.held).toBeNull()
    expect(dismissed.opponent.stolenChainAbility).toBeUndefined()
    expect(toggleEmperorTime(dismissed, 'player').player.kurapika?.emperorTime).toBe(false)
  })

  it('charges lifespan while unconscious with a loaded Dolphin', () => {
    const loaded = cast(toggleEmperorTime(stolen(), 'player'), 'backSpecial')
    loaded.player.kurapika!.blackoutFrames = 100
    const spent = advance(loaded, 60)
    expect(spent.player.kurapika?.lifespanFrames).toBe(60)
    expect(spent.player.kurapika?.held?.loaded).toBe(true)
  })

  it('plants Judgment Chain under Emperor Time without an HP threshold, then kills only on violation', () => {
    const state = duel('hisoka')
    expect(finisherReady(state, 'player')).toBe(false)
    const active = toggleEmperorTime(state, 'player')
    expect(finisherReady(active, 'player')).toBe(true)
    const judged = advance(cast(active, 'finisher'), 70)
    expect(judged.opponent.judgmentChain).toEqual({
      owner: 'player',
      rule: 'zetsu',
    })
    expect(judged.opponent.health).toBe(judged.opponent.maxHealth)
    expect(judged.opponent.nen.mode).toBe('zetsu')
    const off = toggleEmperorTime(rested(judged), 'player')
    expect(advance(off, 30).opponent.judgmentChain).toBeDefined()
    const broken = advance(off, 1, EMPTY_INPUT, { ...EMPTY_INPUT, aura: true })
    expect(broken.opponent.health).toBe(0)
    expect(broken.winner).toBe('player')
    expect(performAttack(off, 'opponent', 'special').winner).toBe('player')
  })

  it('lets a judged opponent move and fight physically, and guards against planting', () => {
    const active = toggleEmperorTime(duel('hisoka'), 'player')
    const blocked = advance(cast(active, 'finisher'), 70, EMPTY_INPUT, {
      ...EMPTY_INPUT,
      guard: true,
    })
    expect(blocked.opponent.judgmentChain).toBeUndefined()
    const judged = advance(cast(active, 'finisher'), 70)
    expect(performAttack(rested(judged), 'opponent', 'light').opponent.attack?.kind).toBe('light')
    expect(
      advance(judged, 10, EMPTY_INPUT, { ...EMPTY_INPUT, right: true }).opponent.x,
    ).toBeGreaterThan(judged.opponent.x)
  })

  it('fires the service pistol with U while leaving the attached chain on forward + L', () => {
    const base = duel('hisoka')
    const started = performAttack({ ...base, opponent: { ...base.opponent, x: 80 } }, 'player', 'ranged')
    expect(started.player.attack).toMatchObject({ kind: 'ranged', hatsuSource: null })
    expect(advance(started, 11).projectiles[0]).toMatchObject({ shape: 'bullet', matter: 'object' })
    const chain = cast(duel('hisoka'), 'forwardSpecial')
    expect(chain.player.attack?.moveId).toBe('kurapika:forwardSpecial')
    expect(advance(chain, 40).projectiles).toHaveLength(0)
  })

  it('catches physical bullets with Dowsing Chain, not aura projectiles', () => {
    const started = cast(duel('hisoka'), 'forwardSpecial')
    started.player.attack!.frame = attackData('special', started.player).startup
    const bullet = {
      id: 1,
      owner: 'opponent' as const,
      fighterId: 'benjamin' as const,
      x: 52,
      y: 6,
      velocityX: -70,
      width: 0.6,
      height: 0.3,
      damage: 5,
      hitstun: 12,
      blockstun: 8,
      hitstop: 3,
      knockback: 1,
      targetZone: 'torso' as const,
      shape: 'bullet' as const,
      colour: '#ffffff',
      age: 0,
      lifetime: 120,
      matter: 'object' as const,
    }
    expect(advanceHatsuFrames({ ...started, projectiles: [bullet] }).projectiles).toHaveLength(0)
    expect(
      advanceHatsuFrames({
        ...started,
        projectiles: [{ ...bullet, matter: 'nen' }],
      }).projectiles,
    ).toHaveLength(1)
  })
  it('seals the stolen Hatsu family while leaving a different ability usable', () => {
    const held = stolen()
    const recovered = {
      ...held,
      opponent: {
        ...held.opponent,
        aura: 100,
        auraExhausted: false,
        nen: { ...held.opponent.nen, mode: 'ten' as const },
      },
    }
    expect(canUseMovesetMove(recovered, 'opponent', moveForSlot('hisoka', 'forwardSpecial')!)).toBe(
      false,
    )
    expect(canUseMovesetMove(recovered, 'opponent', moveForSlot('hisoka', 'downSpecial')!)).toBe(
      true,
    )
  })

  it('retains the original conditions of a stolen ability instead of granting free Pain Packer', () => {
    const loaded = cast(toggleEmperorTime(stolen('feitan'), 'player'), 'backSpecial')
    const refused = cast(loaded, 'backSpecial')
    expect(refused).toBe(loaded)
    expect(refused.player.kurapika?.held?.used).toBe(false)
    expect(toggleEmperorTime(refused, 'player')).toBe(refused)
  })

  it('can use and voluntarily end a borrowed Hanzo double without receiving physical ammunition', () => {
    const loaded = cast(toggleEmperorTime(stolen('hanzo'), 'player'), 'backSpecial')
    const projected = advance(cast(loaded, 'backSpecial'), 40)
    expect(projected.player.id).toBe('kurapika')
    expect(projected.player.hanzoProjection).toBeDefined()
    const grounded = rested(projected)
    expect(cast(grounded, 'finisher')).toBe(grounded)
    const returned = advance(cast(rested(projected), 'backSpecial'), 1)
    expect(returned.player.hanzoProjection).toBeUndefined()
    expect(returned.player.kurapika?.held).toBeNull()
    expect(returned.opponent.stolenChainAbility).toBeUndefined()
  })

  it('keeps a jailed target anchored even if the caster walks into its pushbox', () => {
    const bound = advance(cast(duel(), 'neutralSpecial'), 60)
    const pressed = {
      ...bound,
      player: { ...bound.player, x: bound.opponent.x - 0.2 },
    }
    const stable = advance(pressed, 10, { ...EMPTY_INPUT, right: true })
    expect(stable.opponent.x).toBe(stable.opponent.chainJail?.x)
  })

  it('does not mistake a real gunshot without Nen for a Judgment violation', () => {
    const active = toggleEmperorTime(duel('benjamin'), 'player')
    const judged = advance(cast(active, 'finisher'), 70)
    const fired = performAttack(judged, 'opponent', 'ranged')
    expect(fired.phase).toBe('fighting')
    expect(fired.opponent.attack?.kind).toBe('ranged')
    expect(fired.opponent.health).toBe(fired.opponent.maxHealth)
  })
})
