import { canAct } from './fightActorState'
import { chrolloHasActivePage, chrolloNenActive } from './chrolloBook'
import { drawRosterBody, storeRosterGuest, type RosterGuest } from './rosterGuests'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export interface BlackAntenna {
  id: number
  target?: FightSide
  guestId?: string
}
declare module './types' {
  interface ArcadeFighter {
    blackAntennas?: readonly BlackAntenna[]
    blackOrder?: 'attack' | 'guard' | 'retreat' | 'wait'
    blackControlledBy?: FightSide
  }
}

export function blackVoiceAvailable(state: FightState, side: FightSide): boolean {
  return chrolloNenActive(state[side]) && chrolloHasActivePage(state[side], 'black-voice')
}
export function blackAntennas(state: FightState, side: FightSide): readonly BlackAntenna[] {
  return state[side].blackAntennas ?? [{ id: 0 }, { id: 1 }]
}

export function performBlackVoice({ state, side, command }: ArsenalInvocation): FightState {
  if (!blackCommandBodyReady(state, side)) return state
  if (command.action === 'black-remove') return removeAntenna(state, side, Number(command.target))
  if (!blackVoiceAvailable(state, side)) return state
  if (command.action === 'black-order') return issueOrder(state, side, command.target)
  if (command.action !== 'black-roster') return state
  return prepareRosterPuppet(state, side)
}
function blackCommandBodyReady(state: FightState, side: FightSide): boolean {
  return state.phase === 'fighting' && !state.catsName && canAct(state[side]) && !state[side].attack
}
function issueOrder(state: FightState, side: FightSide, order?: string): FightState {
  if (!['attack', 'guard', 'retreat', 'wait'].includes(order ?? '')) return state
  return { ...state, [side]: { ...state[side], blackOrder: order as 'attack' } }
}
function prepareRosterPuppet(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  const antenna = blackAntennas(state, side).find(
    (item) => item.target === undefined && !item.guestId,
  )
  if (
    !antenna ||
    actor.aura < 20 ||
    (state.rosterGuests ?? []).some((guest) => guest.owner === side && guest.phase !== 'eliminated')
  )
    return state
  const draw = drawRosterBody(state, side)
  const id = `black:${side}:${state.frame}:${antenna.id}`
  const guest: RosterGuest = {
    id,
    owner: side,
    role: 'puppet',
    phase: 'preparing',
    fighter: { ...draw.fighter, x: Math.max(7, Math.min(93, actor.x + actor.facing * 5)) },
    frames: 0,
    cooldown: 0,
  }
  return {
    ...draw.state,
    rosterGuests: [...(state.rosterGuests ?? []), guest],
    [side]: {
      ...actor,
      aura: actor.aura - 20,
      blackOrder: 'attack',
      blackAntennas: blackAntennas(state, side).map((item) =>
        item.id === antenna.id ? { ...item, guestId: id } : item,
      ),
    },
  }
}

export function implantBlackVoice(
  state: FightState,
  side: FightSide,
  target: FightSide,
): FightState {
  if (!blackVoiceAvailable(state, side) || state[target].blackControlledBy !== undefined)
    return state
  const antenna = blackAntennas(state, side).find(
    (item) => item.target === undefined && !item.guestId,
  )
  if (!antenna) return state
  return {
    ...state,
    [side]: {
      ...state[side],
      blackAntennas: blackAntennas(state, side).map((item) =>
        item.id === antenna.id ? { ...item, target } : item,
      ),
    },
    [target]: {
      ...state[target],
      blackControlledBy: side,
      hatsuEffects: { ...state[target].hatsuEffects, manipulatedFrames: 1 },
    },
  }
}

function removeAntenna(state: FightState, side: FightSide, id: number): FightState {
  const antenna = blackAntennas(state, side).find((item) => item.id === id)
  if (!antenna || (antenna.target === undefined && !antenna.guestId)) return state
  const target = antennaBody(state, antenna)
  if (!target || Math.hypot(target.x - state[side].x, target.y - state[side].y) > 6) return state
  let next: FightState = {
    ...state,
    [side]: {
      ...state[side],
      blackAntennas: blackAntennas(state, side).map((item) => (item.id === id ? { id } : item)),
    },
  }
  if (antenna.target !== undefined)
    next = {
      ...next,
      [antenna.target]: {
        ...next[antenna.target],
        blackControlledBy: undefined,
        hatsuEffects: { ...next[antenna.target].hatsuEffects, manipulatedFrames: 0 },
      },
    }
  const guest = next.rosterGuests?.find((held) => held.id === antenna.guestId)
  return guest ? storeRosterGuest(next, { ...guest, phase: 'leaving' }) : next
}

function antennaBody(state: FightState, antenna: BlackAntenna) {
  return antenna.target === undefined
    ? state.rosterGuests?.find((guest) => guest.id === antenna.guestId)?.fighter
    : state[antenna.target]
}

export function blackVoiceOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'chrollo') return []
  const entries: { command: ArsenalInvocation['command']; fr: string; en: string }[] = [
    {
      command: { action: 'black-roster' },
      fr: 'Black Voice · Préparer un pantin du roster',
      en: 'Black Voice · Prepare a roster puppet',
    },
    ...(['attack', 'guard', 'retreat', 'wait'] as const).map((order, index) => ({
      command: { action: 'black-order' as const, target: order },
      fr: `Pantin · ${['Attaquer', 'Garder', 'Reculer', 'Attendre'][index]}`,
      en: `Puppet · ${order}`,
    })),
    ...blackAntennas(state, side).map((item) => ({
      command: { action: 'black-remove' as const, target: String(item.id) },
      fr: `Retirer l’antenne ${item.id + 1}`,
      en: `Remove antenna ${item.id + 1}`,
    })),
  ]
  return entries.map(({ command, fr, en }) => ({
    command,
    labelFr: fr,
    labelEn: en,
    ready: performBlackVoice({ state, side, command }) !== state,
    conditionFr:
      'Adaptation de jeu : un corps du roster est tiré au sort, puis l’antenne est implantée au contact pendant une préparation vulnérable. Deux antennes physiques ; page active et téléphone requis pour les ordres.',
    conditionEn:
      'Game adaptation: a roster body is drawn, then an antenna is implanted at close range during vulnerable preparation. Two physical antennae; active page and phone required for orders.',
  }))
}
