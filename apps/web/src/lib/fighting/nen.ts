import {
  createNenTechniqueState,
  nenDefenceFactor,
  transitionNen,
  type NenTechniqueAction,
} from '@black-whale/nen-engine'
import type { ArcadeFighter, AttackKind, FightNenCommand, FightNenZone } from './types'

const ACTIVATION_COST: Partial<Record<FightNenCommand, number>> = {
  ken: 8,
  ko: 16,
  ryu: 6,
  en: 8,
}

const AURA_MODE_ACTIONS = {
  ten: { type: 'TEN' },
  ren: { type: 'REN' },
  zetsu: { type: 'ZETSU' },
} as const

export function createFightingNen() {
  return createNenTechniqueState<FightNenZone>()
}

export function applyNenCommand(fighter: ArcadeFighter, command: FightNenCommand): ArcadeFighter {
  const cost = ACTIVATION_COST[command] ?? 0
  if (fighter.aura < cost) return fighter
  const transition = transitionNen(fighter.nen, actionFor(fighter, command))
  if (!transition.accepted) return fighter
  return { ...fighter, aura: fighter.aura - cost, nen: transition.state }
}

function actionFor(
  fighter: ArcadeFighter,
  command: FightNenCommand,
): NenTechniqueAction<FightNenZone> {
  if (command in AURA_MODE_ACTIONS) {
    return AURA_MODE_ACTIONS[command as keyof typeof AURA_MODE_ACTIONS]
  }
  return shapedAuraAction(fighter, command)
}

function shapedAuraAction(
  fighter: ArcadeFighter,
  command: Exclude<FightNenCommand, 'ten' | 'ren' | 'zetsu'>,
): NenTechniqueAction<FightNenZone> {
  if (command === 'ken') return { type: 'KEN', on: !fighter.nen.ken }
  if (command === 'gyo') return { type: 'GYO', on: !fighter.nen.gyo }
  if (command === 'ko') return { type: 'KO', zone: fighter.nen.ko ? null : 'hands' }
  if (command === 'in') return { type: 'IN', on: !fighter.nen.in }
  if (command === 'en') return { type: 'EN', radius: fighter.nen.en ? null : 12 }
  if (activeRyu(fighter)) return { type: 'TEN' }
  return {
    type: 'RYU',
    distribution: { hands: 45, torso: 35, feet: 20 },
  }
}

function activeRyu(fighter: ArcadeFighter): boolean {
  return Object.values(fighter.nen.ryu).some((share) => Number(share) > 0) && !fighter.nen.ko
}

export function advanceNen(fighter: ArcadeFighter, dt: number): ArcadeFighter {
  const aura = Math.max(0, Math.min(100, fighter.aura + auraRate(fighter) * dt))
  if (aura > 0 || fighter.nen.mode === 'zetsu') return { ...fighter, aura }
  return { ...fighter, aura, nen: transitionNen(fighter.nen, { type: 'ZETSU' }).state }
}

function auraRate(fighter: ArcadeFighter): number {
  if (fighter.nen.mode === 'zetsu') return 9
  let rate = fighter.nen.mode === 'ren' ? -3.5 : 2.4
  if (fighter.nen.ken) rate -= 3.5
  if (fighter.nen.ko) rate -= 4
  if (fighter.nen.gyo) rate -= 1
  if (fighter.nen.in) rate -= 1.2
  if (fighter.nen.en) rate -= 2
  if (activeRyu(fighter)) rate -= 1.2
  return rate
}

export function nenAttackFactor(fighter: ArcadeFighter, kind: AttackKind): number {
  if (fighter.nen.mode === 'zetsu') return 0.72
  let factor = fighter.nen.mode === 'ren' ? 1.2 : 1
  if (fighter.nen.ken) factor += 0.08
  if (fighter.nen.gyo) factor += 0.08
  if (activeRyu(fighter)) factor += 0.12
  if (fighter.nen.ko) factor += kind === 'heavy' ? 0.75 : 0.4
  return factor
}

export function nenDamageFactor(fighter: ArcadeFighter): number {
  return 1 + (0.35 - nenDefenceFactor(fighter.nen, 'torso')) * 0.55
}

export function consumeKo(fighter: ArcadeFighter): ArcadeFighter {
  if (!fighter.nen.ko) return fighter
  return { ...fighter, nen: { ...fighter.nen, ko: null, ryu: {} } }
}

export function nenStatus(fighter: ArcadeFighter): string[] {
  const status: string[] = [fighter.nen.mode]
  if (fighter.nen.ken) status.push('ken')
  if (fighter.nen.gyo) status.push('gyo')
  if (fighter.nen.ko) status.push('ko')
  if (activeRyu(fighter)) status.push('ryu')
  if (fighter.nen.in) status.push('in')
  if (fighter.nen.en) status.push('en')
  return status
}
