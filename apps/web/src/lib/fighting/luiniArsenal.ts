import { canAct } from './fightActorState'
import { chrolloPageForMove, CHROLLO_USE, CHROLLO_SECONDARY } from './chrolloBook'
import { ownsLuini, type LuiniExitMode } from './luiniPassage'
import { luiniDestinations, luiniDestination, luiniAnchor, insideLuiniRoom } from './luiniSpatial'
import { preparedActionReady } from './preparationActions'
import { knownOpponentTarget } from './opponentAwareness'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter, FightState, FightSide } from './types'

type Performer = (options: AuraAttackOptions) => FightState
export function performLuiniCommand(options: ArsenalInvocation, perform: Performer): FightState {
  if (options.command.action === 'luini-peek') return peekLuini(options, perform)
  if (options.command.action === 'luini-cross')
    options = { ...options, command: { action: 'luini-emerge' } }
  const { state, side, command } = options,
    fighter = state[side]
  if (!ownsLuini(fighter)) return state
  if (command.action === 'luini-select') return selectExit(options)
  if (!['luini-travel', 'luini-retract', 'luini-emerge'].includes(command.action)) return state
  if (command.action !== 'luini-travel' && !fighter.luiniPassage) return state
  const prepared = {
    ...state,
    [side]: { ...fighter, luiniComplete: command.action === 'luini-emerge' },
  }
  const next = perform({
    state: prepared,
    side,
    kind: 'special',
    moveId: luiniInput(fighter),
    auraCharged: false,
  })
  return next === prepared ? state : next
}
function selectExit({ state, side, command }: ArsenalInvocation): FightState {
  const fighter = state[side],
    split = command.target?.indexOf(':') ?? -1
  if (!canAct(fighter) || fighter.attack || split < 0) return state
  const prefix = command.target!.slice(0, split)
  const qualified = ['full', 'door', 'ceiling'].includes(prefix)
  const mode = qualified ? prefix : 'full',
    destinationId = qualified ? command.target!.slice(split + 1) : command.target!
  if (!luiniDestinations(state, side).some((entry) => entry.id === destinationId)) return state
  return {
    ...state,
    [side]: {
      ...fighter,
      luiniSelectedDestination: destinationId,
      luiniExit: { mode: mode as LuiniExitMode, destinationId },
    },
  }
}
function peekLuini(options: ArsenalInvocation, perform: Performer): FightState {
  const { state, side, command } = options
  const room = luiniAnchor(state, side),
    exit = luiniDestination(state, side)
  if (!room || !exit || !insideLuiniRoom(state, side, room) || state[side].luiniPassage)
    return state
  if (!['door', 'ceiling'].includes(command.target ?? '')) return state
  const selected = selectExit({
    state,
    side,
    command: { action: 'luini-select', target: `${command.target}:${exit.id}` },
  })
  return selected === state
    ? state
    : performLuiniCommand({ state: selected, side, command: { action: 'luini-travel' } }, perform)
}
export function luiniInput(fighter: ArcadeFighter): string {
  if (fighter.id === 'chrollo')
    return chrolloPageForMove(fighter) === 'luini' ? CHROLLO_USE : CHROLLO_SECONDARY
  return fighter.id === 'kurapika' ? 'kurapika:backSpecial' : 'luini:neutralSpecial'
}
function luiniReady(state: FightState, side: FightSide): boolean {
  const fighter = state[side],
    held = fighter.kurapika?.held
  if (fighter.id !== 'kurapika') return preparedActionReady(state, side, luiniInput(fighter))
  if (!held?.loaded || held.source !== 'luini' || !fighter.kurapika?.emperorTime) return false
  const borrowed = { ...state, [side]: { ...fighter, id: 'luini' as const, nenOwner: fighter.id } }
  return preparedActionReady(borrowed, side, 'luini:neutralSpecial')
}
export function luiniArsenalOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!ownsLuini(state[side])) return []
  const options: ArsenalOption[] = []
  for (const entry of luiniDestinations(state, side))
    for (const [mode, fr, en] of [
      ['full', 'Passage entier', 'Full passage'],
      ['door', 'Buste par la porte', 'Upper body through door'],
      ['ceiling', 'Buste par le plafond', 'Upper body through ceiling'],
    ])
      options.push({
        command: { action: 'luini-select', target: `${mode}:${entry.id}` },
        labelFr: `${fr} · ${entry.id}`,
        labelEn: `${en} · ${entry.id}`,
        ready: canAct(state[side]) && !state[side].attack,
        conditionFr:
          'Choisir un lieu effectivement visité par cet utilisateur. Le choix seul ne téléporte pas ; le passage partiel expose le corps aux coups.',
        conditionEn:
          'Choose a location actually visited by this user. Selection alone does not teleport; a partial passage exposes the body to attacks.',
      })
  const partial = Boolean(state[side].luiniPassage)
  for (const [action, fr, en] of partial
    ? ([
        ['luini-retract', 'Rentrer dans la pièce', 'Withdraw into the room'],
        ['luini-emerge', 'Sortir complètement', 'Emerge fully'],
      ] as const)
    : ([['luini-travel', 'Activer le passage préparé', 'Activate prepared passage']] as const))
    options.push({
      command: { action },
      labelFr: fr,
      labelEn: en,
      ready: luiniReady(state, side),
      conditionFr:
        'Pièce close, Nen et récupération requis. Coût de duel : 20 aura par activation. Aucune attaque ni esquive automatique pendant la sortie partielle ; parler reste possible.',
      conditionEn:
        'Sealed room, Nen and recovery required. Duel cost: 20 aura per activation. No attack or automatic dodge while partly exposed; speech remains possible.',
    })
  return options
}

export function luiniArsenalAi(state: FightState, perform: Performer): FightState | null {
  const fighter = state.opponent
  if (!ownsLuini(fighter) || !luiniReady(state, 'opponent')) return null
  const command = fighter.luiniPassage ? 'luini-emerge' : 'luini-travel'
  if (fighter.luiniPassage)
    return performLuiniCommand({ state, side: 'opponent', command: { action: command } }, perform)
  const destination = luiniAiDestination(state)
  if (!destination) return null
  const selected = performLuiniCommand(
    {
      state,
      side: 'opponent',
      command: { action: 'luini-select', target: `door:${destination.id}` },
    },
    perform,
  )
  return performLuiniCommand(
    { state: selected, side: 'opponent', command: { action: command } },
    perform,
  )
}
function luiniAiDestination(state: FightState) {
  const room = luiniAnchor(state, 'opponent'),
    target = knownOpponentTarget(state)
  if (!room || !target || !insideLuiniRoom(state, 'opponent', room)) return undefined
  return luiniDestinations(state, 'opponent')
    .filter((entry) => Math.abs(entry.x - target.x) < Math.abs(state.opponent.x - target.x))
    .sort((a, b) => Math.abs(a.x - target.x) - Math.abs(b.x - target.x))[0]
}
