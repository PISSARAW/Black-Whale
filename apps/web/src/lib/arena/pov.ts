import { privatePvpState } from '../fighting/pvp/view'
import type { FightSide } from '../fighting/types'

/**
 * Pure POV projection of an Arena bout.
 *
 * The Clash information asymmetry — Parallel Future, Secret Window, Body and
 * Soul, Melody Hearing, concealed attacks under In without Gyo — is applied here,
 * through the pure PvP filters, and never on the canonical simulation state:
 * replays and replay checksums keep the unfiltered state, and the omniscient
 * spectator mode stays available for the coaching step.
 */
export function arenaPov<S>(state: S, side: FightSide = 'player'): S {
  const view = privatePvpState(state as unknown as Parameters<typeof privatePvpState>[0], side)
  return view as unknown as S
}
