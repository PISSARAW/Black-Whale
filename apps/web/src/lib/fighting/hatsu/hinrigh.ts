import { advanceBiohazardDevices } from '../biohazardDeviceFrame'
import { advanceBiohazard } from '../biohazardFrame'
import { advanceHinrighCounter } from '../hinrighCounter'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

/** Ch. 390–391: touched objects become animals and retain their physical function. */
export const hinrighHatsu: FighterHatsu = {
  id: 'hinrigh',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) => advanceHinrighCounter(advanceBiohazardDevices(advanceBiohazard(state))),
}
