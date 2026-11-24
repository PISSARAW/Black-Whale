import { fighterAnchored } from './fighterAnchors'
import { furykovDefensiveKoStagger } from './furykovProfile'
import { applyPhinksRecoil } from './troupeUpgrades'
import { applyAuraPushblock } from './defensiveMovementTech'
import type { ArcadeFighter } from './types'

/** Preserve the normal push distance when the wall prevents the guarding body moving. */
export function recoilGuardedAttack(options: {
  attacker: ArcadeFighter
  defender: ArcadeFighter
  struck: ArcadeFighter
  knockback: number
  blocked: boolean
  avoided: boolean
  cyclotronTurns?: number
}): ArcadeFighter {
  const { attacker, defender, struck, knockback } = options
  const turns = options.cyclotronTurns ?? 0
  const phinksRecoiled = applyPhinksRecoil(attacker, turns)
  const furykovStagger = furykovDefensiveKoStagger(defender, options.blocked)
  const staggered =
    furykovStagger > 0
      ? { ...phinksRecoiled, hitStun: Math.max(phinksRecoiled.hitStun, furykovStagger) }
      : phinksRecoiled
  if (
    !options.blocked ||
    options.avoided ||
    staggered.hanzoProjection ||
    fighterAnchored(staggered)
  )
    return staggered
  const missing = Math.max(0, knockback - Math.abs(struck.x - defender.x))
  const direction = staggered.x <= defender.x ? -1 : 1
  const cornerRecoiled =
    missing === 0
      ? staggered
      : { ...staggered, x: Math.max(7, Math.min(93, staggered.x + direction * missing)) }
  return applyAuraPushblock({ attacker: cornerRecoiled, defender, blocked: options.blocked })
    .attacker
}
