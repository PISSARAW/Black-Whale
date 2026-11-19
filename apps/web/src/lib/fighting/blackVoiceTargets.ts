import { physicalBodyAt } from './fightBodyIdentity'
import { updateEntity } from './preparationWorld'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { PreparedEntity } from './preparationTypes'
import type { BlackVoiceControl } from './blackVoiceTypes'

export interface VoiceTarget {
  id: string
  x: number
  y: number
  health: number
  body?: ArcadeFighter
  side?: FightSide
  member?: number
  entity?: PreparedEntity
  control?: BlackVoiceControl
}
export function voiceTarget(state: FightState, id: string): VoiceTarget | undefined {
  const match = /^(?:body:)?(player|opponent)(?::([0-2]))?$/.exec(id)
  if (match) {
    const side = match[1] as FightSide
    const member = Number(match[2] ?? state.teamMatch?.seats[side].active ?? 0)
    const body = physicalBodyAt(state, side, member)
    return (
      body && {
        ...body,
        id: `body:${side}:${member}`,
        body,
        side,
        member,
        control: body.blackVoiceControl,
      }
    )
  }
  const entity = state.battlefield?.entities.find((entry) => entry.id === id && entry.present)
  return entity && { ...entity, entity, control: entity.blackVoiceControl }
}
export function voiceTargets(state: FightState): VoiceTarget[] {
  const result: VoiceTarget[] = []
  for (const side of ['player', 'opponent'] as const) result.push(...seatTargets(state, side))
  for (const entry of state.battlefield?.entities ?? []) {
    if (!['morena', 'supporter', 'person'].includes(entry.kind) || entry.copy) continue
    const target = voiceTarget(state, entry.id)
    if (target) result.push(target)
  }
  return result
}
function seatTargets(state: FightState, side: FightSide): VoiceTarget[] {
  const count = state.teamMatch?.seats[side].members.length ?? 1
  return Array.from({ length: count }, (_, member) =>
    voiceTarget(state, `body:${side}:${member}`),
  ).filter((target): target is VoiceTarget => Boolean(target))
}

export function changeVoiceTarget(
  state: FightState,
  target: VoiceTarget,
  change: Partial<ArcadeFighter> & Partial<PreparedEntity>,
): FightState {
  if (target.entity) return updateEntity(state, target.id, change)
  const side = target.side!
  const seat = state.teamMatch?.seats[side]
  if (!seat || seat.active === target.member)
    return { ...state, [side]: { ...state[side], ...change } }
  return {
    ...state,
    teamMatch: {
      ...state.teamMatch!,
      seats: {
        ...state.teamMatch!.seats,
        [side]: {
          ...seat,
          members: seat.members.map((body, index) =>
            index === target.member ? { ...body, ...change } : body,
          ),
        },
      },
    },
  }
}
export function targetAlreadyControlled(target: VoiceTarget): boolean {
  if (target.control?.active || target.entity?.controller) return true
  const body = target.body
  return Boolean(
    body &&
    (body.needlePuppet ||
      body.hatsuEffects.manipulatedFrames > 0 ||
      body.hatsuEffects.possessedFrames > 0 ||
      body.hatsuEffects.momozeFrames > 0),
  )
}

export function hasVoiceControl(state: FightState): boolean {
  if (state.player.blackVoiceControl || state.opponent.blackVoiceControl) return true
  for (const side of ['player', 'opponent'] as const)
    if (state.teamMatch?.seats[side].members.some((body) => body.blackVoiceControl)) return true
  return Boolean(state.battlefield?.entities.some((entry) => entry.blackVoiceControl))
}
