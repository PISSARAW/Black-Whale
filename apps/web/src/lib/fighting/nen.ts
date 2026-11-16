import {
  createNenTechniqueState,
  nenDefenceFactor,
  transitionNen,
  type NenTechniqueAction,
} from '@black-whale/nen-engine'
import { attackData } from './frameData'
import { advanceOn, applyOnContext, ON_ATTACK_BONUS } from './onTechnique'
import type { ArcadeFighter, AttackKind, FightInput, FightNenZone } from './types'

export const KO_COST = 20
export const EXHAUSTION_RELEASE_AURA = 18
export const IN_CHARGE_FRAMES = 24
export const FIGHT_NEN_ZONES = ['head', 'torso', 'hands', 'feet'] as const

export type FightNenTactic = 'ten' | 'ren' | 'zetsu' | 'gyo' | 'ken' | 'ryu' | 'ko' | 'on'

export interface FightNenTacticalState {
  technique: FightNenTactic
  auraPerSecond: number
  focusZone: FightNenZone | null
  focusShare: number
  distribution: Record<FightNenZone, number>
  exposedZones: FightNenZone[]
  exhausted: boolean
}

export function createFightingNen() {
  return createNenTechniqueState<FightNenZone>()
}

/** One held Aura input, interpreted from the physical context. */
export function applyAuraContext(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  const sworn = applyOnContext(fighter, input)
  if (sworn) return sworn
  if (fighter.auraExhausted) return withAction(fighter, { type: 'ZETSU' })

  if (!input.aura) {
    const released = commitKoOnRelease(fighter)
    if (released !== fighter) return released
    if (holdsRyu(released)) return released
    return withAction(released, { type: 'TEN' })
  }

  if (input.down) return withAction(fighter, { type: 'ZETSU' })
  if (input.guard) return withAction(fighter, { type: 'KEN', on: true })
  if (input.jump) {
    const ten = withAction(fighter, { type: 'TEN' })
    return withAction(ten, { type: 'GYO', on: true })
  }
  return withAction(fighter, { type: 'REN' })
}

function holdsRyu(fighter: ArcadeFighter): boolean {
  return (
    Boolean(fighter.nen.ko) ||
    (hasRyu(fighter) && (fighter.attack !== null || fighter.ryuWindow > 0))
  )
}

function commitKoOnRelease(fighter: ArcadeFighter): ArcadeFighter {
  if (!fighter.attack?.auraCharged || fighter.attack.impacted || fighter.nen.ko) return fighter
  if (fighter.aura < KO_COST) {
    return {
      ...withAction(fighter, { type: 'TEN' }),
      attack: { ...fighter.attack, auraCharged: false },
    }
  }
  const zone = attackData(fighter.attack.kind, fighter).auraZone
  const focused = withAction(withAction(fighter, { type: 'TEN' }), { type: 'KO', zone })
  return {
    ...focused,
    aura: fighter.aura - KO_COST,
    attack: { ...fighter.attack, auraCharged: false },
  }
}

export function advanceNen(fighter: ArcadeFighter, dt: number): ArcadeFighter {
  const aura = Math.max(0, Math.min(100, fighter.aura + auraFlowRate(fighter) * dt))
  const depleted = fighter.auraExhausted || aura === 0
  const auraExhausted = depleted && aura < EXHAUSTION_RELEASE_AURA
  const next = { ...fighter, aura, auraExhausted }
  return advanceOn(auraExhausted ? withAction(next, { type: 'ZETSU' }) : next)
}

export function auraFlowRate(fighter: ArcadeFighter): number {
  if (fighter.nen.on) return 0
  if (fighter.nen.mode === 'zetsu') return 10
  if (fighter.nen.ken) return -8
  if (fighter.nen.gyo) return -2.4
  if (fighter.nen.mode === 'ren') return -4
  return 1.4
}

export function focusGuardRyu(fighter: ArcadeFighter, zone: FightNenZone): ArcadeFighter {
  const otherZones = (['head', 'torso', 'hands', 'feet'] as const).filter(
    (candidate) => candidate !== zone,
  )
  const distribution: Partial<Record<FightNenZone, number>> = { [zone]: 76 }
  for (const other of otherZones) distribution[other] = 8
  return { ...withAction(fighter, { type: 'RYU', distribution }), ryuWindow: 9 }
}

export function focusAttackRyu(fighter: ArcadeFighter, kind: AttackKind): ArcadeFighter {
  const zone = attackData(kind, fighter).auraZone
  const distribution: Partial<Record<FightNenZone, number>> = {
    head: 8,
    torso: 12,
    hands: 8,
    feet: 8,
    [zone]: 72,
  }
  return withAction(fighter, { type: 'RYU', distribution })
}

export function releaseFocusedAura(fighter: ArcadeFighter): ArcadeFighter {
  if (!fighter.nen.ko && !hasRyu(fighter)) return fighter
  return withAction(fighter, { type: 'TEN' })
}

export function setIn(fighter: ArcadeFighter, on: boolean): ArcadeFighter {
  if (fighter.nen.mode === 'zetsu') return fighter
  return withAction(fighter, { type: 'IN', on })
}

export function forceZetsu(fighter: ArcadeFighter): ArcadeFighter {
  return withAction(fighter, { type: 'ZETSU' })
}

export function nenAttackFactor(fighter: ArcadeFighter, kind: AttackKind): number {
  if (fighter.nen.mode === 'zetsu') return 0.7
  let factor = fighter.nen.mode === 'ren' ? 1.22 : 1
  const zone = attackData(kind, fighter).auraZone
  const share = Number(fighter.nen.ryu[zone] ?? 0)
  if (share > 0) factor += share * 0.48
  if (fighter.nen.ko) factor += 0.82
  if (fighter.nen.on) factor += ON_ATTACK_BONUS
  return factor
}

export function nenDamageFactor(fighter: ArcadeFighter, zone: FightNenZone): number {
  const defence = nenDefenceFactor(fighter.nen, zone)
  let factor = 1 + (0.35 - defence) * 0.7
  if (fighter.nen.mode === 'zetsu') factor *= 1.45
  if (fighter.nen.ko && fighter.nen.ko !== zone) factor *= 1.55
  return factor
}

export function isCriticalAuraStrike(fighter: ArcadeFighter): boolean {
  return fighter.nen.ko !== null
}

export function hasRyu(fighter: ArcadeFighter): boolean {
  return (
    Object.values(fighter.nen.ryu).some((share) => Number(share) > 0) &&
    !fighter.nen.ko &&
    !fighter.nen.on
  )
}

/** Presentation-ready combat information: what is reinforced and what was sacrificed. */
export function nenTacticalState(fighter: ArcadeFighter): FightNenTacticalState {
  const distribution = Object.fromEntries(
    FIGHT_NEN_ZONES.map((zone) => [zone, Number(fighter.nen.ryu[zone] ?? 0)]),
  ) as Record<FightNenZone, number>
  const [focusZone, focusShare] = FIGHT_NEN_ZONES.reduce<[FightNenZone | null, number]>(
    (strongest, zone) =>
      distribution[zone] > strongest[1] ? [zone, distribution[zone]] : strongest,
    [null, 0],
  )
  const technique: FightNenTactic = fighter.nen.on
    ? 'on'
    : fighter.nen.ko
      ? 'ko'
      : hasRyu(fighter)
        ? 'ryu'
        : fighter.nen.ken
          ? 'ken'
          : fighter.nen.gyo
            ? 'gyo'
            : fighter.nen.mode
  const exposesBody = technique === 'ko' || technique === 'ryu'

  return {
    technique,
    auraPerSecond: auraFlowRate(fighter),
    focusZone,
    focusShare,
    distribution,
    exposedZones: exposesBody
      ? FIGHT_NEN_ZONES.filter((zone) => zone !== focusZone && distribution[zone] < 0.15)
      : [],
    exhausted: fighter.auraExhausted,
  }
}

export function nenStatus(fighter: ArcadeFighter): string[] {
  if (fighter.auraExhausted) return ['zetsu', 'épuisé']
  if (fighter.nen.on) return ['on']
  const status: string[] = [fighter.nen.mode]
  if (fighter.nen.ken) status.push('ken')
  if (fighter.nen.gyo) status.push('gyo')
  if (fighter.nen.ko) status.push(`ko:${fighter.nen.ko}`)
  else if (hasRyu(fighter)) status.push('ryu')
  return status
}

export function auraDistribution(fighter: ArcadeFighter): string {
  const entries = (Object.entries(fighter.nen.ryu) as Array<[FightNenZone, number]>)
    .filter(([, share]) => share > 0)
    .sort((left, right) => right[1] - left[1])
  if (entries.length === 0) return fighter.nen.mode
  return entries.map(([zone, share]) => `${zone} ${Math.round(share * 100)}%`).join(' · ')
}

function withAction(
  fighter: ArcadeFighter,
  action: NenTechniqueAction<FightNenZone>,
): ArcadeFighter {
  const result = transitionNen(fighter.nen, action)
  return result.accepted ? { ...fighter, nen: result.state } : fighter
}
