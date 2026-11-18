import type { ArcadeFighter, FightSide, FightState, FighterId } from './types'

export type HalkenburgMode = 'roster' | 'souls'
export interface HalkenburgMind {
  key: string
  side: FightSide
  principal: boolean
  identity?: FighterId
}
export interface HalkenburgSoulLink {
  id: number
  owner: FightSide
  sourceBody: string
  targetBody: string
  sourceMind: HalkenburgMind
  targetMind: HalkenburgMind
  sourceSleep: number
  targetSleep: number
  /** Scripted scenario preparation for the returning mind; not a pharmacological simulation. */
  preparedSedative: number
  phase: 'swapped' | 'cohabiting' | 'source-lost' | 'ended'
}
export interface HalkenburgSoulBody {
  key: string
  linked?: boolean
  origin: FightSide
  mind?: HalkenburgMind
}
declare module './types' {
  interface ArcadeFighter {
    halkSoul?: HalkenburgSoulBody
    halkSoulSleep?: boolean
    halkSoulAlive?: boolean
    halkForeignMind?: boolean
    halkCohortBody?: string
    halkSedativeSpent?: boolean
  }
  interface FightState {
    halkenburgModes?: Partial<Record<FightSide, HalkenburgMode>>
    halkSoulLinks?: HalkenburgSoulLink[]
    halkSoulOrigins?: Record<FightSide, FighterId>
  }
}

export function halkenburgMode(state: FightState, side: FightSide): HalkenburgMode {
  return state.halkenburgModes?.[side] ?? 'roster'
}
export function soulBodyKey(state: FightState, side: FightSide): string {
  const body = state[side]
  if (body.halkSoul) return body.halkSoul.key
  const key = `main:${body.id}:${body.halkenburgTransferFrame ?? 0}:${state.teamMatch?.seats[side].active ?? 0}`
  const other = side === 'player' ? 'opponent' : 'player'
  // A mirror match contains two distinct material bodies with the same roster identity.
  return state[other].id === body.id ? `${key}:${side}` : key
}
export function principalMind(state: FightState, side: FightSide): HalkenburgMind {
  return {
    key: `mind:${side}`,
    side,
    principal: true,
    identity: state.halkSoulOrigins?.[side] ?? state[side].id,
  }
}
export function bodyInSoulLink(state: FightState, key: string): boolean {
  return Boolean(
    state.halkSoulLinks?.some((link) => link.sourceBody === key || link.targetBody === key),
  )
}
export function setSoulOccupant(
  body: ArcadeFighter,
  mind: HalkenburgMind | undefined,
  sleeping: boolean,
): ArcadeFighter {
  const changed = body.halkSoul?.mind?.key !== mind?.key || body.halkSoulSleep !== sleeping
  const next = {
    ...body,
    halkSoul: { ...body.halkSoul!, mind },
    halkSoulSleep: sleeping,
    halkForeignMind: !mind?.identity || mind.identity !== body.id,
  }
  return changed ? stopSoulBody(next) : next
}
export function stopSoulBody(body: ArcadeFighter): ArcadeFighter {
  return {
    ...body,
    attack: null,
    bufferedAttack: null,
    blocking: false,
    guardFrames: 0,
    wakeupInvulnerableFrames: 0,
    reversalWindow: 0,
    hatsuChargeFrames: 0,
    motion: undefined,
    pose: body.halkSoulSleep ? 'down' : 'idle',
  }
}
