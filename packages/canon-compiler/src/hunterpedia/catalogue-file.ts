import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { findDataRoot, type Character, type MangaAppearance } from '@black-whale/contracts'

/**
 * The catalogue file these three tools rewrite.
 *
 * They are the only things in the repository that *write* `data/`, which is
 * why they are the only place a mutable view of a catalogue entry exists.
 * Everything downstream reads the validated, frozen shape.
 */

/** A catalogue entry as an authoring tool needs it: writable. */
export interface WritableCharacter extends Character {
  factionId?: string | null
  description?: string | null
  firstAppearanceChapterId?: string | null
  mapPresenceFromChapterId?: string | null
  positionProvenance?: 'databook' | 'inferred'
  shipLocation?: {
    tier: number | null
    room: string | null
    status: string
    role: string
  }
  mangaAppearances?: MangaAppearance[]
}

export function catalogueFilePath(dataRoot: string = findDataRoot()): string {
  return join(dataRoot, 'characters/characters.json')
}

export function readCharacterFile(path: string = catalogueFilePath()): WritableCharacter[] {
  return JSON.parse(readFileSync(path, 'utf8')) as WritableCharacter[]
}

/**
 * Two spaces and a trailing newline, which is what `prettier` leaves the file
 * as — writing it any other way makes the next `format:check` fail on a file
 * nobody edited by hand.
 */
export function writeCharacterFile(
  characters: readonly WritableCharacter[],
  path: string = catalogueFilePath(),
): void {
  writeFileSync(path, `${JSON.stringify(characters, null, 2)}\n`)
}
