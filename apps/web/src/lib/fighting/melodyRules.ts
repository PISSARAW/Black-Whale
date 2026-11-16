import { needleAutonomy } from './illumiState'
import { senseDeprived } from './saiyuSenses'
import { canUseHatsu } from '@black-whale/nen-engine'
import { chrolloHasActivePage, chrolloPageForMove } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { hatsuSealedByOn } from './onTechnique'
import type { ArcadeFighter, AttackKind } from './types'

import { MELODY_MUSIC_MOVE } from './melodyTuning'
export * from './melodyTuning'

/** Ordinary guard never blocks sound. Kikazaru removes hearing independently of the other monkeys. */
export function canHear(fighter: ArcadeFighter): boolean {
  return fighter.health > 0 && !fighter.coveringEars && !senseDeprived(fighter, 'hearing')
}

export function musicPacifies(fighter: ArcadeFighter): boolean {
  return fighter.hatsuEffects.entrancedFrames > 0 && canHear(fighter)
}

/** Playing, listening or covering the ears prevents both strikes and ordinary guard. */
export function melodyRestrictsCombat(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.coveringEars || fighter.melodyPerformance || musicPacifies(fighter))
}

/** Hearing follows the real body, including Hanzo's stationary sleeping body. */
export function soundDistance(first: ArcadeFighter, second: ArcadeFighter): number {
  const x = (fighter: ArcadeFighter) => fighter.hanzoProjection?.bodyX ?? fighter.x
  const y = (fighter: ArcadeFighter) => (fighter.hanzoProjection ? 0 : fighter.y)
  return Math.hypot(x(first) - x(second), y(first) - y(second))
}

export function hasMelodyFlute(fighter: ArcadeFighter): boolean {
  if (fighter.melodyFlute !== undefined) return fighter.melodyFlute
  return fighter.id === 'melody' && !fighter.kurapika?.held?.used
}

export function melodyMusicIntent(
  fighter: ArcadeFighter,
  kind: AttackKind,
  moveId?: string,
): boolean {
  if (kind !== 'special') return false
  if (fighter.id === 'melody')
    return (
      !moveId || /^melody:(neutralSpecial|forwardSpecial|backSpecial|downSpecial)$/.test(moveId)
    )
  if (fighter.id === 'chrollo') return chrolloPageForMove(fighter, moveId) === 'melody'
  const borrowed = fighter.kurapika?.held
  return Boolean(borrowed?.used && borrowed.source === 'melody' && borrowed.moveId === moveId)
}

export function melodyNenActive(fighter: ArcadeFighter): boolean {
  return (
    fighter.health > 0 &&
    canUseHatsu(fighter.nen) &&
    !fighter.auraExhausted &&
    !hatsuSealedByOn(fighter) &&
    fighter.hatsuEffects.hatsuStolen === 0 &&
    fighter.hatsuEffects.forcedZetsuFrames === 0 &&
    !chainAbilitySealed(fighter, fighter.melodyPerformance?.moveId ?? MELODY_MUSIC_MOVE)
  )
}

export function melodyCanPerform(fighter: ArcadeFighter): boolean {
  if (!needleAutonomy(fighter)) return false
  return (
    melodyNenActive(fighter) &&
    hasMelodyFlute(fighter) &&
    fighter.y === 0 &&
    !fighter.hanzoProjection &&
    !fighter.coveringEars &&
    !fighter.motion?.prejumpFrames &&
    !musicPacifies(fighter)
  )
}

export function melodyPageActive(fighter: ArcadeFighter): boolean {
  return fighter.id !== 'chrollo' || chrolloHasActivePage(fighter, 'melody')
}

export function melodyMoveResources(
  fighter: ArcadeFighter,
  kind: AttackKind,
  moveId: string,
): boolean | null {
  if (!melodyMusicIntent(fighter, kind, moveId)) return null
  if (fighter.melodyPerformance) return true
  return melodyCanPerform(fighter) ? null : false
}

export function isMelodyMusicAttack(fighter: ArcadeFighter): boolean {
  const attack = fighter.attack
  return Boolean(
    attack &&
    (attack.hatsuSource === 'melody' || melodyMusicIntent(fighter, attack.kind, attack.moveId)),
  )
}
