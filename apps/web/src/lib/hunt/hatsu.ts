/**
 * The first ability adapter for Hunt.
 *
 * The catalogue remains authoritative: identity, Nen category, interaction
 * mode and action id come from `ability-modules`. Hunt only says how that
 * declared action enters its existing economy. Bungee Gum's masked elastic
 * connection is the entrave the prototype already knows how to account for;
 * no second trap or damage value is invented here.
 */
import {
  bungeeGum,
  dowsingChain,
  parallelFuture,
  PARALLEL_FUTURE_WINDOW_SECONDS,
} from '@black-whale/ability-modules'
import type { Vec2 } from '../tour/types'

export type HuntHatsuId = 'bungee-gum' | 'parallel-future' | 'dowsing-chain'

export interface HuntHatsuProfile {
  id: HuntHatsuId
  name: string
  ownerId: string
  category: string
  actionId: 'set-trap' | 'open-window' | 'dowse'
  inputMode: string
  role: 'prepare' | 'foresee' | 'locate'
}

const interaction = bungeeGum.getInteractionManifest()

export const BUNGEE_GUM_HUNT: HuntHatsuProfile = {
  id: 'bungee-gum',
  name: bungeeGum.manifest.name,
  ownerId: bungeeGum.manifest.ownerId,
  category: bungeeGum.manifest.category,
  actionId: 'set-trap',
  inputMode: interaction?.inputMode ?? 'DRAG',
  role: 'prepare',
}

export const PARALLEL_FUTURE_HUNT: HuntHatsuProfile = profileOf(parallelFuture, {
  actionId: 'open-window',
  role: 'foresee',
})

export const DOWSING_CHAIN_HUNT: HuntHatsuProfile = profileOf(dowsingChain, {
  actionId: 'dowse',
  role: 'locate',
})

function profileOf(
  module: typeof parallelFuture,
  hunt: Pick<HuntHatsuProfile, 'actionId' | 'role'>,
): HuntHatsuProfile {
  return {
    id: module.manifest.id as HuntHatsuId,
    name: module.manifest.name,
    ownerId: module.manifest.ownerId,
    category: module.manifest.category,
    actionId: hunt.actionId,
    inputMode: module.getInteractionManifest()?.inputMode ?? 'TARGET_SELECTION',
    role: hunt.role,
  }
}

export const DEFAULT_HUNT_HATSU = BUNGEE_GUM_HUNT.id

export function huntHatsu(id: HuntHatsuId): HuntHatsuProfile {
  switch (id) {
    case 'bungee-gum':
      return BUNGEE_GUM_HUNT
    case 'parallel-future':
      return PARALLEL_FUTURE_HUNT
    case 'dowsing-chain':
      return DOWSING_CHAIN_HUNT
  }
}

export interface HuntHatsuState {
  id: HuntHatsuId
  uses: number
  /** Canonical ten-second window; zero for every other ability. */
  window: number
  /** A prediction names an intended room, not the hunter's true position. */
  forecastSpaceId: string | null
  /** Dowsing returns a probable direction and never a room. */
  probableBearing: Vec2 | null
}

export function initialHatsu(id: HuntHatsuId = DEFAULT_HUNT_HATSU): HuntHatsuState {
  return { id, uses: 0, window: 0, forecastSpaceId: null, probableBearing: null }
}

export function tickHatsu(state: HuntHatsuState, dt: number): HuntHatsuState {
  return state.window <= 0 ? state : { ...state, window: Math.max(0, state.window - dt) }
}

export function openFuture(state: HuntHatsuState, forecastSpaceId: string | null): HuntHatsuState {
  if (state.id !== 'parallel-future') return state
  return {
    ...state,
    uses: state.uses + 1,
    window: PARALLEL_FUTURE_WINDOW_SECONDS,
    forecastSpaceId,
    probableBearing: null,
  }
}

export function readDowsing(state: HuntHatsuState, bearing: Vec2 | null): HuntHatsuState {
  if (state.id !== 'dowsing-chain') return state
  return { ...state, uses: state.uses + 1, probableBearing: bearing, forecastSpaceId: null }
}
