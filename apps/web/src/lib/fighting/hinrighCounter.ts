import { canAct } from './fightActorState'
import { padailleNenActive } from './padailleWeapon'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

declare module './types' {
  interface ArcadeFighter {
    hinrighAxeCounter?: { target: FightSide }
  }
}

/** Ch. 391: turn the restrained opponent's own axe hand against him, without acquiring his Hatsu. */
export function performHinrighCounter(
  { state, side }: ArsenalInvocation,
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  if (!counterReady(state, side)) return state
  const cast = perform({
    state,
    side,
    kind: 'heavy',
    variant: 'throw',
    moveId: 'hinrigh:throw',
    auraCharged: false,
  })
  if (!cast[side].attack || cast[side].attack === state[side].attack) return cast
  return {
    ...cast,
    [side]: {
      ...cast[side],
      hinrighAxeCounter: { target: side === 'player' ? 'opponent' : 'player' },
    },
  }
}

function counterReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    actor.id === 'hinrigh' &&
    canAct(actor) &&
    !actor.attack &&
    holdsRealAxeArm(state, side)
  )
}
function holdsRealAxeArm(state: FightState, side: FightSide): boolean {
  const actor = state[side],
    target = state[side === 'player' ? 'opponent' : 'player']
  return (
    target.health > 0 &&
    target.padailleTool === 'axe' &&
    padailleNenActive(target) &&
    target.biohazardRestraint?.owner === side &&
    Math.hypot(actor.x - target.x, actor.y - target.y) <= 6
  )
}

export function advanceHinrighCounter(state: FightState): FightState {
  for (const side of ['player', 'opponent'] as const) {
    const actor = state[side]
    if (!actor.hinrighAxeCounter) continue
    if (!actor.attack || actor.attack.moveId !== 'hinrigh:throw' || actor.attack.impacted)
      state = { ...state, [side]: { ...actor, hinrighAxeCounter: undefined } }
    else if (!holdsRealAxeArm(state, side))
      state = {
        ...state,
        [side]: { ...actor, hinrighAxeCounter: undefined, attack: null, bufferedAttack: null },
      }
  }
  return state
}

export function hinrighCounterOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'hinrigh') return []
  return [
    {
      command: { action: 'bio-axe-counter' },
      ready: counterReady(state, side),
      labelFr: 'Retourner la hache adverse',
      labelEn: 'Turn the enemy axe back',
      conditionFr:
        'Adversaire réellement menotté, bras déjà transformé en hache et contact requis. Prise physique interruptible ; aucun Hatsu copié ni exécution automatique.',
      conditionEn:
        'An actually cuffed opponent, an already transformed axe arm and hand reach are required. Interruptible physical grab; no copied Hatsu or automatic execution.',
    },
  ]
}
