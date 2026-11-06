import type { Apparition } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { momoze } from './apparitionMangaGuardianView'

export function buildSpriteApparition(seen: Apparition, context: BasicApparitionContext) {
  return seen.kind === 'sprite' ? momoze(seen, context) : undefined
}
