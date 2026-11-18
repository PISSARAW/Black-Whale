import { canAct } from './fightActorState'
import { freeDeviceHand } from './deviceHands'
import { illumiState, type IllumiDisguiseMode } from './illumiState'
import { illumiNenActive, ownsIllumiNeedles } from './illumiAccess'
import { newGumSource, gumSourceCommandAllowed, sameGumSource } from './bungeeSource'
import { hasIllumiNeedles } from './illumiEquipment'
import { equippedDolphin } from './dolphinBorrowing'
import { removeDisguisePins } from './illumiDisguisePins'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState, ArcadeFighter } from './types'

export { ILLUMI_UNPINNED_FRAMES } from './illumiDisguiseTuning'

export function illumiDisguiseAvailable(actor: ArcadeFighter): boolean {
  if (actor.needleFace?.reshaping) return false
  if (actor.illumiDisguisePins && !actor.illumi?.disguised) return false
  if (!illumiNenActive(actor) || !ownsIllumiNeedles(actor)) return false
  if (!faceApplicationScope(actor)) return false
  return actor.illumiDisguisePlan === 'unpinned-hisoka' || hasIllumiNeedles(actor)
}

function faceApplicationScope(actor: ArcadeFighter): boolean {
  const current = actor.illumi
  return (
    !current?.disguised ||
    !current.disguiseOrigin ||
    sameGumSource(current.disguiseOrigin, newGumSource(actor))
  )
}

export function performIllumiFaceCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  const actor = state[side]
  if (!faceCommandBodyFree(actor)) return state
  if (command.action === 'illumi-face-remove') return removePinnedFace(state, side)
  if (!facePlanAvailable(actor) || actor.illumi?.disguised) return state
  if (command.target !== 'pinned-gittarackur' && command.target !== 'unpinned-hisoka') return state
  return actor.illumiDisguisePlan === command.target
    ? state
    : { ...state, [side]: { ...actor, illumiDisguisePlan: command.target } }
}

function faceCommandBodyFree(actor: ArcadeFighter): boolean {
  return canAct(actor) && !actor.attack && !actor.hanzoProjection
}

function removePinnedFace(state: FightState, side: FightSide): FightState {
  const actor = state[side],
    current = actor.illumi
  if (actor.illumiDisguisePins) return removeDisguisePins(state, side)
  if (!current?.disguised || current.disguiseMode === 'unpinned-hisoka') return state
  if (
    !freeDeviceHand(state, side) ||
    !gumSourceCommandAllowed(actor, current.disguiseOrigin ?? newGumSource(actor))
  )
    return state
  return {
    ...state,
    [side]: {
      ...actor,
      illumi: {
        ...current,
        disguised: false,
        preparation: 0,
        mediumCopyId: undefined,
        disguiseOrigin: undefined,
        disguiseExpiresAt: undefined,
      },
    },
  }
}

export function illumiFaceOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const actor = state[side]
  if (!facePlanAvailable(actor) && !actor.illumi?.disguised && !actor.illumiDisguisePins) return []
  const choices: [IllumiDisguiseMode, string, string][] = [
    ['pinned-gittarackur', 'Gittarackur avec aiguilles', 'Gittarackur with needles'],
    ['unpinned-hisoka', 'Visage d’Hisoka sans aiguilles', 'Hisoka’s face without needles'],
  ]
  const commands: { command: ArsenalCommand; fr: string; en: string }[] = choices.map(
    ([target, fr, en]) => ({ command: { action: 'illumi-face-mode', target }, fr, en }),
  )
  commands.push({
    command: { action: 'illumi-face-remove' },
    fr: 'Retirer les aiguilles du visage',
    en: 'Remove the face needles',
  })
  return commands.map(({ command, fr, en }) => ({
    command,
    labelFr: `Illumi · ${fr}`,
    labelEn: `Illumi · ${en}`,
    ready: performIllumiFaceCommand(state, side, command) !== state,
    conditionFr:
      'Choisir puis exécuter le remodelage. Sans aiguilles : visage seulement, yeux et vêtements conservés, retour après quatre heures simulées (borne du chapitre 118). Aucun pouvoir ou corps du modèle acquis.',
    conditionEn:
      'Select, then execute body alteration. Without needles: face only, original eyes and clothing, reversion after four simulated hours (chapter 118 lower bound). No acquisition of the model’s body or powers.',
  }))
}

export function clearIllumiFace(actor: ArcadeFighter): ArcadeFighter {
  if (!actor.illumi) return actor
  return {
    ...actor,
    illumi: {
      ...illumiState(actor),
      disguised: false,
      preparation: 0,
      anchor: undefined,
      disguiseOrigin: undefined,
      disguiseExpiresAt: undefined,
    },
  }
}

function facePlanAvailable(actor: ArcadeFighter): boolean {
  if (!illumiNenActive(actor)) return false
  if (!actor.dolphinExecution) return ownsIllumiNeedles(actor)
  const held = equippedDolphin(actor)
  return Boolean(held?.loaded && !held.returned && held.source === 'illumi')
}
