import { priorityLineOfSight } from './priorityOptics'
import { ownsDowsing, dowsingBodyReady } from './dowsingRules'
import { performMapDowsing } from './dowsingMap'
import { dowsingMapOptions } from './dowsingMapOptions'
import { battleAppearance } from './battleCantabileRules'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState, FighterId } from './types'

export interface RecordedStatement {
  frame: number
  sequence: number
  subject: FighterId
  appearance: FighterId
  text: string
  consciousLie?: boolean
}
declare module './preparationTypes' {
  interface PreparedEntity {
    statements?: readonly RecordedStatement[]
  }
}
declare module './types' {
  interface ArcadeFighter {
    dowsingAcquaintances?: readonly { key: string; subject: FighterId; appearance: FighterId }[]
    dowsingLocation?: { frame: number; appearance: FighterId; direction: 'left' | 'right' | 'here' }
    dowsingInvestigation?: { remainingFrames: number; mode: 'map' | 'video' }
  }
}

/** A camera records an actual voluntary statement; its hidden intent is not a public UI oracle. */
export function recordDowsingStatement(
  state: FightState,
  options: { speaker: FightSide; text: string; lie: boolean },
): FightState {
  if (!state.battlefield) return state
  const speaker = state[options.speaker]
  const statement: RecordedStatement = {
    frame: state.frame,
    sequence: 0,
    subject: speaker.id,
    appearance: battleAppearance(speaker),
    text: options.text,
    consciousLie: options.lie,
  }
  const entities = state.battlefield.entities.map((entry) => {
    if (
      entry.kind !== 'camera' ||
      !entry.present ||
      entry.health <= 0 ||
      Math.hypot(entry.x - speaker.x, entry.y - speaker.y) > 18
    )
      return entry
    if (
      !priorityLineOfSight(state, {
        x: entry.x,
        y: entry.y + 2,
        targetX: speaker.x,
        targetY: speaker.y + 10,
      })
    )
      return entry
    return {
      ...entry,
      statements: [
        ...(entry.statements ?? []),
        { ...statement, sequence: (entry.statements?.at(-1)?.sequence ?? 0) + 1 },
      ].slice(-32),
    }
  })
  return { ...state, battlefield: { ...state.battlefield, entities } }
}

export function performDowsingEvidence({ state, side, command }: ArsenalInvocation): FightState {
  return command.action === 'dowsing-locate'
    ? performMapDowsing(state, side, command.target)
    : state
}

/** Meeting a visible person is recorded independently from whether a later answer is truthful. */
export function advanceDowsingEvidence(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const actor = next[side]
    if (!ownsDowsing(actor)) continue
    const acquaintances = rememberSubject(state, side)
    const investigation = actor.dowsingInvestigation
    if (!investigation && acquaintances === actor.dowsingAcquaintances) continue
    const remainingFrames = (investigation?.remainingFrames ?? 0) - 1
    next = {
      ...next,
      [side]: {
        ...actor,
        dowsingAcquaintances: acquaintances,
        dowsingInvestigation:
          investigation && remainingFrames > 0 && dowsingBodyReady(actor)
            ? { ...investigation, remainingFrames }
            : undefined,
      },
    }
  }
  return next
}

function rememberSubject(state: FightState, side: FightSide) {
  const actor = state[side],
    target = state[side === 'player' ? 'opponent' : 'player']
  const known = actor.dowsingAcquaintances
  if (target.health <= 0 || Math.hypot(actor.x - target.x, actor.y - target.y) > 18) return known
  if (known?.some((entry) => entry.subject === target.id)) return known
  if (
    !priorityLineOfSight(state, {
      x: actor.x,
      y: actor.y + 10,
      targetX: target.x,
      targetY: target.y + 10,
    })
  )
    return known
  return [
    ...(known ?? []),
    {
      key: `contact:${side}:${state.frame}`,
      subject: target.id,
      appearance: battleAppearance(target),
    },
  ]
}

export function dowsingEvidenceOptions(state: FightState, side: FightSide): ArsenalOption[] {
  return dowsingMapOptions(state, side)
}
