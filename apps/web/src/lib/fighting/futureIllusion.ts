import { futureBodyKey, captureFutureParticipants } from './futureParticipants'
import { canAct } from './fightActorState'
import { voluntaryNenAvailable } from './nenAccess'
import type { ArcadeFighter, FightSide, FightState, FighterId } from './types'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'

/** Separate late-arc application. Radius, battery cap and charge ratio are disclosed duel tuning. */
export const ILLUSION_RADIUS = 36
export const ILLUSION_BATTERY_CAP = 36000
declare module './types' {
  interface ArcadeFighter {
    futureStoredFrames?: number
    futureIllusionMode?: boolean
    futureIllusionActive?: boolean
  }
  interface FightState {
    futureIllusion?: {
      owner: FightSide
      x: number
      y: number
      participants: readonly FighterId[]
      participantBodies?: readonly string[]
      echo: ArcadeFighter
    }
  }
  interface FightProjectile {
    illusionHarmless?: boolean
  }
}
export function performFutureField({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side]
  if (actor.id !== 'tserriednich' || state.phase !== 'fighting' || state.catsName) return state
  if (command.action === 'future-field-stop' && state.futureIllusion?.owner === side)
    return endFutureField(state)
  if (command.action !== 'future-field-mode' || !fieldModeReady(state, side)) return state
  return { ...state, [side]: { ...actor, futureIllusionMode: !actor.futureIllusionMode } }
}
function fieldModeReady(state: FightState, side: FightSide): boolean {
  return canAct(state[side]) && !state[side].attack && !state.parallelFuture
}
export function startFutureField(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  if (!actor.futureIllusionMode || actor.id !== 'tserriednich' || !actor.futureStoredFrames)
    return state
  if (state.futureIllusion) return state
  return {
    ...state,
    [side]: { ...actor, futureIllusionActive: true },
    futureIllusion: {
      owner: side,
      x: actor.x,
      y: actor.y,
      echo: { ...actor, futureIllusionActive: false },
      ...captureFutureParticipants(state, side, {
        x: actor.x,
        y: actor.y,
        radius: ILLUSION_RADIUS,
      }),
    },
  }
}
export function advanceFutureField(state: FightState): FightState {
  if (state.forecastSimulation) return state
  for (const side of ['player', 'opponent'] as const) {
    const actor = state[side]
    if (actor.id !== 'tserriednich' || actor.futureIllusionActive || actor.nen.mode === 'zetsu')
      continue
    if (!voluntaryNenAvailable(actor, { requireReserve: true })) continue
    state = {
      ...state,
      [side]: {
        ...actor,
        futureStoredFrames: Math.min(ILLUSION_BATTERY_CAP, (actor.futureStoredFrames ?? 0) + 11),
      },
    }
  }
  const field = state.futureIllusion
  if (!field) return state
  const actor = state[field.owner]
  if (!fieldValid(actor, field)) return endFutureField(state)
  return {
    ...state,
    [field.owner]: { ...actor, futureStoredFrames: actor.futureStoredFrames! - 1 },
  }
}
function fieldValid(
  actor: ArcadeFighter,
  field: NonNullable<FightState['futureIllusion']>,
): boolean {
  return (
    actor.id === 'tserriednich' &&
    actor.health > 0 &&
    actor.nen.mode === 'zetsu' &&
    (actor.futureStoredFrames ?? 0) > 0 &&
    voluntaryNenAvailable(actor, { allowVoluntaryZetsu: true }) &&
    Math.hypot(actor.x - field.x, actor.y - field.y) <= ILLUSION_RADIUS
  )
}
export function endFutureField(state: FightState): FightState {
  const owner = state.futureIllusion?.owner
  if (!owner) return state
  return {
    ...state,
    futureIllusion: undefined,
    parallelFuture: undefined,
    futurePerception: undefined,
    [owner]: { ...state[owner], futureIllusionActive: false, parallelEyesClosed: false },
  }
}
export function fieldDeceives(state: FightState, observer: FightSide): boolean {
  const field = state.futureIllusion
  return Boolean(
    field &&
    state.phase === 'fighting' &&
    field.owner !== observer &&
    participantWasCaptured(state, observer) &&
    Math.hypot(state[observer].x - field.x, state[observer].y - field.y) <= ILLUSION_RADIUS,
  )
}
function participantWasCaptured(state: FightState, observer: FightSide): boolean {
  const field = state.futureIllusion!
  return field.participantBodies
    ? field.participantBodies.includes(futureBodyKey(state, observer))
    : field.participants.includes(state[observer].id)
}

export function performFutureArsenal(
  options: ArsenalInvocation,
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  if (options.command.action !== 'future-blink') return performFutureField(options)
  const { state, side } = options,
    actor = state[side]
  if (
    state.futureIllusion?.owner !== side ||
    !canAct(actor) ||
    actor.attack ||
    actor.parallelEyesClosed
  )
    return state
  const prepared = { ...state, parallelFuture: undefined }
  const cast = perform({
    state: prepared,
    side,
    kind: 'special',
    moveId: 'tserriednich:neutralSpecial',
    auraCharged: false,
  })
  if (!cast.parallelFuture || cast.parallelFuture.phase !== 'preparing') return state
  return { ...cast, parallelFuture: { ...cast.parallelFuture, preparation: 29 } }
}
export function futureFieldOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const actor = state[side]
  if (actor.id !== 'tserriednich') return []
  const command = {
    action:
      state.futureIllusion?.owner === side
        ? ('future-field-stop' as const)
        : ('future-field-mode' as const),
  }
  const entries: ArsenalOption[] = [
    {
      command,
      ready: performFutureField({ state, side, command }) !== state,
      ...fieldLabels(state, side),
      conditionFr: `Application des ch. 418–420, distincte de la fenêtre classique. Réserve chargée hors Zetsu : ${actor.futureStoredFrames ?? 0} frames. Après la vision et l’ouverture des yeux, Zetsu maintenu, antenne fixe et rayon de ${ILLUSION_RADIUS} unités. Les attaques du prince restent sans effet sur les personnes ; les nouveaux arrivants ne sont pas trompés. Valeurs et après-image : adaptations de duel.`,
      conditionEn: `Ch. 418–420 application, separate from the classic window. Reserve charged outside Zetsu: ${actor.futureStoredFrames ?? 0} frames. After vision and opening eyes, sustained Zetsu, a fixed antenna and ${ILLUSION_RADIUS}-unit radius. The prince’s attacks cannot harm people; newcomers are not deceived. Values and afterimage are duel adaptations.`,
    },
  ]
  if (state.futureIllusion?.owner === side) entries.push(blinkOption(actor))
  return entries
}
function blinkOption(actor: ArcadeFighter): ArsenalOption {
  return {
    command: { action: 'future-blink' },
    ready: canAct(actor) && !actor.attack && !actor.parallelEyesClosed,
    labelFr: 'Cligner des yeux · Nouvelle vision',
    labelEn: 'Blink · New vision',
    conditionFr:
      'Zetsu est déjà établi. Le clignement prépare une nouvelle fenêtre de dix secondes à partir de l’état réel, sans restaurer la réserve ni déplacer l’antenne.',
    conditionEn:
      'Zetsu is already established. Blinking prepares another ten-second window from the real state, without refilling the reserve or moving the antenna.',
  }
}

function fieldLabels(state: FightState, side: FightSide) {
  const index = state.futureIllusion?.owner === side ? 0 : state[side].futureIllusionMode ? 1 : 2
  return {
    labelFr: [
      'Quitter le monde illusoire',
      'Choisir la divergence classique',
      'Choisir le monde illusoire sous Zetsu',
    ][index],
    labelEn: [
      'Leave the illusion world',
      'Choose classic divergence',
      'Choose the Zetsu illusion world',
    ][index],
  }
}
