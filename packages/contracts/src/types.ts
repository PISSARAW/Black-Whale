import type {
  Ability,
  Blueprint,
  CanonEvent,
  Chapter,
  Character,
  Faction,
  Location,
  Prophecy,
} from './schemas.js'

/** The whole of `data/`, parsed and validated, in one value. */
export interface Catalogue {
  chapters: Chapter[]
  characters: Character[]
  abilities: Ability[]
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
