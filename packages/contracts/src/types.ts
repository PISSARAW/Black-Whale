import type {
  Ability,
  AbilityUse,
  Blueprint,
  CanonEvent,
  Chapter,
  Character,
  Faction,
  Location,
  Prophecy,
} from './schemas.js'
import type { AppearanceFile } from './appearance.js'

/** The whole of `data/`, parsed and validated, in one value. */
export interface Catalogue {
  chapters: Chapter[]
  characters: Character[]
  /** What the named ones look like — ADR-005. Empty of nobody by default. */
  appearance: AppearanceFile
  abilities: Ability[]
  abilityUses: AbilityUse[]
  factions: Faction[]
  locations: Location[]
  events: CanonEvent[]
  prophecies: Prophecy[]
  blueprint: Blueprint
}

/**
 * One thing wrong with the catalogue.
 *
 * `where` is a path a person can act on — `abilities#bungee-gum`, not an array
 * index — because the point of canon-lint is that a contradiction becomes a
 * dated build failure rather than a reader's discovery.
 */
export interface Finding {
  rule: string
  where: string
  message: string
}
