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
 *
 * ADR-004 adds the other direction: what the visitor may do to a body once it
 * is standing there. What they can sense of it (`reading`), what a held
 * technique does to it (`reach`, `bodies`), and what it answers when addressed
 * (`dossier`, `address`) — the last two being a reading of the catalogue and
 * never a written line.
 */
export {
  ADDRESS_TOPICS,
  interview,
  unseal,
  type AddressOptions,
  type AddressTopic,
  type AddressWords,
  type Answer,
  type Interview,
  type UnsealedTopic,
} from './address'
export { beastApparitions, beastBehind, guardianVoice, type BeastVoice } from './beasts'
export {
  expire,
  HOLD_SECONDS,
  holdFor,
  letGoOf,
  holdOn,
  holdProgress,
  isHeld,
  lay,
  NO_BODIES,
  releaseBodies,
  type BodiesWorld,
  type BodyHold,
  type BodyMark,
} from './bodies'
export {
  dossierFor,
  type CastDossier,
  type DossierAbility,
  type DossierCharacter,
  type DossierOptions,
  type DossierSealed,
  type DossierStep,
} from './dossier'
export {
  CHAIN_JAIL_FACTION,
  reachBody,
  type Reach,
  type ReachInput,
  type ReachRefusal,
  type ReachTell,
} from './reach'
export { readBody, readingIsFelt, type ReadingInput, type ReadingTell } from './reading'
export { BUDGET, COOLDOWN, DORMANT_KINDS, intentsFor, runConduct } from './conduite'
export type { CastByCharacter, Intent, Tick } from './conduite'
export {
  castApparitions,
  distribute,
  postsIn,
  spacesForLocation,
  type CastLook,
} from './distribution'
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
