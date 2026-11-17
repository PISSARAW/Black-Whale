import { physicalBodyAt } from './fightBodyIdentity'
import { writingPaperExists } from './bashoMaterials'
import { freeDeviceHand } from './deviceHands'
import { bashoEffectPoem, hasBashoPoem, availableBashoPoem, type BashoPoem } from './bashoPoem'
import { deviceBodyFree } from './physicalDevices'
import { sleepingBody } from './hanzoProjection'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { PreparedEntity } from './preparationTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const BASHO_WARD_FRAMES = 60 * 60 // Duel tuning; no canonical duration is claimed.
interface BashoWard {
  loan?: boolean
  owner: FightSide
  paperId: string
  paperCopyId?: string
  remainingFrames: number
  sourceMoveId?: string
  removed?: boolean
}
declare module './types' {
  interface ArcadeFighter {
    bashoWard?: BashoWard
  }
}
declare module './preparationTypes' {
  interface PreparedEntity {
    weakSpirit?: { target: FightSide; targetMember?: number; attached: boolean }
  }
}
export function scenarioWeakSpirit(target: FightSide): PreparedEntity {
  return {
    id: `${target}:weak-spirit`,
    kind: 'weak-spirit',
    owner: 'neutral',
    x: target === 'player' ? 30 : 70,
    y: 0,
    present: true,
    material: 'nen',
    health: 1,
    weakSpirit: { target, targetMember: 0, attached: false },
  }
}
export function performBashoWard(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (!deviceBodyFree(state, side) || !freeDeviceHand(state, side)) return state
  if (command.action === 'basho-remove-ward') return removeWard(state, side)
  if (command.target !== 'player' && command.target !== 'opponent') return state
  const target = command.target,
    poem = availableBashoPoem(state, side, 'ward-weak-spirits')
  if (!poem?.paperId || !canReceiveWard(state, side, target)) return state
  const stripped = takeWrittenStrip(state, side, poem.paperId)
  return {
    ...stripped,
    [target]: {
      ...stripped[target],
      bashoWard: {
        owner: side,
        paperId: poem.paperId,
        paperCopyId: poem.paperCopyId,
        remainingFrames: BASHO_WARD_FRAMES,
        sourceMoveId: poem.sourceMoveId,
        loan: poem.loan,
      },
    },
  }
}
function removeWard(state: FightState, side: FightSide): FightState {
  const ward = state[side].bashoWard
  return ward && ward.remainingFrames > 0
    ? {
        ...state,
        [side]: { ...state[side], bashoWard: { ...ward, remainingFrames: 0, removed: true } },
      }
    : state
}
function canReceiveWard(state: FightState, side: FightSide, target: FightSide): boolean {
  if (state[target].health <= 0 || (state[target].bashoWard?.remainingFrames ?? 0) > 0) return false
  if (target !== side && !state[target].supportConsent) return false
  const a = sleepingBody(state[side]),
    b = sleepingBody(state[target])
  return Math.hypot(a.x - b.x, a.y - b.y) <= 5
}
function takeWrittenStrip(state: FightState, side: FightSide, paperId: string): FightState {
  const fighter = state[side]
  return {
    ...state,
    [side]: {
      ...fighter,
      bashoPoem: fighter.bashoPoem?.paperId === paperId ? undefined : fighter.bashoPoem,
      bashoArchive: fighter.bashoArchive?.filter((poem) => poem.paperId !== paperId),
    },
  }
}
export function advanceBashoWardClocks(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const ward = next[side].bashoWard
    if (ward && !writingPaperExists(next, ward.paperCopyId)) {
      next = { ...next, [side]: { ...next[side], bashoWard: undefined } }
      continue
    }
    if (ward && ward.remainingFrames > 0)
      next = {
        ...next,
        [side]: {
          ...next[side],
          bashoWard: {
            ...ward,
            remainingFrames: hasBashoPoem(next[ward.owner], ward.sourceMoveId, ward.loan)
              ? ward.remainingFrames - 1
              : 0,
          },
        },
      }
  }
  return next
}
export function advanceWeakSpirits(state: FightState): FightState {
  const field = state.battlefield
  if (!field?.entities.some((entry) => entry.weakSpirit && entry.present)) return state
  return {
    ...state,
    battlefield: {
      ...field,
      entities: field.entities.map((entry) => advanceWeakSpirit(state, entry)),
    },
  }
}
function advanceWeakSpirit(state: FightState, entry: PreparedEntity): PreparedEntity {
  if (!entry.present || !entry.weakSpirit) return entry
  const target = physicalBodyAt(state, entry.weakSpirit.target, entry.weakSpirit.targetMember)
  if (!target) return entry
  const body = sleepingBody(target)
  const warded = (target.bashoWard?.remainingFrames ?? 0) > 0
  if (warded && Math.abs(entry.x - body.x) <= 8)
    return { ...entry, present: false, weakSpirit: { ...entry.weakSpirit, attached: false } }
  const attached = Math.abs(entry.x - body.x) <= 2
  return {
    ...entry,
    x: attached ? body.x : entry.x + Math.sign(body.x - entry.x) * 0.04,
    y: attached ? body.y + 8 : 2,
    weakSpirit: { ...entry.weakSpirit, attached },
  }
}
export function bashoWardOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const commands: ArsenalCommand[] = []
  if (bashoEffectPoem(state[side], 'ward-weak-spirits'))
    for (const target of ['player', 'opponent']) commands.push({ action: 'basho-ward', target })
  if ((state[side].bashoWard?.remainingFrames ?? 0) > 0)
    commands.push({ action: 'basho-remove-ward' })
  return commands.map((command) => ({
    command,
    ready: performBashoWard(state, side, command) !== state,
    labelFr:
      command.action === 'basho-remove-ward'
        ? 'Retirer mon talisman'
        : `Poser le talisman · ${command.target === side ? 'sur moi' : 'sur autrui'}`,
    labelEn:
      command.action === 'basho-remove-ward'
        ? 'Remove my talisman'
        : `Apply the charm · ${command.target === side ? 'myself' : 'another person'}`,
    conditionFr:
      'Bande de papier réellement écrite et contact physique ; ce scénario représente une pose coopérative sur autrui, pas un serment de consentement ajouté au Nen. Écarte les faibles esprits présents ; aucun exorcisme de malédiction puissante, aucun soin. Durée d’une minute : réglage de scénario, pas une durée canonique.',
    conditionEn:
      'A real written paper strip and physical contact; this scenario represents cooperative application to another person, not an added Nen consent vow. Repels present weak spirits; no powerful-curse exorcism or healing. One minute is scenario tuning, not a canonical duration.',
  }))
}

/** Ending a borrowed maintained effect leaves the physical charm in place, without its Nen. */
export function finishBorrowedBasho(state: FightState, side: FightSide): FightState | null {
  if (state[side].kurapika?.held?.source !== 'basho') return null
  let next = {
    ...state,
    [side]: {
      ...state[side],
      ...remainingBashoPapers(state[side]),
    },
  }
  for (const target of ['player', 'opponent'] as const) {
    const actor = next[target],
      ward = actor.bashoWard
    if (ward?.owner === side && (!state[side].dolphinLoan || ward.loan))
      next = { ...next, [target]: { ...actor, bashoWard: { ...ward, remainingFrames: 0 } } }
  }
  return next
}

function remainingBashoPapers(actor: ArcadeFighter): Partial<ArcadeFighter> {
  const keep = (poem: BashoPoem | undefined): poem is BashoPoem =>
    Boolean(actor.dolphinLoan && poem && !poem.loan)
  const kept = [actor.bashoPoem, ...(actor.bashoArchive ?? [])].filter(keep)
  const archive = kept.filter((poem) => poem !== actor.bashoPoem)
  const inquiryLive = kept.some((poem) => poem.paperId === actor.bashoInquiry?.paperId)
  return {
    bashoPoem: kept.find((poem) => poem === actor.bashoPoem),
    bashoArchive: archive.length ? archive : undefined,
    bashoInquiry: inquiryLive ? actor.bashoInquiry : undefined,
  }
}
