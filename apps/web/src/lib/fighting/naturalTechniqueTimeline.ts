import type { MoveTimeline } from './keyPoseTimeline'
import type { FighterId, MoveSlot } from './types'

const SPECIAL_SLOTS = new Set<MoveSlot>([
  'neutralSpecial',
  'forwardSpecial',
  'downSpecial',
  'backSpecial',
  'finisher',
])

/** Fighters whose long arm gestures exposed the one-frame contact snap most clearly. */
const FLUID_TECHNIQUES = new Set<FighterId>([
  'biscuit',
  'chrollo',
  'gel',
  'halkenburg',
  'hinrigh',
  'illumi',
  'machi',
  'musse',
  'terebellum',
])

const CACHE = new WeakMap<MoveTimeline, MoveTimeline>()

/**
 * Techniques still arrive exactly on their first active frame, but their limb path starts
 * earlier and eases into contact instead of covering most of its arc in a single frame.
 */
export function naturalTechniqueTimeline(
  id: FighterId,
  slot: MoveSlot,
  timeline: MoveTimeline,
): MoveTimeline {
  if (!SPECIAL_SLOTS.has(slot) || !FLUID_TECHNIQUES.has(id)) return timeline
  const cached = CACHE.get(timeline)
  if (cached) return cached
  const natural = timeline.map((key) => {
    if (key.phase === 'startup' && key.at > 0.4) return { ...key, at: 0.4 }
    if (key.phase === 'active' && key.at === 0 && key.ease === 'snap')
      return { ...key, ease: 'smooth' as const }
    return key
  })
  CACHE.set(timeline, natural)
  return natural
}
