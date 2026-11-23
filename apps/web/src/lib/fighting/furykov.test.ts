import { describe, expect, it } from 'vitest'
import { beginFight, createFight, nextRound, performMove, tickFight } from './engine'
import { observeComboMaster } from './comboMaster'
import { COMBO_MASTER_MOVE } from './comboMasterTypes'
import { resolveFightImpacts } from './combatImpact'
import { activeHitbox, attackData, otherSide } from './frameData'
import { hatsuAvoidsImpact, hatsuDamageFactor, hatsuDefenceFactor, hatsuSourceFor } from './hatsu'
import { IN_CHARGE_FRAMES } from './nen'
import { bungeeVisible } from './hisokaTechnique'
import { canUseMovesetMove, moveForSlot } from './movesets'
import type { ProjectileHit } from './projectiles'
import { EMPTY_INPUT, type FightProjectile, type FightSide, type FightState } from './types'

function duel(owner: FightSide = 'player'): FightState {
  const state = beginFight(
    createFight(
      owner === 'player' ? 'furykov' : 'hisoka',
      owner === 'opponent' ? 'furykov' : 'hisoka',
      { formatId: 'knockout', mode: 'versus-local' },
    ),
  )
  return {
    ...state,
    player: { ...state.player, x: 42, aura: 100 },
    opponent: { ...state.opponent, x: 48, aura: 100 },
  }
}

function open(state: FightState, side: FightSide = 'player'): FightState {
  return performMove({ state, side, action: 'special' })
}

function concealed(state: FightState, attacker: FightSide = 'opponent'): FightState {
  return performMove({
    state: {
      ...state,
      [attacker]: { ...state[attacker], hatsuChargeFrames: IN_CHARGE_FRAMES, aura: 100 },
    },
    side: attacker,
    action: 'special',
  })
}

function projectile(state: FightState, patch: Partial<FightProjectile> = {}): FightProjectile {
  return {
    id: 1,
    owner: 'opponent',
    fighterId: state.opponent.id,
    x: 48,
    y: 7,
    velocityX: -70,
    width: 0.6,
    height: 0.3,
    damage: 9,
    hitstun: 13,
    blockstun: 8,
    hitstop: 5,
    knockback: 2,
    targetZone: 'torso',
    shape: 'bullet',
    colour: '#fff',
    matter: 'nen',
    concealed: true,
    age: 0,
    lifetime: 120,
    ...patch,
  }
}

function step(state: FightState, count: number): FightState {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

describe('Furykov — Combo Master alert', () => {
  it('opens a usable console without an activation hit, lunge or buff', () => {
    const ready = duel()
    const armed = open(ready)
    expect(armed.player.comboMaster).toEqual({ alert: null })
    expect(armed.player.x).toBe(ready.player.x)
    expect(armed.player.aura).toBe(60)
    const active = {
      ...armed.player,
      attack: { ...armed.player.attack!, frame: attackData('special', armed.player).startup },
    }
    expect(activeHitbox(active)).toBeNull()
    const elapsed = step(armed, 60)
    expect(elapsed.impact).toBeNull()
    expect(elapsed.score).toEqual({ player: 0, opponent: 0 })
    expect(elapsed.opponent.health).toBe(ready.opponent.health)
    expect(elapsed.player.health).toBe(ready.player.health)
    expect(hatsuAvoidsImpact(elapsed.player)).toBe(false)
    expect(hatsuDamageFactor(elapsed.player)).toBe(1)
    expect(hatsuDefenceFactor(elapsed.player)).toBe(1)
    expect(canUseMovesetMove(elapsed, 'player', moveForSlot('furykov', 'neutralSpecial')!)).toBe(
      false,
    )
  })

  it.each(['player', 'opponent'] as const)(
    'alerts immediately on a committed concealed attack before contact (%s)',
    (owner) => {
      const ready = open(duel(owner), owner)
      const enemy = otherSide(owner)
      const next = concealed(ready, enemy)
      expect(next[enemy].attack).toMatchObject({ frame: 0, concealed: true })
      expect(next[owner].comboMaster?.alert).toEqual({
        incoming: true,
        signature: null,
        affected: [],
      })
      expect(next.frame).toBe(ready.frame)
      expect(next[owner].health).toBe(ready[owner].health)
      expect(next.impact).toBeNull()
    },
  )

  it('requires a console and ignores ordinary or visible attacks', () => {
    const closed = concealed(duel())
    expect(closed.player.comboMaster).toBeUndefined()
    const opened = open(duel())
    const visible = performMove({ state: opened, side: 'opponent', action: 'special' })
    expect(visible.opponent.attack?.concealed).toBe(false)
    expect(visible.player.comboMaster?.alert).toBeNull()
    const physical = {
      ...concealed(opened),
      opponent: { ...closed.opponent, attack: { ...closed.opponent.attack!, hatsuSource: null } },
    }
    expect(observeComboMaster(physical).player.comboMaster?.alert).toBeNull()
  })

  it('also warns when opening the console after the hidden attack has started', () => {
    const next = open(concealed(duel()))
    expect(next.player.comboMaster?.alert?.incoming).toBe(true)
  })

  it('never predicts a buffered action or an attack aimed away from the owner', () => {
    const ready = open(duel())
    const queued = {
      ...ready,
      opponent: {
        ...ready.opponent,
        hitStun: 5,
        bufferedAttack: {
          kind: 'special' as const,
          moveId: 'hisoka:neutralSpecial',
          auraCharged: false,
          concealed: true,
          hatsuSource: 'hisoka' as const,
        },
      },
    }
    expect(queued.opponent.bufferedAttack).not.toBeNull()
    expect(queued.opponent.attack).toBeNull()
    expect(queued.player.comboMaster?.alert).toBeNull()
    const committed = concealed(ready)
    committed.opponent.facing = 1
    expect(observeComboMaster(committed).player.comboMaster?.alert).toBeNull()
  })

  it.each(['impacted', 'recovery', 'cancelled'] as const)(
    'clears the warning when the threat is no longer live: %s',
    (reason) => {
      const state = concealed(open(duel()))
      if (reason === 'impacted') state.opponent.attack!.impacted = true
      if (reason === 'recovery') {
        const frames = attackData('special', state.opponent)
        state.opponent.attack!.frame = frames.startup + frames.active
      }
      if (reason === 'cancelled') state.opponent.attack = null
      expect(observeComboMaster(state).player.comboMaster?.alert).toBeNull()
    },
  )

  it('keeps unreadable signatures unknown; Gyo reads them without dispelling In', () => {
    const state = concealed(open(duel()))
    expect(state.player.comboMaster?.alert?.signature).toBeNull()
    state.player.nen.gyo = true
    const next = observeComboMaster(state)
    expect(next.player.comboMaster?.alert?.signature).toBe('hisoka')
    expect(next.opponent.attack?.concealed).toBe(true)
    expect(next.opponent.nen.in).toBe(state.opponent.nen.in)
  })

  it('lists only confirmed affected people, never the caster or predicted recipients', () => {
    const ready = open(duel())
    const state: FightState = {
      ...ready,
      bungeeGum: { owner: 'opponent', target: 'player', hidden: true, retracting: false },
    }
    const next = observeComboMaster(state)
    expect(next.player.comboMaster?.alert).toEqual({
      incoming: false,
      signature: null,
      affected: ['player'],
    })
    expect(next.bungeeGum).toBe(state.bungeeGum)
    expect(bungeeVisible(next, 'player')).toBe(false)
    const unrelated: FightState = {
      ...state,
      bungeeGum: { owner: 'player', target: 'opponent', hidden: true, retracting: false },
    }
    expect(observeComboMaster(unrelated).player.comboMaster?.alert).toBeNull()
  })

  it('reports travelling concealed Nen in the target’s lane', () => {
    const ready = open(duel())
    const state = { ...ready, projectiles: [projectile(ready)] }
    const next = observeComboMaster(state)
    expect(next.player.comboMaster?.alert?.incoming).toBe(true)
    expect(next.projectiles).toBe(state.projectiles)
  })

  it.each([
    { matter: 'object' as const },
    { concealed: false },
    { owner: 'player' as const },
    { velocityX: 70 },
    { y: 99 },
    { age: 120 },
  ])('does not alarm for an irrelevant projectile: %j', (patch) => {
    const ready = open(duel())
    const next = observeComboMaster({ ...ready, projectiles: [projectile(ready, patch)] })
    expect(next.player.comboMaster?.alert).toBeNull()
  })

  it('warns on an imminent projectile without consuming it or avoiding its damage', () => {
    const ready = open(duel())
    const hit: ProjectileHit = {
      projectile: projectile(ready),
      defenderSide: 'player',
      position: { x: 42, y: 7 },
    }
    const control = resolveFightImpacts(
      { ...ready, player: { ...ready.player, comboMaster: undefined } },
      [hit],
    )
    const warned = resolveFightImpacts(ready, [hit])
    expect(warned.player.comboMaster?.alert?.incoming).toBe(true)
    expect(warned.player.health).toBe(control.player.health)
    expect(warned.player.hitStun).toBe(control.player.hitStun)
    expect(warned.player.x).toBe(control.player.x)
    expect(warned.score).toEqual(control.score)
    expect(warned.impact).toEqual(control.impact)
    expect(warned.impact?.avoided).toBe(false)
    expect(warned.player.health).toBeLessThan(ready.player.health)
  })

  it('does not modify the damage, guard, stun or hidden attachment of a concealed hit', () => {
    const ready = concealed(open(duel()))
    ready.opponent.attack!.frame = attackData('special', ready.opponent).startup
    const control = resolveFightImpacts(
      { ...ready, player: { ...ready.player, comboMaster: undefined } },
      [],
    )
    const warned = resolveFightImpacts(ready, [])
    expect(warned.player.health).toBe(control.player.health)
    expect(warned.player.hitStun).toBe(control.player.hitStun)
    expect(warned.player.blocking).toBe(control.player.blocking)
    expect(warned.player.wakeupInvulnerableFrames).toBe(control.player.wakeupInvulnerableFrames)
    expect(warned.impact).toEqual(control.impact)
    expect(warned.bungeeGum).toEqual(control.bungeeGum)
    expect(warned.bungeeGum?.hidden).toBe(true)
  })

  it.each(['zetsu', 'forced-zetsu', 'stolen', 'chain', 'on', 'exhausted', 'dead'] as const)(
    'dismisses the console when Nen is unavailable: %s',
    (reason) => {
      const state = concealed(open(duel()))
      if (reason === 'zetsu') state.player.nen.mode = 'zetsu'
      if (reason === 'forced-zetsu') state.player.hatsuEffects.forcedZetsuFrames = 1
      if (reason === 'stolen') state.player.hatsuEffects.hatsuStolen = 1
      if (reason === 'chain')
        state.player.stolenChainAbility = { owner: 'opponent', moveId: COMBO_MASTER_MOVE }
      if (reason === 'on') state.player.on = { grudge: 0, sealFrames: 1 }
      if (reason === 'exhausted') state.player.auraExhausted = true
      if (reason === 'dead') state.player.health = 0
      expect(observeComboMaster(state).player.comboMaster).toBeUndefined()
    },
  )

  it('cannot conjure the console without aura or while stunned', () => {
    const state = duel()
    state.player.aura = 0
    expect(open(state).player.comboMaster).toBeUndefined()
    state.player.aura = 100
    state.player.hitStun = 10
    const queued = open(state)
    expect(queued.player.comboMaster).toBeUndefined()
    expect(queued.player.aura).toBe(100)
  })

  it('continues an automatic warning during ordinary hitstun without releasing it', () => {
    const state = concealed(open(duel()))
    state.player.hitStun = 10
    const next = observeComboMaster(state)
    expect(next.player.comboMaster?.alert).not.toBeNull()
    expect(next.player.hitStun).toBe(10)
  })

  it('keeps directional specials martial instead of turning them into Combo Master attacks', () => {
    const state = duel()
    expect(hatsuSourceFor(state.player, COMBO_MASTER_MOVE)).toBe('furykov')
    expect(hatsuSourceFor(state.player, 'furykov:forwardSpecial')).toBeNull()
    const punched = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, right: true },
    })
    expect(punched.player.comboMaster).toBeUndefined()
    expect(punched.player.attack?.hatsuSource).toBeNull()
  })

  it('gives a copied console the same limits and closes it when its page is lost', () => {
    const state = duel()
    state.player.id = 'chrollo'
    state.player.chrolloBook = {
      pages: ['furykov', 'black-voice'],
      page: 0,
      bookmark: null,
      open: true,
    }
    const next = concealed(open(state))
    expect(next.player.comboMaster?.alert?.incoming).toBe(true)
    expect(hatsuAvoidsImpact(next.player)).toBe(false)
    next.player.chrolloBook!.page = 1
    expect(observeComboMaster(next).player.comboMaster).toBeUndefined()
  })

  it('resets the console between rounds and does not decode or fabricate during the duel', () => {
    const ready = open(duel())
    const elapsed = step(ready, 120)
    expect(elapsed.player.comboMaster).toEqual({ alert: null })
    const reset = nextRound({ ...elapsed, phase: 'finished', winner: 'player' })
    expect(reset.player.comboMaster).toBeUndefined()
    expect(reset.opponent.comboMaster).toBeUndefined()
  })

  it('does not change deterministic state on repeated identical observations', () => {
    const ready = concealed(open(duel()))
    expect(observeComboMaster(ready)).toBe(ready)
  })
})
