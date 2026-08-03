/**
 * The cast: the named characters of the canon, standing in the walk.
 *
 * One door into the folder, in the order the chantier reads: who is aboard
 * (`roster`), where they stand (`distribution`, `stations`, `presence`), what
 * they are wearing (`wardrobe`), what is in the room with them (`beasts`), what
 * they are carrying (`nen`) and what they do with it (`conduite`).
 *
 * Nothing here declares a fact about the canon. Every one of these modules is a
 * projection of `data/` over `blueprint.json`, which is the whole of ADR-003 —
 * and the reason a corridor the manga does not people comes out of it empty.
 */
export { beastApparitions, beastBehind, guardianVoice, type BeastVoice } from './beasts'
export { BUDGET, COOLDOWN, DORMANT_KINDS, intentsFor, runConduct } from './conduite'
export type { CastByCharacter, Intent, Tick } from './conduite'
export { castApparitions, distribute, postsIn, type CastLook } from './distribution'
export { auraFor, auraReader, CALM, WATCH_EN_RADIUS, type Situation } from './nen'
export { hostileRooms, DISMISSAL_CARD } from './hostility'
export { chapterNumberOf, drawable, isDrawable, sinceChapter } from './presence'
export { aimedPerson, personExhibit, type PersonWords } from './provenance'
export { rosterFrom } from './roster'
export type {
  RosterAbility,
  RosterAppearance,
  RosterBody,
  RosterCharacter,
  RosterInput,
  RosterLocation,
  RosterPresence,
} from './roster'
export { seedOf, spaceAmong, stationIn } from './stations'
export { inSlugSpace } from './worldState'
export { dressedRoles, wardrobeFor } from './wardrobe'
export { NO_CAST } from './types'
export type { CastBeast, CastMember, CastPayload, Costume, Post, StandingBeast } from './types'
