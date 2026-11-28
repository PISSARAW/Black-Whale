import { fightWorldX, fightWorldY } from '../../src/lib/fighting/fightCoordinates'
import { fitCinematicView, type CinematicFrame } from '../../src/lib/fighting/cinematicTrack'
import type { Shot } from './chain'
import { pairCentre } from './routes'

export const FPS = 30
export const BPM = 150
/** Cuts sit on eighth notes: 6 frames at 30 fps and 150 BPM. */
export const GRID = 6
/** Frames played at half speed on each side of a cut: the strike crosses the cut in slow motion. */
export const SLOW = 4
export const HOLD = 45
const Z = 5.4
const Z_MAX = 7.6
const ASPECT = 720 / 1280

export interface Placed {
  shot: Shot
  start: number
  /** Simulation frame shown at each local output frame. */
  sims: number[]
  camera: CinematicFrame[]
}

/** Half speed into and out of the cut, about real speed between, length snapped to the grid. */
export function shotSims(shot: Shot, hold = 0) {
  const span = shot.to - shot.from
  const middleSims = span - 2 * SLOW
  const frames = Math.max(3, Math.round((middleSims / 2 + 2 * SLOW) / GRID)) * GRID
  const middle = frames - 2 * SLOW
  const sims = Array.from({ length: frames }, (_, f) => {
    if (f < SLOW) return shot.from + f
    if (f >= frames - SLOW) return shot.to - (frames - f)
    const t = middle > 1 ? (f - SLOW) / (middle - 1) : 0
    return Math.round(shot.from + SLOW + t * (middleSims - 1))
  })
  return [...sims, ...Array<number>(hold).fill(shot.to - 1)]
}

const FOLLOW = 0.3
/** Frames over which a cut's alignment shift fades in (outgoing) and out (incoming). */
const SETTLE = 12

export function naturalCamera(shot: Shot, sims: readonly number[]) {
  let x = 0
  let lookY = 0
  return sims.map((sim, f) => {
    const { player, opponent } = shot.route.states[sim]
    const targetX = pairCentre(fightWorldX(player.x), fightWorldX(opponent.x))
    const targetY = 1.05 + Math.max(fightWorldY(player.y), fightWorldY(opponent.y)) * 0.6
    x = f ? x + (targetX - x) * FOLLOW : targetX
    lookY = f ? lookY + (targetY - lookY) * FOLLOW : targetY
    // Both bodies stay in frame: the distance grows when the target is knocked away.
    return { x, lookY, z: Z, intensity: 0 } satisfies CinematicFrame
  })
}

const ease = (t: number) => {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

/**
 * Both strikes must share one screen point. The shift that takes is split between the two
 * cameras: the outgoing one drifts by half before the cut, the incoming one recentres after.
 */
function alignCut(previous: Placed, placed: Placed) {
  const out = previous.shot.exit!
  const into = placed.shot.entry!
  const last = previous.camera.at(-1)!
  const first = placed.camera[0]
  const dx = (into.hit.x - first.x - (out.hit.x - last.x)) / 2
  const dy = (into.hit.y - first.lookY - (out.hit.y - last.lookY)) / 2
  const n = previous.camera.length
  previous.camera = previous.camera.map((frame, f) => {
    const w = ease((f - (n - SLOW - SETTLE)) / SETTLE)
    return { ...frame, x: frame.x - dx * w, lookY: frame.lookY - dy * w }
  })
  placed.camera = placed.camera.map((frame, f) => {
    const w = 1 - ease((f - SLOW) / SETTLE)
    return { ...frame, x: frame.x + dx * w, lookY: frame.lookY + dy * w }
  })
}

/** Pull back where a body would leave the vertical frame, and match distance across each cut. */
export function fitDistances(placed: Placed[]) {
  for (const p of placed)
    p.camera = p.camera.map((frame, f) => {
      const state = p.shot.route.states[p.sims[f]]
      const z = fitCinematicView(frame, state, ASPECT).z
      if (z <= Z_MAX) return { ...frame, z }
      // A target far across the arena would shrink both bodies: keep the striker framed only.
      const focused = { ...frame, focus: 'player' as const }
      return { ...focused, z: Math.min(z, fitCinematicView(focused, state, ASPECT).z) }
    })
  for (let i = 1; i < placed.length; i++) {
    const a = placed[i - 1].camera
    const b = placed[i].camera
    const z = Math.max(a.at(-1)!.z, b[0].z)
    for (let k = 1; k <= 8; k++) {
      const w = 1 - (k - 1) / 8
      const ai = a.length - k
      const bi = k - 1
      if (ai >= 0) a[ai] = { ...a[ai], z: Math.max(a[ai].z, z * w + a[ai].z * (1 - w)) }
      if (bi < b.length) b[bi] = { ...b[bi], z: Math.max(b[bi].z, z * w + b[bi].z * (1 - w)) }
    }
  }
}

export function placeShots(shots: readonly Shot[]): Placed[] {
  let start = 0
  const placed: Placed[] = []
  shots.forEach((shot, i) => {
    const sims = shotSims(shot, i === shots.length - 1 ? HOLD : 0)
    placed.push({ shot, start, sims, camera: naturalCamera(shot, sims) })
    start += sims.length
  })
  for (let i = 1; i < placed.length; i++) alignCut(placed[i - 1], placed[i])
  fitDistances(placed)
  return placed
}

/** Real engine contacts by the signature fighter, placed where their simulation frame plays. */
export function impactCues(p: Placed) {
  const cues: { at: number; kind: 'hit' | 'crit' }[] = []
  const states = p.shot.route.states
  let seen = states[Math.max(0, p.sims[0] - 1)].impact?.sequence ?? -1
  p.sims.forEach((sim, f) => {
    if (f && sim === p.sims[f - 1]) return
    for (let s = f ? p.sims[f - 1] + 1 : sim; s <= sim; s++) {
      const impact = states[s].impact
      if (!impact || impact.sequence === seen) continue
      seen = impact.sequence
      if (impact.attacker === 'player')
        cues.push({ at: p.start + f, kind: impact.critical ? 'crit' : 'hit' })
    }
  })
  return cues
}
