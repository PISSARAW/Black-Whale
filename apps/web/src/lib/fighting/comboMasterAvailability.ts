import { chrolloHasActivePage } from './chrolloBook'
import { hatsuSealedByOn } from './onTechnique'
import { COMBO_MASTER_MOVE } from './comboMasterTypes'
import type { ArcadeFighter } from './types'

export function comboMasterNenActive(fighter: ArcadeFighter): boolean {
  return (
    fighter.health > 0 &&
    fighter.nen.mode !== 'zetsu' &&
    !fighter.auraExhausted &&
    fighter.hatsuEffects.forcedZetsuFrames === 0 &&
    fighter.hatsuEffects.hatsuStolen === 0 &&
    fighter.stolenChainAbility?.moveId !== COMBO_MASTER_MOVE &&
    !hatsuSealedByOn(fighter)
  )
}

function ownsConsole(fighter: ArcadeFighter): boolean {
  if (fighter.id === 'furykov') return true
  if (fighter.id === 'chrollo') return chrolloHasActivePage(fighter, 'furykov')
  const borrowed = fighter.kurapika?.held
  return Boolean(borrowed?.used && borrowed.source === 'furykov')
}

export function comboMasterMonitoring(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.comboMaster) && ownsConsole(fighter) && comboMasterNenActive(fighter)
}

/** Console opening is a utility, including a page replayed through Skill Hunter or Dolphin. */
export function comboMasterUtilityMove(fighter: ArcadeFighter): boolean {
  return fighter.attack?.kind === 'special' && fighter.attack.hatsuSource === 'furykov'
}
