import type { FightSide, ArcadeFighter } from './types'

export function halkenburgOwnBody(body: ArcadeFighter): boolean {
  return !body.halkenburgSoul && !body.halkenburgSleeping
}

export type HalkenburgSoulBody =
  { kind: 'fighter'; owner: FightSide; member: number } | { kind: 'supporter'; id: string }

export interface HalkenburgSoulExchange {
  id: string
  owner: FightSide
  donor?: HalkenburgSoulBody
  target: { owner: FightSide; member: number }
  /** The source body sleeps while the initiating consciousness occupies the pierced body. */
  stage: 'exchanged'
  motion?: 'left' | 'right' | 'stay'
}

declare module './types' {
  interface ArcadeFighter {
    halkenburgChosenSoul?: HalkenburgSoulBody
    halkenburgSoul?: HalkenburgSoulExchange
    halkenburgSleeping?: string
  }
}
declare module './preparationTypes' {
  interface PreparedEntity {
    halkenburgSleeping?: string
  }
}
