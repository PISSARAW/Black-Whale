import type { FighterId, MoveSlot } from './types'
import type { DirectionalEnding } from './directionalChain'

type Strike = Extract<MoveSlot, 'neutralSpecial' | 'forwardSpecial' | 'downSpecial' | 'finisher'>

/** Contact techniques admitted through their original commands and prerequisites. */
const CARRY: Partial<Record<FighterId, Strike>> = {
  kurapika: 'forwardSpecial',
  hisoka: 'finisher',
  chrollo: 'neutralSpecial',
  benjamin: 'neutralSpecial',
  feitan: 'forwardSpecial',
  saiyu: 'forwardSpecial',
  biscuit: 'finisher',
  franklin: 'downSpecial',
  machi: 'forwardSpecial',
  shizuku: 'forwardSpecial',
  hanzo: 'downSpecial',
  gel: 'forwardSpecial',
  beyond: 'forwardSpecial',
  padaille: 'neutralSpecial',
  terebellum: 'neutralSpecial',
}

const CLOSE: Partial<Record<FighterId, Strike>> = {
  theta: 'downSpecial',
  kalluto: 'forwardSpecial',
}

export function directionalTechnique(id: FighterId, ending: DirectionalEnding): Strike | undefined {
  if (ending === 'carry') return CARRY[id]
  if (ending === 'close') return CLOSE[id]
}
