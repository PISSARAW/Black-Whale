import type { ArcadeFighter, FightSide, FightState, FighterId } from './types'

export type HalkenburgMode = 'roster' | 'souls'
export interface HalkenburgMind {
  key: string
  side: FightSide
  principal: boolean
  identity?: FighterId
  teamIndex?: number
}
/** Authoritative position of a mind; links are transfer history, never copies of occupants. */
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
  /** Scripted scenario preparation for the returning mind; not a pharmacological simulation. */
  preparedSedative: number
  phase: 'swapped' | 'cohabiting' | 'source-lost' | 'ended'
}
export interface HalkenburgSoulBody {
  key: string
  linked?: boolean
  origin: FightSide
  mind?: HalkenburgMind
  offstage?: boolean
}
declare module './types' {
  interface ArcadeFighter {
    halkSoul?: HalkenburgSoulBody
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
  // A mirror match contains two distinct material bodies with the same roster identity.
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
/** Preserve the requested variant's existing grant only for its own roster mind. */
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
