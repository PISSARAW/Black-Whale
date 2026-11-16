import type { ArcadeFighter, FighterId, FightSide, FightState } from './types'
import type { CameraAnchor, CameraDetail, CameraEvent, CameraPart } from './cinematicTypes'

export type CameraValue = string | number | boolean | null | undefined
export interface CameraContext {
  state: FightState
  side: FightSide
  other: FightSide
  self: ArcadeFighter
  target: ArcadeFighter
}
export interface CameraRule {
  id: string
  source?: FighterId
  label: readonly [string, string]
  select: (context: CameraContext) => CameraValue
  edge?: 'enter' | 'leave' | 'change' | 'increase' | 'decrease'
  matches?: (before: CameraValue, after: CameraValue) => boolean
  guard?: (context: CameraContext) => boolean
  anchors?: (context: CameraContext) => readonly CameraAnchor[]
  kind?: CameraDetail['kind']
  tip?: string
  frontal?: boolean
  elevation?: number
  isolate?: boolean
  private?: boolean
  priority?: number
  duration?: number
  strength?: number
}
export const rig = (side: FightSide, part: CameraPart = 'body'): CameraAnchor => ({
  type: 'rig',
  side,
  part,
})
export const point = (x: number, y: number, size = 0.4): CameraAnchor => ({
  type: 'point',
  x,
  y,
  size,
})
export const node = (name: string, fallback?: CameraAnchor, size = 0.6): CameraAnchor => ({
  type: 'node',
  name,
  fallback,
  size,
})
export const prop = (side: FightSide, name: string, part: CameraPart = 'hands'): CameraAnchor => ({
  type: 'node',
  actor: side,
  name,
  fallback: rig(side, part),
})
export const selfPart = (part: CameraPart) => (c: CameraContext) => [rig(c.side, part)]
export const targetPart = (part: CameraPart) => (c: CameraContext) => [rig(c.other, part)]
export const pair = (c: CameraContext) => [rig(c.side, 'hands'), rig(c.other, 'chest')]
export const actorContext = (state: FightState, side: FightSide): CameraContext => ({
  state,
  side,
  other: side === 'player' ? 'opponent' : 'player',
  self: state[side],
  target: state[side === 'player' ? 'opponent' : 'player'],
})

/** Pages and borrowed executions retain their real prerequisites; possession alone creates no event. */
export function cameraOwns(c: CameraContext, source?: FighterId): boolean {
  if (!source || c.self.id === source) return true
  if (source === 'longhi' && moonlightOwner(c)) return true
  if (borrowedSource(c, source)) return true
  return Boolean(c.self.chrolloBook?.pages.includes(source as Exclude<FighterId, 'chrollo'>))
}
function borrowedSource(c: CameraContext, source: FighterId): boolean {
  return c.self.attack?.hatsuSource === source || c.self.kurapika?.held?.source === source
}
function moonlightOwner(c: CameraContext): boolean {
  return c.state.moonlight?.active?.issuer === c.side || c.state.moonlight?.offer?.issuer === c.side
}
export function ruleValue(rule: CameraRule, c: CameraContext): CameraValue {
  return cameraOwns(c, rule.source) ? rule.select(c) : undefined
}
const active = (value: CameraValue) =>
  value !== undefined && value !== null && value !== false && value !== 0 && value !== ''
const EDGES = {
  enter: (a: CameraValue, b: CameraValue) => active(b) && a !== b,
  leave: (a: CameraValue, b: CameraValue) => active(a) && !active(b),
  change: (a: CameraValue, b: CameraValue) => a !== b && (active(a) || active(b)),
  increase: (a: CameraValue, b: CameraValue) =>
    typeof a === 'number' && typeof b === 'number' && b > a,
  decrease: (a: CameraValue, b: CameraValue) =>
    typeof a === 'number' && typeof b === 'number' && b < a,
}
export function ruleChanged(rule: CameraRule, a: CameraValue, b: CameraValue): boolean {
  return rule.matches ? rule.matches(a, b) : EDGES[rule.edge ?? 'enter'](a, b)
}
export function ruleEvent(rule: CameraRule, c: CameraContext): CameraEvent {
  return {
    cue: {
      frame: c.state.frame,
      side: c.side,
      strength: rule.strength ?? 1,
      hold: 22,
      release: 44,
    },
    detail: {
      kind: rule.kind ?? 'focus',
      side: c.side,
      labelFr: rule.label[0],
      labelEn: rule.label[1],
      anchors: rule.anchors?.(c) ?? [rig(c.side)],
      eventId: rule.id,
      observation: { rule: rule.id, value: ruleValue(rule, c) },
      source: rule.source,
      sourceSide: c.side,
      aura: !['theta', 'biscuit', 'beyond', 'padaille', 'illumi', 'gel'].includes(
        rule.source ?? '',
      ),
      frontal: rule.frontal,
      elevation: rule.elevation,
      isolate: rule.isolate,
      tip: rule.tip,
      privateTo: rule.private ? c.side : undefined,
    },
    duration: rule.duration ?? 54,
    priority: rule.priority ?? 2,
  }
}
/** Rule ids are stable audit keys, also used to avoid replaying a sustained condition every frame. */
export function rulesFor(
  source: FighterId,
  rules: readonly Omit<CameraRule, 'source'>[],
): CameraRule[] {
  return rules.map((rule) => ({ ...rule, id: `${source}.${rule.id}`, source }))
}
