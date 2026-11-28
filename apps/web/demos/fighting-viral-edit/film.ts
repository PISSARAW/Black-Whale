import { fighterDefinition } from '../../src/lib/fighting/roster'
import { buildCuts, BEAT, BAR, FREEZE_AT, type Cut } from './shots'
import { lookAt } from './effects'

export const FPS = 30

/** Real contacts by the shot's fighter, as local frames of the shot. */
function hitsOf(cut: Cut) {
  const states = cut.shot.route.states
  const hits: number[] = []
  let seen = states[Math.max(0, cut.sims[0] - 1)].impact?.sequence ?? -1
  cut.sims.forEach((sim, f) => {
    for (let s = f ? cut.sims[f - 1] + 1 : sim; s <= sim; s++) {
      const impact = states[s].impact
      if (!impact || impact.sequence === seen) continue
      seen = impact.sequence
      if (impact.attacker === 'player') hits.push(f)
    }
  })
  return hits
}

export function buildFilm() {
  const cuts = buildCuts()
  const hits = cuts.map((c) => (c.section === 'brake' || c.section === 'end' ? [] : hitsOf(c)))
  const frames = cuts.reduce((n, c) => n + c.sims.length, 0)
  const at = (frame: number) => {
    let index = cuts.findIndex((c) => frame < c.start + c.sims.length)
    if (index < 0) index = cuts.length - 1
    const cut = cuts[index]
    const local = Math.min(cut.sims.length - 1, frame - cut.start)
    return {
      index,
      cut,
      local,
      sim: cut.sims[local],
      camera: cut.camera[local],
      look: lookAt(cut, local, hits[index]),
      name: fighterDefinition(cut.shot.route.id).name,
    }
  }
  return { cuts, hits, frames, at }
}

export type Film = ReturnType<typeof buildFilm>

function sections(film: Film) {
  const spans: Record<string, [number, number]> = {}
  for (const c of film.cuts) {
    const span = spans[c.section] ?? [c.start, c.start]
    spans[c.section] = [span[0], c.start + c.sims.length]
  }
  return spans
}

function cues(film: Film) {
  const out: { at: number; kind: string }[] = []
  film.cuts.forEach((c, i) => {
    if (c.section === 'drop') out.push({ at: c.start, kind: 'whoosh' })
    if (c.freeze !== undefined) out.push({ at: c.start + c.freeze, kind: 'final' })
    const finisher = c.freeze !== undefined
    for (const h of film.hits[i])
      if (!finisher || h < (c.freeze ?? 0)) out.push({ at: c.start + h, kind: 'hit' })
  })
  return out
}

/** Report read by the renderer and viral-edit-music.py. */
export function filmReport(film: Film) {
  const sims = Array.from({ length: film.frames }, (_, f) => film.at(f).sim)
  const cuts = film.cuts.map((c) => c.start)
  return {
    fps: FPS,
    bpm: 150,
    beat: BEAT,
    bar: BAR,
    frames: film.frames,
    duration: film.frames / FPS,
    failures: [],
    sections: sections(film),
    freezes: film.cuts.filter((c) => c.freeze !== undefined).map((c) => c.start + FREEZE_AT),
    cuts,
    prerolls: cuts.map((c) => Math.max(0, sims[c] - 12)),
    sims,
    clock: sims.map((s, i) =>
      cuts.includes(i) ? 1000 / 30 : Math.max(1, ((s - sims[i - 1]) * 1000) / 60),
    ),
    cues: cues(film),
    clips: film.cuts.map((c) => ({
      id: c.shot.route.id,
      stage: c.section,
      frames: c.sims.length,
      impacts: 0,
      observed: [c.rank ? `#${c.rank}` : '', c.damage ? `${c.damage} dmg` : ''],
      events: [`sim ${c.sims[0]}-${c.sims.at(-1)}`],
    })),
  }
}
