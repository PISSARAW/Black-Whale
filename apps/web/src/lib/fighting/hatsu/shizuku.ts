import { advanceBlinky } from '../blinkyFrames'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

/** Suction is aimed and begins only after startup; hitting with the club is separate. */
export const shizukuHatsu: FighterHatsu = {
  id: 'shizuku',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: advanceBlinky,
}
