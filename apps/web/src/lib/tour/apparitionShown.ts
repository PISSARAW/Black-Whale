/**
 * What the scene keeps of an apparition between two builds.
 *
 * Everything here is cheap to change and none of it is part of the build key:
 * a body that takes a step is the same mesh somewhere else, not a new one. It
 * is read every frame, which is what lets a pacing body be a function of the
 * clock — see `cast/pace.ts`.
 */
import type { Apparition } from './apparitions'
import { pacedAt } from './cast/pace'

export function shownState(seen: Apparition, seconds: number) {
  const step = seen.human?.pace ? pacedAt(seen.human.pace, seconds) : null
  return {
    y: seen.y,
    at: step?.at ?? seen.at,
    stage: seen.stage,
    spread: seen.spread ?? 0,
    size: seen.size,
    tierId: seen.tierId,
    pair: seen.pair,
    humanPose: step?.walking ? ('walk' as const) : seen.human?.pose,
    humanHeading: seen.heading,
    pick: seen.pick ?? false,
  }
}
