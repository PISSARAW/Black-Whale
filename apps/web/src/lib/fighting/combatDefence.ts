import { readableImpact } from './nenCombat/impactRead'
import { melodyRestrictsCombat } from './melodyRules'
import { melodyParryBonus } from './melodyHearing'
import { nenReadBonus } from './nenPerception'
import { sleepingBody, wakeHanzoBody } from './hanzoProjection'
import { blocksGuardRequirement } from './duelMoves'
import { attackData, attackPhase } from './frameData'
import { consumeHatsuAvoidance, hatsuAvoidsImpact } from './hatsu'
import { focusGuardRyu } from './nen'
import type { ImpactDefence } from './combatDamage'
import type { CombatRead } from './combatRead'
import type { ArcadeFighter, FightNenZone } from './types'

export const PARRY_WINDOW_FRAMES = 6

export function prepareDefence(
  fighter: ArcadeFighter,
  zone: FightNenZone,
  read: CombatRead,
): ImpactDefence {
  fighter = wakeHanzoBody(fighter)
  const blocked = !melodyRestrictsCombat(fighter) && blocksGuardRequirement(fighter, read.guard)
  const visible = readableImpact(fighter, read)
  const bonus = nenReadBonus(fighter, { ...fighter, ...read.position })
  const parried = visible && parryActive(fighter, blocked, { attacker: read.attacker, bonus })
  const invulnerable = impactInvulnerable(fighter, read)
  if (invulnerable) return { fighter, blocked, parried, avoided: true, invulnerable }
  if (hatsuAvoidsImpact(fighter))
    return {
      fighter: consumeHatsuAvoidance(fighter),
      blocked,
      parried,
      avoided: true,
      invulnerable: false,
    }
  return {
    fighter: parried ? focusGuardRyu(fighter, zone) : fighter,
    blocked,
    parried,
    avoided: false,
    invulnerable: false,
  }
}

function impactInvulnerable(fighter: ArcadeFighter, read: CombatRead): boolean {
  if (read.guard === 'throw') return false
  if (sleepingBody(fighter).wakeupInvulnerableFrames > 0) return true
  if (!fighter.attack?.reversal || attackPhase(fighter) !== 'startup') return false
  const frames = attackData(fighter.attack.kind, fighter).reversalInvulnerableFrames ?? 0
  return fighter.attack.frame < frames
}

function parryActive(
  fighter: ArcadeFighter,
  blocked: boolean,
  read: { attacker?: ArcadeFighter; bonus: number },
): boolean {
  return (
    blocked &&
    fighter.guardFrames > 0 &&
    fighter.guardFrames <=
      PARRY_WINDOW_FRAMES + read.bonus + melodyParryBonus(fighter, read.attacker)
  )
}
