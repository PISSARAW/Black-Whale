import { clashPvpRegistry } from '../clashPvp'
import { clashSeasons } from '../clashSeasons'
import { PVP_RULESET } from '$lib/fighting/pvp/types'
import { ClashCompetition } from './service'
import { competitionFile } from './file'
const shared = globalThis as typeof globalThis & {
  __clashCompetition?: { registry: typeof clashPvpRegistry; rules: string; value: ClashCompetition }
}
if (
  shared.__clashCompetition?.registry !== clashPvpRegistry ||
  shared.__clashCompetition.rules !== PVP_RULESET
) {
  shared.__clashCompetition = {
    registry: clashPvpRegistry,
    rules: PVP_RULESET,
    value: new ClashCompetition({
      registry: clashPvpRegistry,
      seasons: clashSeasons,
      storage: competitionFile(),
    }),
  }
}
export const clashCompetition = shared.__clashCompetition.value
