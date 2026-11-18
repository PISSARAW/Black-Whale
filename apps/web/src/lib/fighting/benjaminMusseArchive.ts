import { voluntaryNenAvailable } from './nenAccess'
import { physicalNenBody } from './physicalNenBody'
import { chainAbilitySealed } from './kurapika'
import { physicalBodyAt } from './fightBodyIdentity'
import type { DolphinBodyRef } from './dolphinLoanTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { SecretWindowObservation } from './secretWindow'

/** Retrospective observations from Musse's own viewpoint, chapters 373 and 413.
 * The record stops before his death: it never contains a camera watching his corpse
 * or Camilla's subsequent resurrection, and never queries the present opponent.
 */
export const MUSSE_ARCHIVE = [
  {
    id: 'camilla-down',
    fr: 'Camilla est immobile après les tirs de Musse.',
    en: 'Camilla lies still after Musse fires.',
  },
  {
    id: 'owl-contact',
    fr: 'Musse pose son hibou au contact de Camilla.',
    en: 'Musse places the owl by touching Camilla.',
  },
  {
    id: 'last-vision',
    fr: 'La dernière vision de Musse s’interrompt avant sa mort.',
    en: 'Musse’s final view ends before his death.',
  },
] as const

export interface MusseRetrospectiveArchive {
  observer: 'musse'
  subject: 'camilla'
  /** Completed historical preparation; the manga gives no exact duration. */
  evolution: 'extended-uninterrupted-monitoring'
  record: 'musse-last-vision'
  watched: DolphinBodyRef
  cursor?: number
  observed?: readonly RecordedWindowObservation[]
  observedCursor?: string
  observedOrdinal?: number
}

export interface RecordedWindowObservation {
  id: string
  round: number
  frame: number
  action: SecretWindowObservation['action']
  words?: { frame: number; text: string }
}

export function createMusseRetrospectiveArchive(
  watched: DolphinBodyRef,
): MusseRetrospectiveArchive {
  return {
    observer: 'musse',
    subject: 'camilla',
    evolution: 'extended-uninterrupted-monitoring',
    record: 'musse-last-vision',
    watched,
  }
}

/** This demonstrated evolved version belongs to retrospective Benjamin, not automatically to Musse. */
export function benjaminCanRewindMusse(state: FightState, side: FightSide): boolean {
  return benjaminArchiveObserverReady(state, state[side])
}

export function benjaminArchiveObserverReady(state: FightState, actor: ArcadeFighter): boolean {
  if (!rewindOwnerReady(actor)) return false
  const archive = actor.hatsuEffects.baton?.musseArchive
  const owl = actor.secretWindow
  if (!archive || owl?.musseInheritance !== 'canon373') return false
  if (owl.target !== archive.watched.owner || owl.targetMember !== archive.watched.member)
    return false
  return watchedCamilla(state, archive.watched)
}

function rewindOwnerReady(actor: ArcadeFighter): boolean {
  if (!actor.hatsuEffects.baton?.inherited.includes('secret-window')) return false
  return (
    actor.id === 'benjamin' &&
    (actor.nenOwner ?? actor.id) === 'benjamin' &&
    voluntaryNenAvailable(physicalNenBody(actor), { requireReserve: true }) &&
    !chainAbilitySealed(actor, 'benjamin:forwardSpecial')
  )
}

function watchedCamilla(state: FightState, watched: DolphinBodyRef): boolean {
  const subject = physicalBodyAt(state, watched.owner, watched.member)
  return (subject?.nenOwner ?? subject?.id) === 'camilla'
}
