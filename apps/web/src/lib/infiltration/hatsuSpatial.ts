import type { Vec2 } from '../tour/types'

export interface LittleEyeScout {
  position: Vec2
  spaceId: string
  heading: number
  signal: number
  noticed: boolean
  active: boolean
}
export const deployScout = (position: Vec2, spaceId: string): LittleEyeScout => ({
  position,
  spaceId,
  heading: 0,
  signal: 100,
  noticed: false,
  active: true,
})
/** Where the scout is being sent, and whether a guard saw it get there. */
export interface ScoutMove {
  position: Vec2
  spaceId: string
  visibleToGuard: boolean
}

export function moveScout(
  scout: LittleEyeScout,
  { position, spaceId, visibleToGuard }: ScoutMove,
): LittleEyeScout {
  if (!scout.active) return scout
  const distance = Math.hypot(position[0] - scout.position[0], position[1] - scout.position[1])
  const signal = Math.max(0, scout.signal - distance * 4)
  return {
    ...scout,
    position,
    spaceId,
    signal,
    noticed: scout.noticed || visibleToGuard,
    active: signal > 0,
  }
}

export type InspectionMethod = 'visual' | 'touch' | 'registry'
export function inspectForgery(
  method: InspectionMethod,
  hasAura: boolean,
): 'accepted' | 'suspicious' | 'revealed' {
  if (method === 'registry' || method === 'touch') return 'revealed'
  return hasAura ? 'suspicious' : 'accepted'
}

/** What the observer brings to the encounter. */
export interface DisguiseEncounter {
  knowsModel: boolean
  behaviouralMismatch: boolean
  usesGyo: boolean
  /** False once the disguise has lapsed, at which point recognition is certain. */
  active: boolean
}

export function recognizesDisguise({
  knowsModel,
  behaviouralMismatch,
  usesGyo,
  active,
}: DisguiseEncounter): boolean {
  if (!active) return true
  return (knowsModel && behaviouralMismatch) || usesGyo
}
