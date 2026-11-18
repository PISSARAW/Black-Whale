import { priorityLineOfSight } from './priorityOptics'
import { resolveGuardianLie } from './tserriednichGuardian'
import { dowsingBodyReady, ownsDowsing } from './dowsingRules'
import { battleAppearance } from './battleCantabileRules'
import { canHear } from './melodyRules'
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
  state = resolveGuardianLie(state, options.speaker, options.lie)
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
  const actor = state[side]
  if (
    !ownsDowsing(actor) ||
    !dowsingBodyReady(actor) ||
    actor.aura < 3 ||
    actor.dowsingInvestigation
  )
    return state
  if (command.action === 'dowsing-locate') return locatePerson(state, side, command.target)
  if (command.action !== 'dowsing-video' || !actor.kurapika?.emperorTime) return state
  return analyseVideo(state, side, command.target)
}
function locatePerson(state: FightState, side: FightSide, key?: string): FightState {
  const actor = state[side]
  const known = actor.dowsingAcquaintances?.find((entry) => entry.key === key)
  if (!known) return state
  const bodies = [
    state.player,
    state.opponent,
    ...(state.rosterGuests ?? [])
      .filter((guest) => guest.phase !== 'eliminated')
      .map((guest) => guest.fighter),
  ]
  const target = bodies.find((body) => body.id === known.subject && body.health > 0)
  if (!target) return state
  const difference = target.x - actor.x
  return {
    ...state,
    [side]: {
      ...actor,
      aura: actor.aura - 3,
      dowsingInvestigation: { remainingFrames: 30, mode: 'map' },
      dowsingLocation: {
        frame: state.frame,
        appearance: known.appearance,
        direction: Math.abs(difference) < 2 ? 'here' : difference < 0 ? 'left' : 'right',
      },
    },
  }
}
function analyseVideo(state: FightState, side: FightSide, target?: string): FightState {
  const actor = state[side]
  const split = target?.lastIndexOf('|') ?? -1
  if (split < 0) return state
  const cameraId = target!.slice(0, split),
    sequence = Number(target!.slice(split + 1))
  const camera = state.battlefield?.entities.find(
    (entry) =>
      entry.id === cameraId && entry.kind === 'camera' && entry.present && entry.health > 0,
  )
  if (!camera || Math.hypot(camera.x - actor.x, camera.y - actor.y) > 6 || !canHear(actor))
    return state
  const statement = camera.statements?.find(
    (entry) =>
      entry.sequence === sequence &&
      actor.dowsingAcquaintances?.some((known) => known.subject === entry.subject),
  )
  if (!statement) return state
  return {
    ...state,
    [side]: {
      ...actor,
      aura: actor.aura - 3,
      dowsingInvestigation: { remainingFrames: 30, mode: 'video' },
      dowsingReading: {
        frame: state.frame,
        text: statement.text,
        swings: statement.consciousLie === true,
      },
    },
  }
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
  if (!ownsDowsing(state[side])) return []
  const choices: { command: ArsenalInvocation['command']; fr: string; en: string }[] = (
    state[side].dowsingAcquaintances ?? []
  ).map((known) => ({
    command: { action: 'dowsing-locate', target: known.key },
    fr: `Dowsing · Localiser ${known.appearance}`,
    en: `Dowsing · Locate ${known.appearance}`,
  }))
  for (const camera of state.battlefield?.entities ?? []) {
    if (camera.kind !== 'camera' || !camera.present) continue
    for (const statement of camera.statements ?? [])
      choices.push({
        command: { action: 'dowsing-video', target: `${camera.id}|${statement.sequence}` },
        fr: `Dowsing · Analyser la vidéo (${Math.floor(statement.frame / 60)} s)`,
        en: `Dowsing · Analyse video (${Math.floor(statement.frame / 60)} s)`,
      })
  }
  return choices.map(({ command, fr, en }) => ({
    command,
    labelFr: fr,
    labelEn: en,
    ready: performDowsingEvidence({ state, side, command }) !== state,
    conditionFr:
      'Localisation d’une personne rencontrée : direction, sans lecture de ses intentions. Vidéo : enregistrement réel, sujet déjà rencontré et Emperor Time requis. Une croyance sincère erronée ne devient pas un mensonge conscient.',
    conditionEn:
      'Locate a previously met person: direction, no intent reading. Video requires a real recording, a previously met subject and Emperor Time. A sincere mistaken belief is not a knowing lie.',
  }))
}
