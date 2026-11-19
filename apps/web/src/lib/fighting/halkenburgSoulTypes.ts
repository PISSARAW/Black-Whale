import type { FightSide, ArcadeFighter } from './types'

export function halkenburgOwnBody(body: ArcadeFighter): boolean {
  return !body.halkenburgSoul && !body.halkenburgSleeping && !body.halkenburgPassenger
}

export interface HalkenburgPassenger {
  id: string
  owner: FightSide
  motion?: 'left' | 'right' | 'stay'
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
  initiatorAwake?: boolean
  victimAwake?: boolean
  victimMotion?: 'left' | 'right' | 'stay'
  /** Viewer-only readiness; never accepted from an input packet as authority. */
  victimWakeReady?: boolean
}

declare module './types' {
  interface ArcadeFighter {
    halkenburgChosenSoul?: HalkenburgSoulBody
    halkenburgSoul?: HalkenburgSoulExchange
    halkenburgSleeping?: string
    halkenburgPassenger?: HalkenburgPassenger
  }
}
declare module './preparationTypes' {
  interface PreparedEntity {
    halkenburgSleeping?: string
    halkenburgPassenger?: HalkenburgPassenger
  }
}
