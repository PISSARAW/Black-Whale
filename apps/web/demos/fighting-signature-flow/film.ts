import { recordRoutes } from './routes'
import { chainShots, strikeDistance } from './chain'
import { placeShots, impactCues, FPS, BPM, GRID } from './timeline'

export { FPS }
const PREROLL = 24

/** The whole film: every fighter once, chained strike into strike. */
export function buildFilm(only?: readonly string[]) {
  const routes = recordRoutes(only)
  const placed = placeShots(chainShots(routes.filter((r) => !r.error)))
  const frames = placed.reduce((n, p) => n + p.sims.length, 0)
  const at = (frame: number) => {
    let index = placed.findIndex((p) => frame < p.start + p.sims.length)
    if (index < 0) index = placed.length - 1
    const p = placed[index]
    const local = Math.min(p.sims.length - 1, frame - p.start)
    return { index, placed: p, local, sim: p.sims[local], camera: p.camera[local] }
  }
  return { routes, placed, frames, at }
}

export type Film = ReturnType<typeof buildFilm>

/** Report read by render-fighting-combo-edit.mjs and combo-edit-music.py. */
export function filmReport(film: Film) {
  const { placed, frames } = film
  const sims = Array.from({ length: frames }, (_, f) => film.at(f).sim)
  const cuts = placed.map((p) => p.start)
  const failures = [
    ...new Set(film.routes.filter((r) => r.error).map((r) => `${r.id}: ${r.error}`)),
  ]
  return {
    fps: FPS,
    bpm: BPM,
    beat: GRID * 2,
    frames,
    duration: frames / FPS,
    failures,
    cuts,
    /** Simulation frame each shot is loaded at, so its attack clocks run into the cut. */
    prerolls: cuts.map((c) => Math.max(0, sims[c] - PREROLL)),
    sims,
    clock: sims.map((s, i) =>
      cuts.includes(i) ? 1000 / 60 : Math.max(1, ((s - sims[i - 1]) * 1000) / 60),
    ),
    cues: [
      ...placed.slice(1).map((p) => ({ at: p.start, kind: 'whoosh' })),
      ...placed.flatMap(impactCues),
      { at: frames - 45, kind: 'final' },
    ],
    clips: placed.map((p, i) => ({
      id: p.shot.route.id,
      stage: 'heavens-arena',
      frames: p.sims.length,
      impacts: impactCues(p).length,
      observed: [p.shot.route.title, p.shot.route.mirrored ? 'mirrored' : 'facing right'],
      events: [`sim ${p.shot.from}-${p.shot.to}`],
      matchDistance: i ? +strikeDistance(placed[i - 1].shot.exit!, p.shot.entry!).toFixed(3) : 0,
    })),
  }
}
