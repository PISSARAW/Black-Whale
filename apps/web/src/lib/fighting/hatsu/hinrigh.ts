import { strikePhysicalDevices } from '../deviceImpact'
import { advanceBiohazardDevices } from '../biohazardDevices'
import { advanceDeviceRecordings } from '../deviceRecording'
import { advanceBiohazard } from '../biohazardFrame'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

/** Ch. 390–391: touched objects become animals and retain their physical function. */
export const hinrighHatsu: FighterHatsu = {
  id: 'hinrigh',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) =>
    advanceDeviceRecordings(
      advanceBiohazardDevices(strikePhysicalDevices(advanceBiohazard(state))),
    ),
}
