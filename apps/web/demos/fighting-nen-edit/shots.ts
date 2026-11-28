import { recordRoutes, type Route } from '../fighting-signature-flow/routes'
import type { Shot } from '../fighting-signature-flow/chain'
import { naturalCamera, fitDistances, type Placed } from '../fighting-signature-flow/timeline'
import { tickFight } from '../../src/lib/fighting/engine'
import { fightWorldX } from '../../src/lib/fighting/fightCoordinates'
import { EMPTY_INPUT, type FightState } from '../../src/lib/fighting/types'
import { groups, PIVOT, type Category } from './groups'

/** 150 BPM at 30 fps: a beat is 12 frames. */
export const BEAT = 12
/** Each fighter gets two beats; the finisher lands on the second. */
export const SHOT = BEAT * 2
export const IMPACT = BEAT
export const HOOK_SHOT = BEAT / 2
export const END = BEAT * 4
/** Kurapika: two beats of combo, a beat frozen on Emperor Time, a beat into Judgment Chain. */
export const PIVOT_FREEZE = BEAT * 2
export const PIVOT_IMPACT = BEAT * 4

export type Kind = 'hook' | 'fighter' | 'pivot' | 'end'
export interface Cut extends Placed {
  kind: Kind
  category: Category
  /** First shot of its category: the section title pops in. */
  opens: boolean
  /** Local frame of the finisher contact. */
  impact: number
  title: string
  name: string
}

function extend(route: Route, frames: number): Route {
  const states = [...route.states]
  let state = states.at(-1)!
  for (let i = 0; i < frames; i++) {
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    states.push(state)
  }
  return { ...route, states }
}

/** A signature route ends on its finisher: the fighter's last contact. */
function finalImpact(states: readonly FightState[]) {
  for (let i = states.length - 1; i > 0; i--) {
    const impact = states[i].impact
    if (impact?.attacker === 'player' && impact.sequence !== states[i - 1].impact?.sequence)
      return i
  }
  return states.length - 1
}

const clampTo = (states: readonly unknown[]) => (s: number) =>
  Math.max(0, Math.min(states.length - 1, Math.round(s)))

/** Real speed into the finisher, two frames held on the hit, real speed after. */
function finisherSims(route: Route, { length, impact }: { length: number; impact: number }) {
  const hit = finalImpact(route.states)
  const clamp = clampTo(route.states)
  return Array.from({ length }, (_, f) => {
    if (f < impact) return clamp(hit - (impact - f) * 2)
    if (f < impact + 2) return clamp(hit)
    return clamp(hit + (f - impact - 1) * 2)
  })
}

/** Combo up to Emperor Time, frozen on the scarlet eyes, then accelerating into the finisher. */
function pivotSims(route: Route) {
  const clamp = clampTo(route.states)
  const emperor = route.states.findIndex((s) => s.player.kurapika?.emperorTime)
  const hit = finalImpact(route.states)
  const reach = (hit - emperor) / (PIVOT_IMPACT - PIVOT_FREEZE - BEAT)
  return Array.from({ length: PIVOT_IMPACT + SHOT - IMPACT }, (_, f) => {
    if (f < PIVOT_FREEZE) return clamp(emperor - (PIVOT_FREEZE - f) * 2)
    if (f < PIVOT_FREEZE + BEAT) return clamp(emperor)
    if (f < PIVOT_IMPACT) return clamp(emperor + (f - PIVOT_FREEZE - BEAT) * reach)
    if (f < PIVOT_IMPACT + 2) return clamp(hit)
    return clamp(hit + (f - PIVOT_IMPACT - 1) * 2)
  })
}

type Raw = Omit<Cut, 'start' | 'camera'>

function fighterCut(route: Route, { category, opens }: { category: Category; opens: boolean }) {
  const pivot = route.id === PIVOT
  const sims = pivot ? pivotSims(route) : finisherSims(route, { length: SHOT, impact: IMPACT })
  const shot: Shot = { route, from: sims[0], to: sims.at(-1)! + 1 }
  return {
    shot,
    sims,
    kind: pivot ? 'pivot' : 'fighter',
    category,
    opens,
    impact: pivot ? PIVOT_IMPACT : IMPACT,
    title: route.title,
    name: route.name,
  } satisfies Raw
}

/** One beat, four finishers from four categories, each landing on its half beat. */
function hookCuts(byId: (id: string) => Route): Raw[] {
  const picks: [string, Category][] = [
    ['hisoka', 'transmuter'],
    ['franklin', 'emitter'],
    ['illumi', 'manipulator'],
    ['chrollo', 'specialist'],
  ]
  return picks.map(([id, category]) => {
    const route = byId(id)
    const sims = finisherSims(route, { length: HOOK_SHOT * 2, impact: HOOK_SHOT })
    return {
      ...fighterCut(route, { category, opens: false }),
      sims,
      shot: { route, from: sims[0], to: sims.at(-1)! + 1 },
      kind: 'hook' as const,
      impact: HOOK_SHOT,
    }
  })
}

export function buildCuts(): Cut[] {
  const routes = recordRoutes().filter((r) => !r.error && !r.mirrored)
  const cache = new Map<string, Route>()
  const byId = (id: string) => {
    if (!cache.has(id))
      cache.set(
        id,
        extend(
          routes.find((r) => r.id === id)!,
          40,
        ),
      )
    return cache.get(id)!
  }
  const raw: Raw[] = [
    ...hookCuts(byId),
    ...groups().flatMap(({ category, fighters }) =>
      fighters.map((id, i) =>
        // Specialization is announced by Kurapika's Emperor Time, not by its first fighter.
        fighterCut(byId(id), { category, opens: i === 0 && category !== 'specialist' }),
      ),
    ),
  ]
  const last = raw.at(-1)!
  raw.push({ ...last, kind: 'end', opens: false, sims: Array(END).fill(last.sims.at(-1)) })
  let start = 0
  const cuts: Cut[] = raw.map((r) => {
    const cut = { ...r, start, camera: naturalCamera(r.shot, r.sims) }
    start += r.sims.length
    return cut
  })
  fitDistances(cuts)
  for (const cut of cuts) if (cut.kind === 'pivot') pushIn(cut)
  return cuts
}

/** During the Emperor Time freeze the camera closes in on Kurapika's scarlet eyes. */
function pushIn(cut: Cut) {
  cut.camera = cut.camera.map((frame, f) => {
    const t = Math.min(1, Math.max(0, (f - PIVOT_FREEZE) / BEAT))
    const held = f >= PIVOT_FREEZE && f < PIVOT_FREEZE + BEAT
    if (!held) return frame
    const { player } = cut.shot.route.states[cut.sims[f]]
    const x = frame.x + (fightWorldX(player.x) - frame.x) * t
    // The scene keeps the framed body whole, so only Kurapika is framed while held.
    return {
      ...frame,
      x,
      lookY: frame.lookY + 0.6 * t,
      z: frame.z * (1 - 0.45 * t),
      focus: 'player' as const,
    }
  })
}
