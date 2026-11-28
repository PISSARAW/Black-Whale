import { fightWorldX, fightWorldY } from '../../src/lib/fighting/fightCoordinates'
import { fitCinematicView, type CinematicFrame } from '../../src/lib/fighting/cinematicTrack'
import type { FightState } from '../../src/lib/fighting/types'
import { recordFeitanCombos, type Combo } from './record'

export const FPS = 30
const BPM = 150
/** Shot lengths snap to eighth notes so every cut sits on the beat. */
const GRID = 6
export const INTRO = 36
export const HOLD = 54
const Z = 5.6
const Z_MAX = 7.6
const ASPECT = 720 / 1280
const FOLLOW = 0.25

export interface Placed {
  combo: Combo
  start: number
  sims: number[]
  camera: CinematicFrame[]
}

/** Real speed (two simulation frames per video frame), length snapped to the grid. */
function comboSims(combo: Combo, hold: number) {
  const span = combo.to - combo.from
  const frames = Math.max(2, Math.round(span / 2 / GRID)) * GRID
  const sims = Array.from({ length: frames }, (_, f) =>
    Math.round(combo.from + (f / (frames - 1)) * span),
  )
  return [...sims, ...Array<number>(hold).fill(combo.to)]
}

/** Between Feitan and his target; a far target never drags Feitan off frame. */
function centreOf(state: FightState) {
  const player = fightWorldX(state.player.x)
  const half = (fightWorldX(state.opponent.x) - player) / 2
  return player + Math.max(-1, Math.min(1, half))
}

function camera(combo: Combo, sims: readonly number[]): CinematicFrame[] {
  let x = 0
  let lookY = 0
  return sims.map((sim, f) => {
    const state = combo.states[sim]
    const height = Math.max(fightWorldY(state.player.y), fightWorldY(state.opponent.y))
    x = f ? x + (centreOf(state) - x) * FOLLOW : centreOf(state)
    lookY = f ? lookY + (1.05 + height * 0.6 - lookY) * FOLLOW : 1.05 + height * 0.6
    const frame: CinematicFrame = { x, lookY, z: Z, intensity: 0 }
    const z = fitCinematicView(frame, state, ASPECT).z
    if (z <= Z_MAX) return { ...frame, z }
    const focused = { ...frame, focus: 'player' as const }
    return { ...focused, z: Math.min(z, fitCinematicView(focused, state, ASPECT).z) }
  })
}

export function buildFilm() {
  const all = recordFeitanCombos()
  const combos = all.filter((c) => !c.error)
  let start = 0
  const placed: Placed[] = combos.map((combo, i) => {
    const sims = comboSims(combo, i === combos.length - 1 ? HOLD : 0)
    const p = { combo, start, sims, camera: camera(combo, sims) }
    start += sims.length
    return p
  })
  const frames = start
  const at = (frame: number) => {
    let index = placed.findIndex((p) => frame < p.start + p.sims.length)
    if (index < 0) index = placed.length - 1
    const p = placed[index]
    const local = Math.min(p.sims.length - 1, frame - p.start)
    return { index, placed: p, local, sim: p.sims[local], camera: p.camera[local] }
  }
  return { all, placed, frames, at }
}

export type Film = ReturnType<typeof buildFilm>

function impactCues(p: Placed) {
  const cues: { at: number; kind: string }[] = []
  const states = p.combo.states
  let seen = states[Math.max(0, p.sims[0] - 1)].impact?.sequence ?? -1
  p.sims.forEach((sim, f) => {
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

/** Report read by the renderer and combo-edit-music.py. */
export function filmReport(film: Film) {
  const { placed, frames } = film
  const sims = Array.from({ length: frames }, (_, f) => film.at(f).sim)
  const cuts = placed.map((p) => p.start)
  return {
    fps: FPS,
    bpm: BPM,
    beat: GRID * 2,
    frames,
    duration: frames / FPS,
    failures: [],
    skipped: film.all.filter((c) => c.error).map((c) => `${c.id}: ${c.error}`),
    cuts,
    prerolls: cuts.map((c) => Math.max(0, sims[c] - 12)),
    sims,
    clock: sims.map((s, i) =>
      cuts.includes(i) ? 1000 / 30 : Math.max(1, ((s - sims[i - 1]) * 1000) / 60),
    ),
    cues: [
      ...placed.slice(1).map((p) => ({ at: p.start, kind: 'whoosh' })),
      ...placed.flatMap(impactCues),
      { at: frames - HOLD, kind: 'final' },
    ],
    clips: placed.map((p) => ({
      id: p.combo.id,
      stage: 'heavens-arena',
      frames: p.sims.length,
      impacts: p.combo.hits,
      observed: [p.combo.family, p.combo.title],
      events: [`${p.combo.damage} dmg`, p.combo.kameo ?? ''],
    })),
  }
}
