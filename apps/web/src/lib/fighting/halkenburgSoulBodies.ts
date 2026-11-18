import { createFightState } from './fightState'
import { controlledSoulKey, principalMind, soulBodyKey, stopSoulBody } from './halkenburgSoulTypes'
import { teamSoulBodies } from './halkenburgSoulTeams'
import { teamEntry } from './teamRelayRules'
import type { HalkenburgMind } from './halkenburgSoulTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { PreparedEntity } from './preparationTypes'
import type { RosterGuest } from './rosterGuests'

export interface SoulBodyRecord {
  key: string
  body: ArcadeFighter
  originalGuest?: RosterGuest
}
export function collectSoulBodies(state: FightState): SoulBodyRecord[] {
  const main = (['player', 'opponent'] as const).map((side) => ({
    key: soulBodyKey(state, side),
    body: markMainBody(state, side),
  }))
  const records: SoulBodyRecord[] = [
    ...main,
    ...(state.rosterGuests ?? []).map((guest) => ({
      key: guest.fighter.halkSoul?.key ?? `guest:${guest.id}`,
      originalGuest: guest,
      body: guest.fighter.halkSoul
        ? guest.fighter
        : {
            ...guest.fighter,
            halkSoul: {
              key: `guest:${guest.id}`,
              origin: guest.owner,
              mind: {
                key: `mind:guest:${guest.id}`,
                side: guest.owner,
                principal: false,
                identity: guest.fighter.id,
              },
            },
          },
    })),
    ...teamSoulBodies(state),
  ]
  const unique = new Map<string, SoulBodyRecord>()
  for (const record of records) if (!unique.has(record.key)) unique.set(record.key, record)
  return [...unique.values()]
}
function markMainBody(state: FightState, side: FightSide): ArcadeFighter {
  const body = state[side]
  return body.halkSoul
    ? body
    : {
        ...body,
        halkSoul: { key: soulBodyKey(state, side), origin: side, mind: principalMind(state, side) },
      }
}
export function promoteCohortBody(
  state: FightState,
  side: FightSide,
  entity: PreparedEntity,
): SoulBodyRecord {
  const key = `entity:${entity.id}`,
    mind: HalkenburgMind = { key: `mind:${key}`, side, principal: false }
  const template = createFightState('halkenburg', state[side].id, {
    mode: state.mode,
    formatId: state.formatId,
    environment: state.environment,
  }).player
  const body = stopSoulBody({
    ...template,
    x: entity.x,
    y: entity.y,
    facing: state[side].facing,
    health: entity.health,
    maxHealth: entity.health,
    aura: Math.min(55, state[side].aura),
    equipment: [],
    weaponsConfiscated: true,
    halkCohortBody: entity.id,
    halkSoul: { key, origin: side, mind },
    halkForeignMind: true,
  })
  return { key, body }
}
export function routeSoulBodies(state: FightState, bodies: SoulBodyRecord[]): FightState {
  const chosen = new Map<FightSide, SoulBodyRecord>()
  for (const side of ['player', 'opponent'] as const) {
    const candidates = bodies.filter(
      ({ body }) => body.halkSoul?.mind?.key === controlledSoulKey(state, side),
    )
    candidates.sort((a, b) => priority(b.body) - priority(a.body))
    if (candidates[0]) {
      const record = candidates[0]
      enterSoulBody(record, side)
      chosen.set(side, record)
    }
  }
  for (const side of ['player', 'opponent'] as const) {
    if (chosen.has(side)) continue
    const spare = bodies.find(
      (record) => ![...chosen.values()].includes(record) && record.body.health <= 0,
    )
    if (spare) chosen.set(side, spare)
  }
  // Every supported transfer starts with two real seats and never duplicates a body.
  if (!chosen.get('player') || !chosen.get('opponent')) return state
  const rosterGuests = bodies
    .filter((record) => ![...chosen.values()].includes(record) && !record.body.halkSoul?.offstage)
    .map(soulGuest)
  return {
    ...state,
    player: chosen.get('player')!.body,
    opponent: chosen.get('opponent')!.body,
    rosterGuests: rosterGuests.length ? rosterGuests : undefined,
  }
}
function enterSoulBody(record: SoulBodyRecord, side: FightSide) {
  if (!record.body.halkSoul?.offstage) return
  record.body = {
    ...teamEntry(record.body, side),
    halkSoul: { ...record.body.halkSoul, offstage: false },
  }
}
function priority(body: ArcadeFighter): number {
  return Number(body.health > 0) * 2 + Number(!body.halkSoulSleep)
}
function soulGuest(record: SoulBodyRecord): RosterGuest {
  const body = record.body,
    old = record.originalGuest
  if (old && !body.halkSoul?.linked) return { ...old, fighter: body }
  return {
    ...soulGuestIdentity(record),
    owner: body.halkSoul?.mind?.side ?? body.halkSoul!.origin,
    role: 'soul',
    phase: body.health > 0 ? 'acting' : 'eliminated',
    fighter: body,
  }
}
function soulGuestIdentity(record: SoulBodyRecord) {
  const old = record.originalGuest
  return {
    id: old?.id ?? `soul:${record.key}`,
    frames: old?.frames ?? 0,
    cooldown: old?.cooldown ?? 0,
  }
}
