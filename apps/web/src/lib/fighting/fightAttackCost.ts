import { chrolloPageForMove, chrolloPageSource, chrolloCopiedMove } from './chrolloBook'
import { moveById, moveForSlot } from './movesets'
import { rangedAuraCost } from './projectiles'
import { bodyguardPhysicalShot } from './bodyguardFirearms'
import type { ArcadeFighter, AttackKind } from './types'

export const CONCEALED_AURA_SURCHARGE = 12

interface AttackCostOptions {
  fighter: ArcadeFighter
  kind: AttackKind
  moveId?: string
  concealed?: boolean
}

/** A copied page pays for its actual technique, before any activation changes its state. */
export function attackAuraCost(options: AttackCostOptions): number {
  const { fighter, kind, moveId, concealed } = options
  if (bodyguardPhysicalShot(fighter, kind)) return 0
  const copied = copiedMove(options)
  const move = moveById(moveId)
  const base = copied?.auraCost ?? move?.auraCost ?? legacyCost(fighter, kind)
  return base + (concealed ? CONCEALED_AURA_SURCHARGE : 0)
}

function copiedMove(options: AttackCostOptions) {
  const { fighter, kind, moveId } = options
  if (kind !== 'special') return null
  const source = chrolloPageSource(chrolloPageForMove(fighter, moveId))
  if (!source || source === 'chrollo') return null
  const chosen = chrolloCopiedMove(fighter, moveId)
  if (chosen && chosen !== `${source}:neutralSpecial`) return moveById(chosen)
  const slot =
    source === 'feitan' && fighter.hatsuEffects.painPacker?.armour ? 'finisher' : 'neutralSpecial'
  return moveForSlot(source, slot)
}

function legacyCost(fighter: ArcadeFighter, kind: AttackKind): number {
  if (kind === 'special') return 40
  return kind === 'ranged' ? rangedAuraCost(fighter.id) : 0
}
