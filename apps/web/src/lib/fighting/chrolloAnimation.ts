import { chrolloManifestations } from './chrolloManifestations'
import { confirmedSunMoonDetonation, sunMoonSnapshot } from './chrolloDetonation'
import type { FightSide, FightState } from './types'

export const CHROLLO_ACCENT_FRAMES = 18
export const CHROLLO_MAJOR_FRAMES = 84
export const CHROLLO_MAJOR_KEYS = [
  'acquired',
  'copy',
  'puppet',
  'fish',
  'cloth',
  'appearance',
  'control',
  'detonation',
] as const
type Major = (typeof CHROLLO_MAJOR_KEYS)[number]
export type ChrolloAnimationFrame = Record<Major, number | null> & {
  book: number | null
  page: number | null
  bookmark: number | null
  sun: number | null
  moon: number | null
  copyId: string
  puppetId: string
  clothTarget: string
}
const empty = (): ChrolloAnimationFrame => ({
  book: null,
  page: null,
  bookmark: null,
  sun: null,
  moon: null,
  acquired: null,
  copy: null,
  puppet: null,
  fish: null,
  cloth: null,
  appearance: null,
  control: null,
  detonation: null,
  copyId: '',
  puppetId: '',
  clothTarget: '',
})
function actor(state: FightState, side: FightSide) {
  const self = state[side]
  const target = state[side === 'player' ? 'opponent' : 'player']
  return {
    ...chrolloManifestations(state, side),
    book: Boolean(self.chrolloBook?.open),
    page: self.chrolloBook?.pages[self.chrolloBook.page] ?? '',
    bookmark: self.chrolloBook?.bookmark ?? '',
    sun: target.hatsuEffects.sunMark > 0,
    moon: target.hatsuEffects.moonMark > 0,
  }
}
type Actor = ReturnType<typeof actor>
function majorChanged(key: Major, before: Actor, after: Actor) {
  if (key === 'copy') return after.copyCount > before.copyCount
  if (key === 'puppet') return after.puppetCount > before.puppetCount
  if (key === 'detonation') return false
  if (key === 'acquired') return after.acquiredCount > before.acquiredCount
  return Boolean(after[key]) && before[key] !== after[key]
}
function active(key: Major, after: Actor) {
  if (key === 'copy') return after.copyCount > 0
  if (key === 'puppet') return after.puppetCount > 0
  if (key === 'detonation') return true
  return Boolean(after[key])
}
function frameAt(start: number | null, frame: number, duration: number) {
  return start !== null && frame - start < duration ? frame - start : null
}
function updateActor(
  before: Actor,
  after: Actor,
  context: { held: ChrolloAnimationFrame; frame: number; blast: boolean },
) {
  const { held, frame } = context
  const shown = empty()
  for (const key of ['book', 'page', 'bookmark', 'sun', 'moon'] as const) {
    if (before[key] !== after[key]) held[key] = frame
    shown[key] = frameAt(held[key], frame, CHROLLO_ACCENT_FRAMES)
  }
  for (const key of CHROLLO_MAJOR_KEYS) {
    if (!active(key, after)) held[key] = null
    if (majorChanged(key, before, after)) held[key] = frame
    shown[key] = frameAt(held[key], frame, CHROLLO_MAJOR_FRAMES)
  }
  if (context.blast) {
    held.detonation = frame
    shown.detonation = 0
  }
  shown.puppetId = after.puppetId
  shown.copyId = after.copyId
  shown.clothTarget = after.cloth
  return shown
}
export function createChrolloAnimationClock() {
  let previous: ReturnType<typeof sunMoonSnapshot> | null = null
  let actors: Record<FightSide, Actor> | null = null
  let held = { player: empty(), opponent: empty() }
  return (state: FightState): Record<FightSide, ChrolloAnimationFrame> => {
    const next = sunMoonSnapshot(state)
    const current = { player: actor(state, 'player'), opponent: actor(state, 'opponent') }
    if (!previous || resets(previous, next) || state.phase !== 'fighting') {
      previous = next
      actors = current
      held = { player: empty(), opponent: empty() }
      return { player: empty(), opponent: empty() }
    }
    const shown = { player: empty(), opponent: empty() }
    for (const side of ['player', 'opponent'] as const)
      shown[side] = updateActor(actors![side], current[side], {
        held: held[side],
        frame: state.frame,
        blast: confirmedSunMoonDetonation(previous, state, side),
      })
    previous = next
    actors = current
    return shown
  }
}
function resets(
  previous: ReturnType<typeof sunMoonSnapshot>,
  next: ReturnType<typeof sunMoonSnapshot>,
) {
  return previous.key !== next.key || next.frame < previous.frame || next.phase === 'ready'
}
