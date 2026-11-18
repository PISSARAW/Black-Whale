import { advanceBiohazardDevices as advanceCarriedDevices } from '../biohazardDeviceFrame'
import { strikePhysicalDevices } from '../deviceImpact'
import { advanceBiohazardDevices } from '../biohazardDevices'
import { advanceDeviceRecordings } from '../deviceRecording'
import { advanceBiohazard } from '../biohazardFrame'
import { advanceHinrighCounter } from '../hinrighCounter'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

/** Ch. 390–391: touched objects become animals and retain their physical function. */
export const hinrighHatsu: FighterHatsu = {
  id: 'hinrigh',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) =>
    advanceDeviceRecordings(
      advanceBiohazardDevices(
        advanceCarriedDevices(
          strikePhysicalDevices(advanceHinrighCounter(advanceBiohazard(state))),
        ),
      ),
    ),
}
