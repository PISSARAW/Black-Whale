import { EMPTY_WORLD, type TourWorld } from '$lib/tour/hatsu'
import type { TourFlash } from '$lib/tour/apparitions'
import type { HuntState } from './state'
import { liveOf } from './nen/placed'

export const PARALLEL_FUTURE_TINT = 0x6f63ff

export interface HuntHatsuPresentation {
  world: TourWorld
  tint: number | null
}

/** Projects Hunt's real ability state into TourScene's existing 3D Hatsu language. */
export function presentHatsu(state: HuntState): HuntHatsuPresentation {
  const dowsing = state.hatsu.id === 'dowsing-chain' && state.hatsu.probableBearing !== null
  return {
    world: {
      ...EMPTY_WORLD,
      // The Hunt player can always read their own aura placements.
      laidOpen: true,
      gumTraps: liveOf(state.ledger.placements).map((placement) => placement.spaceId),
      holding: dowsing ? 'dowsing' : null,
      dowsing: dowsing ? state.hunter.spaceId : null,
    },
    tint:
      state.hatsu.id === 'parallel-future' && state.hatsu.window > 0 ? PARALLEL_FUTURE_TINT : null,
  }
}

/** Parallel Future is an event as well as a held tint: replay TourScene's rewind once per use. */
export function hatsuFlash(before: HuntState, after: HuntState): TourFlash | null {
  if (after.hatsu.id !== 'parallel-future' || after.hatsu.uses <= before.hatsu.uses) return null
  return {
    kind: 'rewind',
    // Rewind is screen-space and intentionally not tied to one deck in TourScene.
    tierId: '',
    at: after.player.position,
    y: 0,
    colour: PARALLEL_FUTURE_TINT,
  }
}
