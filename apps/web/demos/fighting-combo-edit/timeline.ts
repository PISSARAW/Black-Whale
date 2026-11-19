import type { ComboClip } from './jCombo'
import type { DirectionalEnding } from '../../src/lib/fighting/directionalChain'

/** 150 BPM at 30 fps: one beat is exactly twelve output frames. */
export const FPS = 30
export const BEAT = 12
export const BPM = 150

export interface Fx {
  zoom: number
  shakeX: number
  shakeY: number
  tilt: number
  flash: number
  split: number
  dark: number
  lines: number
}
export type Shot =
  | { kind: 'title'; local: number; length: number }
  | { kind: 'outro'; local: number; length: number }
  | {
      kind: 'clip'
      clip: number
      local: number
      length: number
      sim: number
      speed: number
      hits: number
      damage: number
      pressed: number
      final: boolean
      slow: boolean
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

/** Deterministic noise so every export is identical. */
function noise(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

/**
 * Simulation frames per output frame (2 = real time). The finish wind-up plays slower so
 * the directional camera move reads; the contact itself is a hard slow motion.
 */
function speedAt(clip: ComboClip, sim: number) {
  const finish = clip.presses[2].at
  const finishHit = clip.impacts[2].at
  const last = clip.impacts.at(-1)!.at
  if (sim >= finishHit - 2 && sim < finishHit + 14) return 0.45
  if (sim >= last - 2 && sim < last + 16) return 0.5
  if (sim >= last + 16) return 1.7
  if (sim >= finish && sim < finishHit) return 1.15
  const near = clip.impacts.some((i) => sim >= i.at - 2 && sim < i.at + 4)
  return near ? 1.5 : 2.3
}

function naturalLength(clip: ComboClip) {
  let frames = 0
  for (let sim = 0; sim < clip.states.length - 1; frames++) sim += speedAt(clip, sim)
  return frames
}

interface Kick {
  at: number
  power: number
  final: boolean
}

/** Each ending pushes the frame its own way, on top of the game's directional camera. */
const FINAL_PUSH: Record<DirectionalEnding, { x: number; y: number; zoom: number }> = {
  ground: { x: 10, y: 34, zoom: 0.16 },
  air: { x: 8, y: -30, zoom: 0.08 },
  close: { x: 14, y: 12, zoom: 0.26 },
  carry: { x: 38, y: 8, zoom: 0.14 },
}

function fxAt(local: number, take: { kicks: Kick[]; clip: ComboClip; length: number }): Fx {
  const { kicks, clip, length } = take
  const fx = calm()
  fx.zoom = 1.0 + 0.045 * (local / length)
  if (local < 3) fx.flash = 0.7 - local * 0.23
  if (local < 5) fx.lines = 1 - local / 5
  const push = FINAL_PUSH[clip.ending]
  for (const k of kicks) {
    const d = local - k.at
    if (d < 0 || d > 16) continue
    const e = Math.exp(-d / (k.final ? 5.5 : 2.4))
    const x = k.final ? push.x : 18
    const y = k.final ? push.y : 12
    fx.zoom += (k.final ? push.zoom : 0.07 * k.power) * e
    fx.shakeX += (k.final ? Math.sign(noise(k.at)) || 1 : noise(local * 3.1 + k.at)) * x * e
    fx.shakeY += noise(local * 7.7 + k.at) * y * e
    fx.tilt += (k.at % 2 ? 1 : -1) * 1.3 * k.power * e
    fx.split += k.power * e
    if (d < 2) fx.flash = Math.max(fx.flash, (k.final ? 0.78 : 0.24) * (1 - d / 2))
    if (k.final) {
      fx.dark = Math.max(fx.dark, 0.35 * e)
      fx.lines = Math.max(fx.lines, e)
    }
  }
  return fx
}

function clipShots(clip: ComboClip, index: number, start: number) {
  const natural = naturalLength(clip)
  const beats = Math.min(8, Math.max(4, Math.round(natural / BEAT / 2) * 2))
  const length = beats * BEAT
  const scale = natural / length
  const shots: Shot[] = []
  const kicks: Kick[] = []
  const cues: AudioCue[] = [{ at: start, kind: 'whoosh' }]
  let sim = 0
  let nextImpact = 0
  let pressed = 0
  const lastSim = clip.states.length - 1
  for (let local = 0; local < length; local++) {
    const speed = speedAt(clip, sim) * scale
    while (pressed < clip.presses.length && clip.presses[pressed].at <= sim + speed) {
      cues.push({ at: start + local, kind: 'key' })
      pressed++
    }
    while (nextImpact < clip.impacts.length && clip.impacts[nextImpact].at <= sim + speed) {
      const impact = clip.impacts[nextImpact]
      const final = nextImpact >= 2
      kicks.push({ at: local, power: final ? 1.6 : impact.critical ? 1.2 : 0.8, final })
      cues.push({ at: start + local, kind: final ? 'final' : impact.critical ? 'crit' : 'hit' })
      nextImpact++
    }
    const state = clip.states[Math.min(lastSim, Math.floor(sim))]
    shots.push({
      kind: 'clip',
      clip: index,
      local,
      length,
      sim: Math.min(lastSim, sim),
      speed,
      hits: state.opponent.comboHits,
      damage: clip.impacts.filter((i) => i.at <= sim).reduce((sum, i) => sum + i.damage, 0),
      pressed,
      final: nextImpact >= 3,
      slow: speedAt(clip, sim) < 0.6,
      fx: calm(),
    })
    sim = Math.min(lastSim, sim + speed)
  }
  for (const shot of shots)
    if (shot.kind === 'clip') shot.fx = fxAt(shot.local, { kicks, clip, length })
  return { shots, cues }
}

const TITLE = BEAT * 4
const OUTRO = BEAT * 6

/** Cuts land on the beat: every clip lasts an even number of beats. */
export function buildTimeline(clips: ComboClip[]) {
  const shots: Shot[] = []
  const cues: AudioCue[] = [{ at: 0, kind: 'riser' }]
  for (let local = 0; local < TITLE; local++) shots.push({ kind: 'title', local, length: TITLE })
  cues.push({ at: TITLE, kind: 'drop' })
  clips.forEach((clip, index) => {
    const part = clipShots(clip, index, shots.length)
    shots.push(...part.shots)
    cues.push(...part.cues)
  })
  cues.push({ at: shots.length, kind: 'drop' })
  for (let local = 0; local < OUTRO; local++) shots.push({ kind: 'outro', local, length: OUTRO })
  return { shots, cues, fps: FPS, bpm: BPM, beat: BEAT, title: TITLE, outro: OUTRO }
}
