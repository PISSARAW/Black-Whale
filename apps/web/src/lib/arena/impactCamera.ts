import { impactPresentation } from '../fighting/fightImpactPresentation'
import { moveById } from '../fighting/movesets'
import type { CombatSide, CombatState } from '../combat/types'
import type { Vec2 } from '../tour/types'

const FRAME_RATE = 60

/** Deterministic POV recoil driven only by the authored contact freeze. */
export function arenaImpactCamera(state: CombatState, viewer: CombatSide = 'player'): Vec2 {
  const event = activeContact(state)
  if (!event) return [0, 0]
  const duration = event.hitstop!
  const kind = moveById(event.moveId)?.kind ?? fallbackKind(event.technique)
  const profile = impactPresentation({
    kind,
    blocked: event.impact === 'blocked',
    critical: ['critical', 'ko'].includes(event.impact),
    knockdown: ['knockdown', 'ko'].includes(event.impact),
    wallSplat: false,
    parried: event.parried,
  })
  const age = (duration - state.hitstop) * FRAME_RATE
  const fade = Math.min(1, state.hitstop / duration) ** 2
  const weight = impactWeight(event.impact, event.parried, kind)
  const direction = event.attacker === viewer ? -1 : 1
  return [
    Math.sin(age * 1.7) * Math.min(0.065, profile.shakeX * weight) * fade * direction,
    Math.cos(age * 1.4) * Math.min(0.044, profile.shakeY * weight) * fade,
  ]
}

function activeContact(state: CombatState): NonNullable<CombatState['lastEvent']> | null {
  const event = state.lastEvent
  if (!event || !event.hitstop || state.hitstop <= 0 || event.impact === 'miss') return null
  return event
}

function fallbackKind(technique: NonNullable<CombatState['lastEvent']>['technique']) {
  return technique === 'hatsu' ? ('special' as const) : ('light' as const)
}

function impactWeight(
  impact: NonNullable<CombatState['lastEvent']>['impact'],
  parried: boolean | undefined,
  kind: NonNullable<ReturnType<typeof moveById>>['kind'],
): number {
  if (impact === 'blocked' && !parried) return 0.25
  return kind === 'light' ? 0.3 : 0.8
}
