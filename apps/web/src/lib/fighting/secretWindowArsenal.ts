import { canAct } from './fightActorState'
import { chrolloPageForMove, CHROLLO_SECONDARY, CHROLLO_USE } from './chrolloBook'
import { secretWindowNenActive } from './secretWindow'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Both demonstrated birds use the ordinary Hatsu admission/cost/copy path. */
export function performSecretWindowCommand(
  options: ArsenalInvocation,
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, command } = options
  const fighter = state[side]
  if (!canAct(fighter) || fighter.attack) return state
  if (command.action === 'window-stop')
    return fighter.secretWindow
      ? { ...state, [side]: { ...fighter, secretWindow: undefined } }
      : state
  const mode = windowMode(command.action)
  if (!mode || !windowCanStart(fighter, mode)) return state
  const moveId = windowMove(fighter)
  const prepared: FightState = {
    ...state,
    [side]: {
      ...fighter,
      secretWindow: undefined,
      secretWindowMode: mode,
    },
  }
  const next = perform({ state: prepared, side, kind: 'special', moveId, auraCharged: false })
  return next === prepared ? state : next
}

export function secretWindowOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const fighter = state[side]
  if (
    fighter.id !== 'musse' &&
    !windowLoaded(fighter) &&
    !secretWindowNenActive(fighter) &&
    !fighter.secretWindow
  )
    return []
  return (
    [
      ['window-contact', 'Hibou au contact', 'Contact owl'],
      ['window-listen', 'Hibou d’écoute à l’épaule', 'Shoulder listening bird'],
      ['window-stop', 'Rappeler le hibou', 'Dismiss bird'],
    ] as const
  ).map(([action, fr, en]) => ({
    command: { action },
    labelFr: `Secret Window · ${fr}`,
    labelEn: `Secret Window · ${en}`,
    ready:
      action === 'window-stop'
        ? canAct(fighter) && !fighter.attack && Boolean(fighter.secretWindow)
        : windowCanStart(fighter, windowMode(action)!),
    conditionFr:
      'Un seul hibou actif. Au contact : gestes et paroles. À l’épaule : paroles à travers les obstacles, sans image ni lecture de pensée. Archives limitées aux événements réellement reçus.',
    conditionEn:
      'One active bird. Contact: actions and speech. Shoulder: speech through obstacles, without images or thoughts. Recordings contain only events actually received.',
  }))
}

function windowLoaded(fighter: ArcadeFighter): boolean {
  const held = fighter.kurapika?.held
  return fighter.id === 'kurapika' && held?.source === 'musse' && held.loaded && !held.used
}
function windowMode(action: string): 'contact' | 'listening' | null {
  if (action === 'window-listen') return 'listening'
  return action === 'window-contact' ? 'contact' : null
}
function windowCanStart(fighter: ArcadeFighter, mode: 'contact' | 'listening'): boolean {
  if (!canAct(fighter) || fighter.attack || fighter.aura < 16) return false
  if (fighter.secretWindow && (fighter.secretWindow.mode ?? 'contact') === mode) return false
  if (fighter.id === 'kurapika') return windowLoaded(fighter)
  return secretWindowNenActive(fighter)
}
function windowMove(fighter: ArcadeFighter): string {
  if (fighter.id === 'chrollo')
    return chrolloPageForMove(fighter) === 'musse' ? CHROLLO_USE : CHROLLO_SECONDARY
  return fighter.id === 'kurapika' ? 'kurapika:backSpecial' : 'musse:neutralSpecial'
}
