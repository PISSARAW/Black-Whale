import { canUseFightHatsu, hatsuSourceFor } from './hatsu'
import { moveById } from './movesets'
import { canUseRangedAttack } from './projectiles'
import { IN_CHARGE_FRAMES } from './nen'
import { attackAuraCost } from './fightAttackCost'
import type { ArcadeFighter, AttackKind } from './types'

export function attackIntent(fighter: ArcadeFighter, kind: AttackKind, moveId?: string) {
  const move = moveById(moveId)
  const usesHatsu = move ? ['special', 'finisher'].includes(move.category) : kind === 'special'
  const concealed = concealedHatsu(fighter, kind, moveId)
  return {
    hatsuSource: usesHatsu ? hatsuSourceFor(fighter, moveId) : null,
    concealed,
    resourceReady: move
      ? fighter.aura >= attackAuraCost({ fighter, kind, moveId, concealed })
      : attackResourceReady(fighter, kind),
  }
}

function concealedHatsu(fighter: ArcadeFighter, kind: AttackKind, moveId?: string): boolean {
  return (
    (kind === 'special' || kind === 'ranged') &&
    (fighter.nen.in || fighter.hatsuChargeFrames >= IN_CHARGE_FRAMES) &&
    fighter.nen.mode !== 'zetsu' &&
    !fighter.nen.on &&
    fighter.aura >= attackAuraCost({ fighter, kind, moveId, concealed: true })
  )
}

function attackResourceReady(fighter: ArcadeFighter, kind: AttackKind): boolean {
  if (kind === 'special') return canUseFightHatsu(fighter)
  if (kind === 'ranged') return canUseRangedAttack(fighter)
  return true
}
