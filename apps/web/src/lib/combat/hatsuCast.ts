import type { Vec2 } from '../tour/types'
import { resolveNamedHatsu } from './hatsu'
import { strike } from './exchange'
import { distance, HATSU_COST, replace } from './fighter'
import {
  otherSide,
  type ArenaHatsuEffect,
  type BodyZone,
  type CombatSide,
  type CombatState,
} from './types'

/** The complete Hatsu command consumed by the deterministic caster. */
export interface HatsuCast {
  side: CombatSide
  effect: ArenaHatsuEffect
  zone: BodyZone
  hatsuId?: string
  targetAt?: Vec2
  cost?: number
}

export function prepareHatsu(
  state: CombatState,
  side: CombatSide,
  hatsuId: 'parallel-future' | 'rihan-predator',
): CombatState {
  const fighter = state[side]
  if (capturedAbility(state, side, hatsuId)) return state
  if (fighter.condition !== 'ready' || fighter.cooldown > 0) return state
  if (hatsuId === 'parallel-future') {
    if (fighter.mode !== 'zetsu') return state
    return replace(state, side, {
      ...fighter,
      hatsuPreparation: {
        id: hatsuId,
        observations: 1,
        targetHatsuId: null,
        expiresAt: state.clock + 2,
      },
      movement: [0, 0],
      cooldown: 0.35,
    })
  }
  const targetHatsuId = state.lastHatsuBySide[otherSide(side)]
  if (!targetHatsuId) return state
  const previous = fighter.hatsuPreparation
  const observations =
    previous?.id === hatsuId && previous.targetHatsuId === targetHatsuId
      ? previous.observations + 1
      : 1
  return replace(state, side, {
    ...fighter,
    hatsuPreparation: {
      id: hatsuId,
      observations,
      targetHatsuId,
      expiresAt: state.clock + 20,
    },
    cooldown: 0.25,
  })
}

function capturedAbility(
  state: CombatState,
  side: CombatSide,
  hatsuId: string | undefined,
): boolean {
  if (!hatsuId) return false
  return state.nenEffects.some(
    (effect) =>
      effect.kind === 'CAPTURED_ABILITY' && effect.target === side && effect.detail === hatsuId,
  )
}

export function castHatsu(
  state: CombatState,
  { side, effect, zone, hatsuId, targetAt, cost: requestedCost }: HatsuCast,
): CombatState {
  const fighter = state[side]
  if (capturedAbility(state, side, hatsuId)) return state
  if (!prepared(state, side, hatsuId)) return state
  const sequenceCost = requestedCost ?? sequenceAuraCost(hatsuId)
  if (!canCast(fighter, hatsuId, sequenceCost)) return state
  const paid = {
    ...fighter,
    aura: fighter.aura - sequenceCost,
    intent: null,
    hatsuPreparation: null,
  }
  const current = {
    ...replace(state, side, paid),
    lastHatsuBySide: { ...state.lastHatsuBySide, [side]: hatsuId ?? null },
  }
  const rivalSide = otherSide(side)
  const core = castCore({
    state,
    current,
    side,
    effect,
    zone,
    hatsuId,
    targetAt,
    paid,
    rivalSide,
    fighter,
  })
  if (core) return core
  return castEffect({ state, current, side, effect, zone, hatsuId, paid, rivalSide })
}

interface CastContext extends HatsuCast {
  state: CombatState
  current: CombatState
  paid: CombatState['player']
  rivalSide: CombatSide
  fighter: CombatState['player']
}

function castCore(context: CastContext): CombatState | null {
  const { state, current, side, zone, hatsuId, targetAt, paid, rivalSide, fighter } = context
  if (sequenced(hatsuId)) return castSequence(current, { side, zone, hatsuId, paid }, fighter)
  if (hatsuId === 'double-machine-gun')
    return strike({ state: current, side, zone, technique: 'hatsu', power: 0.95, range: 9 })
  return hatsuId === 'bungee-gum'
    ? castBungee({ state, current, side, targetAt, paid, rivalSide })
    : null
}

function castEffect(context: Omit<CastContext, 'fighter' | 'targetAt' | 'cost'>): CombatState {
  const { state, current, side, effect, zone, hatsuId, paid, rivalSide } = context
  const specialized = resolveNamedHatsu(current, { side, zone, hatsuId, paid })
  if (specialized) return specialized
  if (effect === 'bind') return castBind({ state, current, side, rivalSide, paid })
  if (effect === 'restore')
    return replace(current, side, {
      ...paid,
      aura: Math.min(paid.capacity, paid.aura + 42),
      condition: 'ready',
      recovery: 0,
      cooldown: 2.2,
    })
  if (effect === 'enhance') return replace(current, side, { ...paid, empowered: 5, cooldown: 0.8 })
  return strike({
    state: current,
    side,
    zone,
    technique: 'hatsu',
    power: effect === 'impact' ? 1.65 : 0.82,
    range: effect === 'barrage' ? 9 : 2.7,
  })
}

function prepared(state: CombatState, side: CombatSide, hatsuId?: string): boolean {
  const preparation = state[side].hatsuPreparation
  if (hatsuId === 'parallel-future')
    return Boolean(
      state[side].mode === 'zetsu' &&
      preparation?.id === hatsuId &&
      preparation.expiresAt >= state.clock,
    )
  if (hatsuId !== 'rihan-predator') return true
  return Boolean(
    preparation?.id === hatsuId &&
    preparation.observations >= 3 &&
    preparation.expiresAt >= state.clock,
  )
}

function canCast(fighter: CombatState['player'], hatsuId: string | undefined, cost: number) {
  return (
    (fighter.condition === 'ready' || hatsuId === 'cats-name') &&
    fighter.cooldown <= 0 &&
    fighter.aura >= cost
  )
}

function sequenceAuraCost(hatsuId?: string): number {
  return sequenced(hatsuId) ? 6 : HATSU_COST
}

function sequenced(hatsuId?: string): boolean {
  return hatsuId === 'ripper-cyclotron' || hatsuId === 'battle-cantabile-jupiter'
}

function castSequence(
  state: CombatState,
  cast: Pick<HatsuCast, 'side' | 'zone' | 'hatsuId'> & { paid: CombatState['player'] },
  before: CombatState['player'],
): CombatState {
  const previous = before.hatsuSequence
  const continuous = Boolean(
    previous && previous.id === cast.hatsuId && state.clock - previous.lastAt <= 1.2,
  )
  const count = continuous && previous ? previous.count + 1 : 1
  if (count < 3)
    return replace(state, cast.side, {
      ...cast.paid,
      hatsuSequence: { id: cast.hatsuId!, count, lastAt: state.clock },
      cooldown: 0.2,
    })
  const ready = replace(state, cast.side, { ...cast.paid, hatsuSequence: null })
  return strike({
    state: ready,
    side: cast.side,
    zone: cast.zone,
    technique: 'hatsu',
    power: cast.hatsuId === 'ripper-cyclotron' ? 2.2 : 1.9,
    range: cast.hatsuId === 'ripper-cyclotron' ? 2.4 : 4.5,
  })
}

function castBungee(options: {
  state: CombatState
  current: CombatState
  side: CombatSide
  targetAt?: Vec2
  paid: CombatState['player']
  rivalSide: CombatSide
}): CombatState {
  const { state, current, side, targetAt, paid, rivalSide } = options
  const anchor = targetAt ?? state[rivalSide].position
  const subject = targetAt ? side : rivalSide
  const gap = distance(state[subject].position, anchor)
  if (gap > 10) return state
  return {
    ...replace(current, side, { ...paid, cooldown: 0.8 }),
    tethers: [
      ...state.tethers.filter((tether) => tether.owner !== side),
      {
        id: `bungee-${side}`,
        owner: side,
        subject,
        anchor: targetAt ?? null,
        restLength: Math.max(0.8, gap * 0.6),
        remaining: 8,
      },
    ],
  }
}

function castBind(options: {
  state: CombatState
  current: CombatState
  side: CombatSide
  rivalSide: CombatSide
  paid: CombatState['player']
}): CombatState {
  const { state, current, side, rivalSide, paid } = options
  if (distance(state[side].position, state[rivalSide].position) > 7) return state
  const caster = replace(current, side, { ...paid, cooldown: 1.1 })
  return replace(caster, rivalSide, {
    ...caster[rivalSide],
    bound: 1.6,
    movement: [0, 0],
    intent: null,
  })
}
