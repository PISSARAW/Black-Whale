import type { BasicApparitionContext } from './apparitionBasicView'
import type { Apparition } from './apparitions'
import { catsName } from './apparitionMangaObjectView'

export function buildAnimalApparition(seen: Apparition, context: BasicApparitionContext) {
  return seen.kind === 'cat' ? catsName(seen, context) : undefined
}
