import type { FightSide, ArcadeFighter, FightState, FighterId } from './types'

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

export type HalkenburgMode = 'roster' | 'souls'
export interface HalkenburgMind {
  key: string
  side: FightSide
  principal: boolean
  identity?: FighterId
  teamIndex?: number
}
export interface HalkenburgMindState {
  mind: HalkenburgMind
  body: string
  returnBody?: string
  priority: number
  sleep: number
  alive: boolean
  eliminated?: boolean
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
  preparedSedative: number
  phase: 'swapped' | 'cohabiting' | 'source-lost' | 'ended'
}
export interface HalkenburgGraphBody {
  key: string
  linked?: boolean
  origin: FightSide
  mind?: HalkenburgMind
  offstage?: boolean
}

declare module './types' {
  interface ArcadeFighter {
    halkSoul?: HalkenburgGraphBody
    halkSoulSleep?: boolean
    halkSoulAlive?: boolean
    halkForeignMind?: boolean
    halkCohortBody?: string
    halkSedativeSpent?: boolean
    halkTeamMind?: string
    halkRosterMind?: string
    halkSoulLowShot?: boolean
  }
  interface FightState {
    halkenburgModes?: Partial<Record<FightSide, HalkenburgMode>>
    halkSoulLinks?: HalkenburgSoulLink[]
    halkSoulOrigins?: Record<FightSide, FighterId>
    halkSoulMinds?: HalkenburgMindState[]
  }
}

export function halkenburgMode(state: FightState, side: FightSide): HalkenburgMode {
  return state.halkenburgModes?.[side] ?? 'roster'
}
export function soulBodyKey(state: FightState, side: FightSide): string {
  const body = state[side]
  if (body.halkSoul) return body.halkSoul.key
  if (state.teamMatch) return `team:${side}:${state.teamMatch.seats[side].active}`
  const key = `main:${body.id}:${body.halkenburgTransferFrame ?? 0}:0`
  const other = side === 'player' ? 'opponent' : 'player'
  return state[other].id === body.id ? `${key}:${side}` : key
}
export function principalMind(state: FightState, side: FightSide): HalkenburgMind {
  return {
    key: controlledSoulKey(state, side),
    side,
    principal: true,
    identity: state[side].halkenburgOrigin ?? state[side].id,
    ...(state.teamMatch ? { teamIndex: state.teamMatch.seats[side].active } : {}),
  }
}
export function controlledSoulKey(state: FightState, side: FightSide): string {
  return state.teamMatch ? `mind:${side}:${state.teamMatch.seats[side].active}` : `mind:${side}`
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
    halkForeignMind: soulIsForeign(body, mind),
  }
  return changed ? stopSoulBody(next) : next
}
function soulIsForeign(body: ArcadeFighter, mind: HalkenburgMind | undefined): boolean {
  if (mind && body.halkRosterMind === mind.key) return false
  return Boolean(body.halkCohortBody) || !mind?.identity || mind.identity !== body.id
}
export function preserveRosterSoul(actor: ArcadeFighter, body: ArcadeFighter): ArcadeFighter {
  if (!actor.halkSoul) return body
  return {
    ...body,
    halkSoul: actor.halkSoul,
    halkSoulAlive: actor.halkSoulAlive,
    halkTeamMind: actor.halkTeamMind,
    halkRosterMind: actor.halkSoul.mind?.key,
    halkForeignMind: false,
  }
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
    halkSoulLowShot: undefined,
    motion: undefined,
    pose: body.halkSoulSleep ? 'down' : 'idle',
  }
}
