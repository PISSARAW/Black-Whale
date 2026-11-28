import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from './engine'
import { canUseFightHatsu } from './hatsu'
import { applyAuraContext, nenAttackFactor, nenTacticalState } from './nen'
import {
  advanceOn,
  ON_BLOCKED_BURN,
  ON_KEN_BURN,
  ON_OATH_GRUDGE,
  ON_RAGE_GRUDGE,
  ON_SEAL_FRAMES,
  onRageReady,
  resolveOnImpacts,
} from './onTechnique'
import { EMPTY_INPUT, type ArcadeFighter, type FightState } from './types'

const OATH = { ...EMPTY_INPUT, aura: true, hatsu: true }

function duel(): FightState {
  const state = beginFight(createFight('benjamin', 'morena'))
  return {
    ...state,
    player: { ...state.player, x: 46, aura: 80 },
    opponent: { ...state.opponent, x: 52 },
  }
}

function withGrudge(fighter: ArcadeFighter, grudge: number): ArcadeFighter {
  return { ...fighter, on: { grudge, sealFrames: 0 } }
}

function sworn(fighter: ArcadeFighter, grudge = 80): ArcadeFighter {
  return applyAuraContext(withGrudge(fighter, grudge), OATH)
}

function advance(state: FightState, seconds: number, input = EMPTY_INPUT) {
  let next = state
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.02) next = tickFight(next, input, 0.02)
  return next
}

function advanceControlled(
  state: FightState,
  frames: number,
  opponentInput = EMPTY_INPUT,
): FightState {
  let next = state
  for (let frame = 0; frame < frames && next.phase === 'fighting'; frame += 1) {
    next = tickFight(next, EMPTY_INPUT, { dt: 0.02, opponentInput })
  }
  return next
}

describe('On (The Last Mission)', () => {
  it('banks grudge from damage taken, never from aura', () => {
    const state = duel()
    const struck = advance(performAttack(state, 'player', 'heavy'), 0.24)
    const lost = state.opponent.health - struck.opponent.health
    expect(lost).toBeGreaterThan(0)
    expect(struck.opponent.on?.grudge).toBeCloseTo(lost * 2)
    expect(struck.player.on?.grudge ?? 0).toBe(0)
  })

  it('needs a ripe grudge before Aura + Hatsu swears the contract', () => {
    const fighter = duel().player
    expect(applyAuraContext(withGrudge(fighter, ON_OATH_GRUDGE - 1), OATH).nen.on).toBe(false)
    const oath = sworn(fighter, ON_OATH_GRUDGE)
    expect(oath.nen.on).toBe(true)
    expect(oath.nen.mode).toBe('ren')
    expect(nenTacticalState(oath).technique).toBe('on')
  })

  it('cannot be dropped at will and seals the user own Nen', () => {
    const oath = sworn(duel().player)
    expect(applyAuraContext(oath, EMPTY_INPUT).nen.on).toBe(true)
    expect(applyAuraContext(oath, { ...EMPTY_INPUT, aura: true, guard: true }).nen.ken).toBe(false)
    expect(canUseFightHatsu(oath)).toBe(false)
  })

  it('strikes harder than Ren and costs life instead of aura', () => {
    const fighter = duel().player
    const ren = applyAuraContext(fighter, { ...EMPTY_INPUT, aura: true })
    const oath = sworn(fighter)
    expect(nenAttackFactor(oath, 'heavy')).toBeGreaterThan(nenAttackFactor(ren, 'heavy'))
    let burning = oath
    for (let frame = 0; frame < 60; frame += 1) burning = advanceOn(burning)
    expect(burning.health).toBeCloseTo(oath.health - 2.5)
    expect(burning.aura).toBe(oath.aura)
    expect(burning.on!.grudge).toBeCloseTo(71)
  })

  it('never kills its own user', () => {
    let burning = { ...sworn(duel().player, 100), health: 1.5 }
    for (let frame = 0; frame < 120; frame += 1) burning = advanceOn(burning)
    expect(burning.health).toBe(1)
  })

  it('collapses into exhausted Zetsu once the grudge is spent', () => {
    let burning = sworn(duel().player, ON_OATH_GRUDGE)
    for (let frame = 0; frame < 60 * 6; frame += 1) burning = advanceOn(burning)
    expect(burning.nen.on).toBe(false)
    expect(burning.nen.mode).toBe('zetsu')
    expect(burning.auraExhausted).toBe(true)
  })

  it('seals the victim Hatsu on a clean blow', () => {
    const state = duel()
    const before = { ...state, player: sworn(state.player) }
    const impact = {
      ...(advance(performAttack(state, 'player', 'heavy'), 0.24).impact as NonNullable<
        FightState['impact']
      >),
      blocked: false,
      avoided: false,
    }
    const struck = resolveOnImpacts(before, { ...before, impact })
    expect(struck.opponent.on?.sealFrames).toBe(ON_SEAL_FRAMES)
    expect(canUseFightHatsu({ ...struck.opponent, aura: 100 })).toBe(false)
  })

  it('loses grudge for real when the guard holds through the engine', () => {
    const state = duel()
    const armed = performAttack({ ...state, player: sworn(state.player, 80) }, 'player', 'heavy')
    const guarded = advanceControlled(armed, 14, { ...EMPTY_INPUT, guard: true })
    expect(guarded.impact?.blocked).toBe(true)
    expect(guarded.player.nen.on).toBe(true)
    expect(guarded.player.on!.grudge).toBeLessThan(80 - ON_BLOCKED_BURN)
  })

  it('burns grudge on every guarded blow, Ken twice as fast (Netero)', () => {
    const state = duel()
    const before = { ...state, player: sworn(state.player, 80) }
    const impact = {
      ...(advance(performAttack(state, 'player', 'heavy'), 0.24).impact as NonNullable<
        FightState['impact']
      >),
      blocked: true,
      avoided: false,
    }
    const guarded = resolveOnImpacts(before, { ...before, impact })
    expect(guarded.player.on!.grudge).toBe(80 - ON_BLOCKED_BURN)
    const kenBefore = {
      ...before,
      opponent: { ...before.opponent, nen: { ...before.opponent.nen, ken: true } },
    }
    const kenned = resolveOnImpacts(kenBefore, { ...kenBefore, impact })
    expect(kenned.player.on!.grudge).toBe(80 - ON_KEN_BURN)
  })

  it('turns one clean heavy into a lethal rage strike below 20% health', () => {
    const state = duel()
    const rage = {
      ...state,
      player: { ...sworn(state.player, ON_RAGE_GRUDGE + 20), health: 59 },
    }
    expect(onRageReady(rage.player)).toBe(true)

    const struck = advanceControlled(performAttack(rage, 'player', 'heavy'), 50)

    expect(struck.impact?.onRage).toBe(true)
    expect(struck.opponent.health).toBe(0)
    expect(struck.player.on?.grudge).toBe(0)
    expect(struck.player.nen.on).toBe(false)
  })

  it('does not spend last-health rage on a light hit or through guard', () => {
    const state = duel()
    const rage = {
      ...state,
      player: { ...sworn(state.player, ON_RAGE_GRUDGE + 20), health: 59 },
    }
    const light = advanceControlled(performAttack(rage, 'player', 'light'), 30)
    expect(light.impact?.onRage).toBe(false)
    expect(light.opponent.health).toBeGreaterThan(0)

    const guarded = advanceControlled(performAttack(rage, 'player', 'heavy'), 50, {
      ...EMPTY_INPUT,
      guard: true,
    })
    expect(guarded.impact?.blocked).toBe(true)
    expect(guarded.impact?.onRage).toBe(false)
    expect(guarded.opponent.health).toBeGreaterThan(0)
  })

  it('opens rage strictly below, not at, 20% health', () => {
    const state = duel()
    expect(onRageReady({ ...sworn(state.player), health: 60 })).toBe(false)
    expect(onRageReady({ ...sworn(state.player), health: 59.9 })).toBe(true)
  })

  it('is sworn by the CPU when cornered with a ripe grudge', () => {
    const state = duel()
    const cornered = {
      ...state,
      opponent: { ...withGrudge(state.opponent, 70), health: 40, x: 80 },
    }
    const next = tickFight(cornered, EMPTY_INPUT, { dt: 0.02, ai: true })
    let planned = next
    for (let step = 0; step < 120 && !planned.opponent.nen.on; step += 1) {
      planned = tickFight(planned, EMPTY_INPUT, { dt: 0.02, ai: true })
    }
    expect(planned.opponent.nen.on).toBe(true)
  })
})
