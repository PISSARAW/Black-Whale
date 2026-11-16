import { replayChecksum } from '../clashReplayCodec'
import { PVP_RULESET, type PvpSetup } from './types'

/** Setup is ordinary JSON: optional undefined properties must hash like their wire omission. */
export function pvpConfigHash(setup: PvpSetup): string {
  return replayChecksum({ setup: JSON.parse(JSON.stringify(setup)), ruleset: PVP_RULESET })
}
