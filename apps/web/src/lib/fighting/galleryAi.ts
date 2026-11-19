import { gallerySenseOptions, performGallerySense } from './gallerySense'
import type { FightState } from './types'

/** The planner can touch a present original; it never fabricates a copy or an En contact. */
export function gallerySenseAi(state: FightState): FightState | null {
  if (state.opponent.chrolloHistorical?.galleryFocus) return null
  const option = gallerySenseOptions(state, 'opponent').find(
    (item) => item.ready && item.command.action === 'history-gallery-locate',
  )
  return option ? performGallerySense(state, 'opponent', option.command) : null
}
