import type { FightProjectile, FightState, ProjectileShape } from '../types'
import type { FightSoundEvent } from './events'

interface Interception {
  id: number
  frame: number
  x: number
  side: FightProjectile['owner']
  shape: ProjectileShape
  terrain: boolean
  concealed: boolean
}
declare module '../types' {
  interface FightState {
    audioInterceptions?: readonly Interception[]
  }
}

export function retainProjectileInterception(
  state: FightState,
  projectile: FightProjectile,
  terrain: boolean,
): FightState {
  if (state.forecastSimulation) return state
  const held = state.audioInterceptions ?? []
  return {
    ...state,
    audioInterceptions: [
      ...held,
      {
        id: projectile.id,
        frame: state.frame,
        x: projectile.x,
        side: projectile.owner,
        shape: projectile.shape,
        terrain,
        concealed: Boolean(projectile.concealed && projectile.matter !== 'object'),
      },
    ].slice(-16),
  }
}

export function interceptionEvents(before: FightState, after: FightState): FightSoundEvent[] {
  const history = after.audioInterceptions
  if (!history || history === before.audioInterceptions) return []
  const heard = new Set(before.audioInterceptions?.map(({ id }) => id))
  return history
    .filter((entry) => !heard.has(entry.id) && after.frame - entry.frame <= 20)
    .map(({ shape, side, x, terrain, concealed, id }) => ({
      kind: 'projectile-intercept',
      shape,
      side,
      x,
      terrain,
      concealed,
      take: id % 4,
    }))
}
