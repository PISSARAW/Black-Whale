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
export function moveScout(
  scout: LittleEyeScout,
  position: Vec2,
  spaceId: string,
  visibleToGuard: boolean,
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

export function recognizesDisguise(
  knowsModel: boolean,
  behaviouralMismatch: boolean,
  usesGyo: boolean,
  active: boolean,
): boolean {
  if (!active) return true
  return (knowsModel && behaviouralMismatch) || usesGyo
}
