import { recordRoutes, type Route } from '../fighting-signature-flow/routes'
import { chainShots, type Shot, type SpanRule } from '../fighting-signature-flow/chain'
import { naturalCamera, fitDistances, type Placed } from '../fighting-signature-flow/timeline'
import { tickFight } from '../../src/lib/fighting/engine'
import { EMPTY_INPUT, type FightState } from '../../src/lib/fighting/types'

/** 150 BPM at 30 fps: a beat is 12 frames, a bar 48. */
export const BEAT = 12
export const BAR = 48
/** The finisher lands on the third beat of its bar and freezes there. */
export const FREEZE_AT = 36
export const FREEZE = 6

export type Section = 'hook' | 'build' | 'rush' | 'brake' | 'drop' | 'end'
export interface Cut extends Placed {
  section: Section
  /** Local frame where a finisher freezes on its impact. */
  freeze?: number
  rank?: number
  damage?: number
}

/** Top three signature finishers by real combo damage, weakest first; the hook teases #1. */
export const FINISHERS = ['beyond', 'biscuit', 'franklin'] as const
const BUILD = { shots: 20, frames: BEAT, rule: { min: 14, max: 34, ideal: 24 } }
const RUSH = { shots: 16, frames: BEAT / 2, rule: { min: 7, max: 18, ideal: 12 } }
const LEFT_OUT = ['rihan']

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

/** Real speed in, half speed for the last beat, freeze on the hit, a beat of aftermath. */
function finisherSims(states: readonly FightState[]) {
  const impact = finalImpact(states)
  const clamp = (s: number) => Math.max(0, Math.min(states.length - 1, s))
  return Array.from({ length: BAR }, (_, f) => {
    if (f < FREEZE_AT - 8) return clamp(impact - 8 - (FREEZE_AT - 8 - f) * 2)
    if (f < FREEZE_AT) return clamp(impact - (FREEZE_AT - f))
    if (f < FREEZE_AT + FREEZE) return clamp(impact)
    return clamp(impact + (f - FREEZE_AT - FREEZE + 1) * 2)
  })
}

function finisher(route: Route, section: Section) {
  const sims = finisherSims(route.states)
  const shot: Shot = { route, from: sims[0], to: sims.at(-1)! + 1 }
  const finalDamage = Math.max(...route.states.map((s) => s.opponent.comboDamage ?? 0))
  return { shot, sims, section, freeze: FREEZE_AT, damage: finalDamage }
}

/** Evenly spread over the slot; the strike at each end stays exactly on the cut. */
function chainSims(shot: Shot, frames: number) {
  return Array.from({ length: frames }, (_, f) =>
    Math.round(shot.from + (f / Math.max(1, frames - 1)) * (shot.to - 1 - shot.from)),
  )
}

/**
 * Translate each incoming chain camera so both strikes share one screen point. The offset is
 * held for the short shot, and capped so the pair never drifts out of the portrait frame.
 */
function alignChain(cuts: Cut[]) {
  for (let i = 1; i < cuts.length; i++) {
    const a = cuts[i - 1]
    const b = cuts[i]
    const out = a.shot.exit
    const into = b.shot.entry
    if (!out || !into || a.section === 'hook' || b.section === 'drop') continue
    const last = a.camera.at(-1)!
    const first = b.camera[0]
    const cap = (v: number) => Math.max(-0.45, Math.min(0.45, v))
    const dx = cap(into.hit.x - first.x - (out.hit.x - last.x))
    const dy = cap(into.hit.y - first.lookY - (out.hit.y - last.lookY))
    b.camera = b.camera.map((c) => ({ ...c, x: c.x + dx, lookY: c.lookY + dy }))
  }
}

function held(cut: Cut, section: Section, frames: number): Cut {
  return {
    ...cut,
    section,
    sims: Array(frames).fill(cut.sims.at(-1)),
    camera: Array(frames).fill(cut.camera.at(-1)),
    freeze: undefined,
  }
}

export function buildCuts(): Cut[] {
  const routes = recordRoutes().filter((r) => !r.error)
  const byId = (id: string) =>
    extend(
      routes.find((r) => r.id === id && !r.mirrored)!,
      40,
    )
  const pool = routes.filter((r) => ![...FINISHERS, ...LEFT_OUT].includes(r.id as never))
  const ruleAt = (i: number): SpanRule => (i < BUILD.shots ? BUILD.rule : RUSH.rule)
  const chain = chainShots(pool, { ruleAt, open: true })
  const raw: Omit<Cut, 'start' | 'camera'>[] = [
    finisher(byId(FINISHERS[2]), 'hook'),
    ...chain.map((shot, i) => {
      const section: Section = i < BUILD.shots ? 'build' : 'rush'
      return { shot, section, sims: chainSims(shot, i < BUILD.shots ? BUILD.frames : RUSH.frames) }
    }),
    ...FINISHERS.map((id, i) => ({ ...finisher(byId(id), 'drop' as const), rank: 3 - i })),
  ]
  let start = 0
  const cuts: Cut[] = raw.map((r) => {
    const cut = { ...r, start, camera: naturalCamera(r.shot, r.sims) }
    start += r.sims.length
    return cut
  })
  alignChain(cuts)
  fitDistances(cuts)
  const brake = held(cuts[BUILD.shots + RUSH.shots], 'brake', BEAT * 2)
  const end = held(cuts.at(-1)!, 'end', BEAT * 2)
  const ordered = [...cuts.slice(0, 1 + BUILD.shots + RUSH.shots), brake, ...cuts.slice(-3), end]
  let at = 0
  return ordered.map((c) => {
    const placed = { ...c, start: at }
    at += c.sims.length
    return placed
  })
}

export const SECTION_SHOTS = { build: BUILD.shots, rush: RUSH.shots }
