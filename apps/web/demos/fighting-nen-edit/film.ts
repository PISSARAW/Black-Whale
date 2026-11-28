import { buildCuts, BEAT, PIVOT_FREEZE, type Cut } from './shots'
import { lookAt, shownCategory } from './effects'

export const FPS = 30

/** Real contacts by the shot's fighter before its finisher, as local frames. */
function hitsOf(cut: Cut) {
  const states = cut.shot.route.states
  const hits: number[] = []
  let seen = states[Math.max(0, cut.sims[0] - 1)].impact?.sequence ?? -1
  cut.sims.forEach((sim, f) => {
    for (let s = f ? cut.sims[f - 1] + 1 : sim; s <= sim; s++) {
      const impact = states[s].impact
      if (!impact || impact.sequence === seen) continue
      seen = impact.sequence
      if (impact.attacker === 'player' && f < cut.impact) hits.push(f)
    }
  })
  return hits
}

export function buildFilm() {
  const cuts = buildCuts()
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
      look: lookAt(cut, local),
      category: shownCategory(cut, local),
    }
  }
  return { cuts, frames, at }
}

export type Film = ReturnType<typeof buildFilm>

function cues(film: Film) {
  const out: { at: number; kind: string }[] = []
  for (const c of film.cuts) {
    if (c.kind === 'end') continue
    if (c.opens) out.push({ at: c.start, kind: 'whoosh' })
    for (const h of hitsOf(c)) out.push({ at: c.start + h, kind: 'hit' })
    out.push({ at: c.start + c.impact, kind: c.kind === 'hook' ? 'crit' : 'final' })
    if (c.kind === 'pivot') out.push({ at: c.start + PIVOT_FREEZE + BEAT / 2, kind: 'key' })
  }
  return out
}

/** Report read by the renderer and nen-edit-music.py. */
export function filmReport(film: Film) {
  const sims = Array.from({ length: film.frames }, (_, f) => film.at(f).sim)
  const cuts = film.cuts.map((c) => c.start)
  const pivot = film.cuts.find((c) => c.kind === 'pivot')!
  return {
    fps: FPS,
    bpm: 150,
    beat: BEAT,
    frames: film.frames,
    duration: film.frames / FPS,
    failures: [],
    sections: film.cuts.filter((c) => c.opens).map((c) => ({ at: c.start, category: c.category })),
    hookEnd: film.cuts.find((c) => c.kind !== 'hook')!.start,
    pivotFreeze: [pivot.start + PIVOT_FREEZE, pivot.start + PIVOT_FREEZE + BEAT],
    end: film.cuts.at(-1)!.start,
    cuts,
    prerolls: cuts.map((c) => Math.max(0, sims[c] - 12)),
    sims,
    clock: sims.map((s, i) =>
      cuts.includes(i) ? 1000 / 30 : Math.max(1, ((s - sims[i - 1]) * 1000) / 60),
    ),
    cues: cues(film),
    clips: film.cuts.map((c) => ({
      id: c.shot.route.id,
      stage: c.kind,
      frames: c.sims.length,
      impacts: 0,
      observed: [c.category],
      events: [`sim ${c.sims[0]}-${c.sims.at(-1)}`],
    })),
  }
}
