import { bodyGyoZone } from './nenCombat/bodyGyo'
import { hasRyu } from './nen'
import { fightStrikeLimb } from './fightStrikeLimb'
import type { ArcadeFighter, FightNenZone } from './types'

export interface AuraConcentration {
  technique: 'ryu' | 'ko'
  shares: Record<FightNenZone, number>
  limb: 'left' | 'right' | 'both'
}

/** Read the allocation the engine committed; an ordinary heavy never invents Ko. */
export function auraConcentration(fighter: ArcadeFighter): AuraConcentration | null {
  if (unavailable(fighter)) return null
  if (!fighter.nen.ko && (!hasRyu(fighter) || bodyGyoZone(fighter))) return null
  const shares = { head: 0, torso: 0, hands: 0, feet: 0 }
  for (const zone of Object.keys(shares) as FightNenZone[])
    shares[zone] = fighter.nen.ko
      ? Number(fighter.nen.ko === zone)
      : Number(fighter.nen.ryu[zone] ?? 0)
  const focus = (Object.keys(shares) as FightNenZone[]).reduce((a, b) =>
    shares[a] >= shares[b] ? a : b,
  )
  return { technique: fighter.nen.ko ? 'ko' : 'ryu', shares, limb: fightStrikeLimb(fighter, focus) }
}

function unavailable(fighter: ArcadeFighter): boolean {
  return (
    fighter.nen.mode === 'zetsu' || fighter.nen.on || fighter.auraExhausted || fighter.aura <= 0
  )
}

export function concentrationShare(
  concentration: AuraConcentration,
  region: { zone: FightNenZone; limb?: 'left' | 'right' },
): number {
  const share = concentration.shares[region.zone]
  if (!region.limb || concentration.limb === 'both' || region.limb === concentration.limb)
    return share
  return concentration.technique === 'ko' ? 0 : Math.min(0.08, share)
}
