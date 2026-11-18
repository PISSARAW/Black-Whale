import { chrolloCopiedMove, CHROLLO_SECONDARY, CHROLLO_USE } from './chrolloBook'
import { moveForSlot } from './movesets'
import type { ArcadeFighter, FighterId, MoveSlot } from './types'

/** Offensive commands with a native strike or shot. Utility and ritual commands keep their own inputs. */
const STRIKES: Partial<Record<FighterId, MoveSlot>> = {
  kurapika: 'forwardSpecial',
  hisoka: 'finisher',
  benjamin: 'neutralSpecial',
  feitan: 'forwardSpecial',
  saiyu: 'forwardSpecial',
  theta: 'forwardSpecial',
  biscuit: 'finisher',
  phinks: 'finisher',
  franklin: 'forwardSpecial',
  machi: 'forwardSpecial',
  kalluto: 'forwardSpecial',
  bonolenov: 'forwardSpecial',
  shizuku: 'forwardSpecial',
  leorio: 'neutralSpecial',
  hanzo: 'finisher',
  gel: 'forwardSpecial',
  furykov: 'forwardSpecial',
  cluck: 'forwardSpecial',
  beyond: 'forwardSpecial',
  padaille: 'forwardSpecial',
  sayird: 'forwardSpecial',
  terebellum: 'neutralSpecial',
}

const COPYABLE_STRIKES = new Set(
  Object.entries(STRIKES)
    .filter(([id]) => id !== 'theta')
    .map(([id, slot]) => `${id}:${slot}`),
)

export function airPursuitTechnique(id: FighterId) {
  const slot = STRIKES[id]
  return slot ? moveForSlot(id, slot) : null
}

export function currentPursuitTechnique(fighter: ArcadeFighter) {
  if (fighter.id !== 'chrollo') return airPursuitTechnique(fighter.id)
  if (copyable(fighter, CHROLLO_USE)) return moveForSlot('chrollo', 'neutralSpecial')
  if (copyable(fighter, CHROLLO_SECONDARY)) return moveForSlot('chrollo', 'finisher')
  return null
}

function copyable(fighter: ArcadeFighter, command: string): boolean {
  const moveId = chrolloCopiedMove(fighter, command)
  return moveId !== null && COPYABLE_STRIKES.has(moveId)
}

export function requiresNativeStrikeStart(id: FighterId): boolean {
  return id === 'bonolenov' || id === 'phinks' || id === 'chrollo'
}
