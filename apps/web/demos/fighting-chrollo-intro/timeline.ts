import type { Beat, Segment } from './reel'
import type { Portrait } from './portraitCamera'
import type { Fx } from '../fighting-combo-edit/timeline'

export const FPS = 30
export const BEAT = 12
export const BPM = 150

export type Shot =
  | { kind: 'title'; local: number; length: number }
  | { kind: 'outro'; local: number; length: number }
  | {
      kind: 'clip'
      clip: number
      local: number
      length: number
      sim: number
      beat?: Beat & { age: number }
      portrait: Portrait | null
      title: boolean
      fx: Fx
    }
export interface AudioCue {
  at: number
  kind: 'hit' | 'crit' | 'final' | 'whoosh' | 'riser' | 'drop' | 'key'
}

const calm = (): Fx => ({
  zoom: 1,
  shakeX: 0,
  shakeY: 0,
  tilt: 0,
  flash: 0,
  split: 0,
  dark: 0,
  lines: 0,
})
const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

/** Real time is 2 simulation frames per output frame. */
function portraitAt(segment: Segment, sim: number): Portrait | null {
  return segment.portraits.find((p) => sim >= p.from && sim < p.to)?.mode ?? null
}

function speedAt(segment: Segment, sim: number) {
  return baseSpeed(segment, sim) * (segment.slow ?? 1)
}

function baseSpeed(segment: Segment, sim: number) {
  if (segment.card === 'title') return 1.6
  // A steady shot runs in real time, easing only a little into each contact.
  if (segment.steady)
    return segment.impacts.some((i) => sim >= i.at - 2 && sim < i.at + 8) ? 1.4 : 2
  if (portraitAt(segment, sim)) return 1.1
  if (segment.impacts.some((i) => sim >= i.at - 2 && sim < i.at + 10)) return 0.6
  if (segment.beats.some((b) => sim >= b.at - 1 && sim < b.at + 10)) return 1.1
  const busy = segment.states[Math.floor(sim)]?.player.attack
  const soon = segment.beats.some((b) => sim >= b.at - 20 && sim < b.at)
  return busy || soon ? 2 : 3.2
}

function natural(segment: Segment) {
  let n = 0
  for (let sim = 0; sim < segment.states.length - 1; n++) sim += speedAt(segment, sim)
  return n
}

function fxAt(local: number, kicks: { at: number; power: number }[], length: number) {
  const fx = calm()
  fx.zoom = 1 + 0.05 * (local / length)
  if (local < 3) fx.flash = 0.7 - local * 0.23
  if (local < 5) fx.lines = 1 - local / 5
  for (const k of kicks) {
    const d = local - k.at
    if (d < 0 || d > 14) continue
    const e = Math.exp(-d / (2.4 + k.power * 1.5))
    fx.zoom += 0.08 * k.power * e
    fx.shakeX += noise(local * 3.1 + k.at) * 20 * k.power * e
    fx.shakeY += noise(local * 7.7 + k.at) * 14 * k.power * e
    fx.tilt += (k.at % 2 ? 1 : -1) * 1.3 * k.power * e
    fx.split += k.power * e
    if (d < 2) fx.flash = Math.max(fx.flash, 0.3 * k.power * (1 - d / 2))
    if (k.power > 1.2) fx.lines = Math.max(fx.lines, e)
  }
  return fx
}

function segmentShots(segment: Segment, place: { index: number; start: number; last: boolean }) {
  const { index, start, last } = place
  const beats = Math.min(
    10,
    Math.max(segment.part ? 2 : 4, Math.round(natural(segment) / BEAT / 2) * 2),
  )
  const length = beats * BEAT
  const scale = natural(segment) / length
  const shots: Shot[] = []
  const kicks: { at: number; power: number }[] = []
  const cues: AudioCue[] = [{ at: start, kind: 'whoosh' }]
  let sim = 0
  let impact = 0
  let beat = 0
  const end = segment.states.length - 1
  for (let local = 0; local < length; local++) {
    const speed = speedAt(segment, sim) * scale
    while (beat < segment.beats.length && segment.beats[beat].at <= sim + speed) {
      if (segment.beats[beat].word) {
        kicks.push({ at: local, power: 1 })
        cues.push({ at: start + local, kind: 'key' })
      }
      beat++
    }
    while (impact < segment.impacts.length && segment.impacts[impact].at <= sim + speed) {
      const hit = segment.impacts[impact]
      const power = hit.critical ? 1.6 : hit.damage > 14 ? 1.3 : 0.8
      kicks.push({ at: local, power })
      cues.push({ at: start + local, kind: power > 1.4 ? 'final' : power > 1 ? 'crit' : 'hit' })
      impact++
    }
    const shown = [...segment.beats].reverse().find((b) => b.at <= sim)
    shots.push({
      kind: 'clip',
      clip: index,
      local,
      length,
      sim: Math.min(end, sim),
      beat: shown ? { ...shown, age: 0 } : undefined,
      portrait: portraitAt(segment, sim),
      title: segment.card === 'title',
      fx: calm(),
    })
    sim = Math.min(end, sim + speed)
  }
  // Callout age in output frames, measured from the frame the beat first appears.
  const firstSeen = new Map<number, number>()
  for (const shot of shots)
    if (shot.kind === 'clip' && shot.beat) {
      if (!firstSeen.has(shot.beat.at)) firstSeen.set(shot.beat.at, shot.local)
      shot.beat.age = shot.local - firstSeen.get(shot.beat.at)!
    }
  for (const shot of shots)
    if (shot.kind === 'clip') {
      shot.fx = fxAt(shot.local, kicks, length)
      // Portraits keep the lens steady: only the flash survives.
      if (shot.portrait) shot.fx = { ...calm(), flash: shot.fx.flash, zoom: 1 }
      // A steady cut is a plain cut: no flash or speed lines unless a blow lands there.
      if (segment.steady && shot.local < 5 && !kicks.some((k) => Math.abs(k.at - shot.local) < 2))
        shot.fx = { ...shot.fx, flash: 0, lines: 0 }
    }
  if (last) cues.push({ at: start + Math.round(length * 0.3), kind: 'final' })
  return { shots, cues }
}

const TITLE = 0
const OUTRO = BEAT * 6

export function buildTimeline(segments: Segment[]) {
  const shots: Shot[] = []
  const cues: AudioCue[] = [{ at: 0, kind: 'riser' }]
  for (let local = 0; local < TITLE; local++) shots.push({ kind: 'title', local, length: TITLE })
  segments.forEach((segment, index) => {
    if (index === 1) cues.push({ at: shots.length, kind: 'drop' })
    const part = segmentShots(segment, {
      index,
      start: shots.length,
      last: index === segments.length - 1,
    })
    shots.push(...part.shots)
    cues.push(...part.cues)
  })
  cues.push({ at: shots.length, kind: 'drop' })
  for (let local = 0; local < OUTRO; local++) shots.push({ kind: 'outro', local, length: OUTRO })
  return { shots, cues, fps: FPS, bpm: BPM, beat: BEAT }
}
