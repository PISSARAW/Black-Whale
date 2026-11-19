import { priorityLineOfSight } from './priorityOptics'
import { chrolloHasActivePage } from './chrolloBook'
import { physicalBodyKey } from './fightBodyIdentity'
import { freeDeviceHand } from './deviceHands'
import { historicalPartExists } from './historicalCopyLifetime'
import { canReadDocument } from './paperDocumentReading'
import { documentById, touchesDocument } from './paperDocuments'
import { displayedDocumentText, paperTextureLive } from './paperTexture'
import { senseDeprived } from './saiyuSenses'
import {
  sameFortuneSubject,
  type FortuneSignature,
  type FortuneMonth,
  type FortuneSubject,
} from './ghostwriterTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export function fortuneIdentityText(signature: FortuneSignature): string {
  return `${signature.name}\n${signature.dateOfBirth}\n${signature.bloodType}`
}
export function ghostwriterMaterialsReady(state: FightState, side: FightSide): boolean {
  const actor = state[side],
    kit = actor.writingKit
  return Boolean(
    kit?.brush &&
    kit.ink &&
    kit.integrity > 0 &&
    historicalPartExists(state, kit.copyId) &&
    freeDeviceHand(state, side),
  )
}
export function ghostwriterChannelReady(state: FightState, side: FightSide): boolean {
  return (
    state[side].id === 'chrollo' &&
    !state[side].hanzoProjection &&
    chrolloHasActivePage(state[side], 'lovely-ghostwriter')
  )
}
export function fortuneMonth(state: FightState, sheet: PreparedEntity): FortuneMonth | undefined {
  return state.fortuneMonths?.find((month) =>
    sameFortuneSubject(month.subject, sheet.document?.fortuneSignature?.subject),
  )
}
export function ghostwriterSheet(
  state: FightState,
  side: FightSide,
  id?: string,
): PreparedEntity | undefined {
  const sheet = originalFortuneSheet(state, id)
  if (!sheet) return undefined
  const signature = sheet.document!.fortuneSignature!
  if (
    signature.subject.kind === 'fighter' &&
    signature.subject.bodyKey === physicalBodyKey(state, side)
  )
    return undefined
  if (
    !authenticFortuneInk(state, sheet) ||
    !canReadDocument(state, side, sheet) ||
    !touchesDocument(state, side, sheet)
  )
    return undefined
  if (!fortuneContextReady(state, sheet)) return undefined
  return fortuneSubjectVisible(state, side, sheet) ? sheet : undefined
}
function originalFortuneSheet(state: FightState, id?: string): PreparedEntity | undefined {
  const sheet = documentById(state, id),
    signature = sheet?.document?.fortuneSignature
  return sheet && signature?.sheetId === sheet.id && signature.handwritten ? sheet : undefined
}
function fortuneContextReady(state: FightState, sheet: PreparedEntity): boolean {
  const subject = sheet.document!.fortuneSignature!.subject
  const person =
    subject.kind === 'person'
      ? state.battlefield?.entities.find((entry) => entry.id === subject.id)
      : undefined
  if (person && person.health <= 0) return false
  return Boolean(fortuneMonth(state, sheet) || (state.pvpSeat && sheet.document!.fortuneMonthReady))
}
function authenticFortuneInk(state: FightState, sheet: PreparedEntity): boolean {
  const paper = sheet.document!,
    signature = paper.fortuneSignature!
  const text = fortuneIdentityText(signature)
  if (!identityMatchesSubject(state, signature)) return false
  return (
    !sheet.copy &&
    sheet.material === 'real' &&
    !paper.fortuneWritten &&
    paper.text.startsWith(text) &&
    displayedDocumentText(state, sheet).startsWith(text)
  )
}
function identityMatchesSubject(state: FightState, signature: FortuneSignature): boolean {
  const identity = registeredIdentity(state, signature.subject)
  return Boolean(
    identity &&
    identity.name === signature.name &&
    identity.dateOfBirth === signature.dateOfBirth &&
    identity.bloodType === signature.bloodType,
  )
}
function registeredIdentity(state: FightState, subject: FortuneSubject) {
  if (subject.kind === 'person')
    return state.battlefield?.entities.find((entry) => entry.id === subject.id)?.fortunePerson
      ?.identity
  return state.fortuneMonths?.find((month) => sameFortuneSubject(subject, month.subject))?.identity
}
function fortuneSubjectVisible(state: FightState, side: FightSide, sheet: PreparedEntity): boolean {
  if (senseDeprived(state[side], 'sight')) return false
  const subject = sheet.document!.fortuneSignature!.subject
  if (subject.kind === 'person') {
    const person = state.battlefield?.entities.find(
      (entry) => entry.id === subject.id && entry.fortunePerson,
    )
    if (person && visibleFortunePerson(state, side, person)) return true
  }
  return Boolean(
    state.battlefield?.entities.some(
      (photo) =>
        sameFortuneSubject(photo.document?.fortunePortrait, subject) &&
        canReadDocument(state, side, photo) &&
        Boolean(visibleFortunePortrait(state, photo)),
    ),
  )
}
function visibleFortunePerson(state: FightState, side: FightSide, person: PreparedEntity): boolean {
  const actor = state[side]
  return (
    person.present &&
    person.health > 0 &&
    Math.abs(person.x - actor.x) <= 12 &&
    (person.x - actor.x) * actor.facing >= 0 &&
    priorityLineOfSight(state, {
      x: actor.x,
      y: actor.y + 10,
      targetX: person.x,
      targetY: person.y + 10,
    })
  )
}

export function visibleFortunePortrait(state: FightState, entry: PreparedEntity) {
  const paper = entry.document
  if (!paper?.fortunePortrait) return undefined
  if (paper.textures?.some((layer) => paperTextureLive(state, entry, layer))) return undefined
  return paper.fortunePortrait
}
