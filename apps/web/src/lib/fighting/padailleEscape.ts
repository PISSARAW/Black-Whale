import { BIOHAZARD_GRACE } from './biohazard'
import { canAct } from './fightActorState'
import { padailleNenActive } from './padailleWeapon'
import { performDolphinApplication } from './dolphinArsenal'
import { chrolloHasActivePage } from './chrolloBook'
import { moveById } from './movesets'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

type Performer = (options: AuraAttackOptions) => FightState
export interface PadailleEscape {
  owner: FightSide
  objectId: number
  tool: 'drill' | 'axe'
  frames: number
  damage: number
}

/** Chapter 391: a shrinking drill hand slips a cuff; an axe can attempt a physical cut.
 * Preparation remains vulnerable. Neither application releases Nen chains or other restraints.
 */
export function performPadailleEscape(
  { state, side, command }: ArsenalInvocation,
  perform: Performer,
): FightState {
  const tool = command.target
  if (!['drill', 'axe'].includes(tool ?? '') || !escapeReady(state, side)) return state
  const fighter = state[side],
    restraint = fighter.biohazardRestraint!
  const free = { ...state, [side]: { ...fighter, biohazardRestraint: undefined } }
  const moveId = tool === 'drill' ? 'padaille:forwardSpecial' : 'padaille:downSpecial'
  const cast = castEscape({ state: free, side, moveId }, perform)
  if (cast === free) return state
  const attack = cast[side].attack
  if (!attack || attack.hatsuSource !== 'padaille')
    return { ...cast, [side]: { ...cast[side], biohazardRestraint: restraint } }
  return {
    ...cast,
    [side]: {
      ...cast[side],
      x: fighter.x,
      y: fighter.y,
      attack: null,
      bufferedAttack: null,
      biohazardRestraint: restraint,
      padailleEscape: {
        owner: restraint.owner,
        objectId: restraint.objectId,
        tool: tool as PadailleEscape['tool'],
        frames: 12,
        damage: moveById(moveId)!.tuning.damage,
      },
    },
  }
}

function castEscape(
  options: { state: FightState; side: FightSide; moveId: string },
  perform: Performer,
): FightState {
  const { state, side, moveId } = options,
    fighter = state[side]
  if (fighter.id === 'kurapika') return performDolphinApplication(options, perform)
  if (fighter.id !== 'chrollo') return perform({ ...options, kind: 'special', auraCharged: false })
  const borrowed = {
    ...state,
    [side]: { ...fighter, id: 'padaille' as const, nenOwner: fighter.id },
  }
  const cast = perform({ state: borrowed, side, moveId, kind: 'special', auraCharged: false })
  return cast === borrowed
    ? state
    : { ...cast, [side]: { ...cast[side], id: fighter.id, nenOwner: fighter.nenOwner } }
}

function escapeSource(fighter: ArcadeFighter): boolean {
  const held = fighter.kurapika?.held
  if (fighter.id === 'kurapika')
    return Boolean(held?.source === 'padaille' && held.loaded && !held.used)
  return padailleNenActive(fighter)
}

function escapeReady(state: FightState, side: FightSide): boolean {
  const fighter = state[side]
  if (!fighter.biohazardRestraint || fighter.padailleEscape || fighter.attack) return false
  const free = { ...fighter, biohazardRestraint: undefined }
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    escapeSource(free) &&
    canAct(free) &&
    fighter.aura >= 20
  )
}

export function padailleBoundAction(
  options: AuraAttackOptions,
  perform: Performer,
): FightState | null {
  const { state, side, moveId, kind } = options
  if (!state[side].biohazardRestraint || kind !== 'special') return null
  const tool =
    moveId === 'padaille:forwardSpecial'
      ? 'drill'
      : moveId === 'padaille:downSpecial'
        ? 'axe'
        : null
  return tool
    ? performPadailleEscape(
        { state, side, command: { action: 'padaille-escape', target: tool } },
        perform,
      )
    : null
}

export function padailleEscapeAi(state: FightState, perform: Performer): FightState | null {
  if (!escapeReady(state, 'opponent')) return null
  const next = performPadailleEscape(
    { state, side: 'opponent', command: { action: 'padaille-escape', target: 'drill' } },
    perform,
  )
  return next === state ? null : next
}

export function advancePadailleEscapes(state: FightState): FightState {
  for (const side of ['player', 'opponent'] as const) state = advanceEscape(state, side)
  return state
}

function advanceEscape(state: FightState, side: FightSide): FightState {
  const fighter = state[side],
    escape = fighter.padailleEscape
  if (!escape) return state
  if (!escapeStillValid(fighter))
    return { ...state, [side]: { ...fighter, padailleEscape: undefined } }
  if (escape.frames > 1)
    return {
      ...state,
      [side]: { ...fighter, padailleEscape: { ...escape, frames: escape.frames - 1 } },
    }
  return finishEscape(state, side, escape)
}

function escapeStillValid(fighter: ArcadeFighter): boolean {
  const restraint = fighter.biohazardRestraint,
    escape = fighter.padailleEscape!
  return (
    padailleNenActive(fighter) &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.knockdownFrames === 0 &&
    restraint?.owner === escape.owner &&
    restraint.objectId === escape.objectId
  )
}

function finishEscape(state: FightState, side: FightSide, escape: PadailleEscape): FightState {
  const owner = state[escape.owner],
    object = owner.biohazard?.objects.find(
      (entry) => entry.id === escape.objectId && entry.phase === 'bound',
    )
  if (!object) return { ...state, [side]: { ...state[side], padailleEscape: undefined } }
  const durability =
    escape.tool === 'axe' ? Math.max(0, object.durability - escape.damage) : object.durability
  const released = escape.tool === 'drill' || durability === 0
  return {
    ...state,
    [escape.owner]: {
      ...owner,
      biohazard: {
        objects: owner.biohazard!.objects.map((entry) =>
          entry.id === object.id
            ? {
                ...entry,
                durability,
                phase: released
                  ? durability === 0
                    ? ('broken' as const)
                    : ('dropped' as const)
                  : entry.phase,
              }
            : entry,
        ),
      },
    },
    [side]: {
      ...state[side],
      padailleEscape: undefined,
      biohazardRestraint: released ? undefined : state[side].biohazardRestraint,
      biohazardGraceFrames: released ? BIOHAZARD_GRACE : state[side].biohazardGraceFrames,
    },
  }
}

export function padailleEscapeOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const fighter = state[side]
  if (
    fighter.id !== 'padaille' &&
    !chrolloHasActivePage(fighter, 'padaille') &&
    fighter.kurapika?.held?.source !== 'padaille'
  )
    return []
  return (['drill', 'axe'] as const).map((target) => ({
    command: { action: 'padaille-escape', target },
    labelFr:
      target === 'drill'
        ? 'Perceuse · Glisser hors de la menotte'
        : 'Hache · Tenter de couper la menotte',
    labelEn:
      target === 'drill' ? 'Drill · Slip out of the handcuff' : 'Axe · Try cutting the handcuff',
    ready: escapeReady(state, side),
    conditionFr:
      'Menotte physique de Biohazard uniquement. Transformation payée et préparation de 0,2 s interruptible ; la hache doit vaincre la résistance réelle de la menotte. Aucun dégât à l’adversaire.',
    conditionEn:
      'Physical Biohazard handcuffs only. Paid transformation and interruptible 0.2 s preparation; the axe must overcome the cuff’s actual durability. No opponent damage.',
  }))
}
