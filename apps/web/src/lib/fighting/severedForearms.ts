import { physicalBodyKey, visibleBodyAppearance } from './fightBodyIdentity'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState, FighterId } from './types'

export const SEVERED_FOREARMS = ['left-forearm', 'right-forearm'] as const
export type SeveredForearm = (typeof SEVERED_FOREARMS)[number]
export interface DetachedForearm {
  bodyKey: string
  part: SeveredForearm
  appearance: FighterId
}
declare module './preparationTypes' {
  interface PreparedEntity {
    detachedForearm?: DetachedForearm
  }
}

/** This explicit scenario supplies the original material, not newly generated flesh. */
export function prepareSeveredForearms(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  const entities: PreparedEntity[] = SEVERED_FOREARMS.map((part, index) => ({
    id: `forearm:${physicalBodyKey(state, side)}:${part}`,
    kind: 'body-part',
    owner: side,
    material: 'real',
    present: true,
    health: 20,
    x: actor.x + (index === 0 ? -2 : 2),
    y: 0,
    arena: { width: 2, height: 1 },
    detachedForearm: {
      bodyKey: physicalBodyKey(state, side),
      part,
      appearance: visibleBodyAppearance(actor),
    },
  }))
  return {
    ...state,
    [side]: { ...actor, bodyDamage: { parts: [...SEVERED_FOREARMS] } },
    battlefield: {
      ...(state.battlefield ?? {
        interactionHeld: { player: false, opponent: false },
        completed: { player: 0, opponent: 0 },
      }),
      entities: [...(state.battlefield?.entities ?? []), ...entities],
    },
  }
}

export function forearmNode(part: SeveredForearm): string {
  return part === 'left-forearm' ? 'elbow-left' : 'elbow-right'
}
