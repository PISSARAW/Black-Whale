import { observeComboMaster } from '../comboMaster'
import { comboMasterNenActive } from '../comboMasterAvailability'
import { COMBO_MASTER_MOVE } from '../comboMasterTypes'
import { unchangedImpact, type FighterHatsu } from './contract'

/** Combo Master: the chapter 415 alert is immediate; deciphering/fabrication still take days. */
export const furykovHatsu: FighterHatsu = {
  id: 'furykov',
  sourceFor: (_fighter, moveId) => (!moveId || moveId === COMBO_MASTER_MOVE ? 'furykov' : null),
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    if (!comboMasterNenActive(fighter)) return state
    return observeComboMaster({
      ...state,
      [side]: { ...fighter, comboMaster: fighter.comboMaster ?? { alert: null } },
    })
  },
  onImpact: unchangedImpact,
  onFrame: (state) => observeComboMaster(state),
}
