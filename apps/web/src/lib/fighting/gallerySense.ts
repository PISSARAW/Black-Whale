import { chrolloHasActivePage } from './chrolloBook'
import { ENTITY_LABELS } from './preparationEntityLabels'
import { originalLeftHandReady } from './historicalHands'
import { canAct } from './fightActorState'
import { galleryVolume } from './galleryVolume'
import { touchesDevice } from './physicalDevices'
import { devicePosition, deviceCarrierBody, deviceBodyFree } from './physicalDevices'
import { physicalBodyAt } from './fightBodyIdentity'
import { historicalCopyExpired } from './historicalCopyLifetime'
import { sleepingBody, wakeHanzoBody } from './hanzoProjection'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export interface GalleryFocus {
  originalId: string
  originalMember?: number
}
export interface GalleryContact {
  key: string
  x: number
  y: number
  side?: FightSide
  member?: number
  projection?: boolean
}
export interface GalleryReading {
  frame: number
  originalId: string
  copies: { id: string; x: number; y: number; contacts: GalleryContact[] }[]
}
export function performGallerySense(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action === 'history-gallery-stop') return clearGalleryFocus(state, side)
  const source = gallerySources(state, side).find(
    (item) => gallerySourceKey(item) === command.target,
  )
  if (!source || !galleryTouchReady(state, side, source) || !deviceBodyFree(state, side))
    return state
  const touched = touchOriginalBody(state, source)
  const started = {
    ...touched,
    [side]: {
      ...touched[side],
      chrolloHistorical: {
        ...touched[side].chrolloHistorical,
        galleryFocus: source,
      },
    },
  }
  return advanceGallerySide(started, side)
}
export function advanceGallerySenses(state: FightState): FightState {
  return advanceGallerySide(advanceGallerySide(state, 'player'), 'opponent')
}
function advanceGallerySide(state: FightState, side: FightSide): FightState {
  const focus = state[side].chrolloHistorical?.galleryFocus
  if (!focus) return state
  if (!galleryTouchReady(state, side, focus)) return clearGalleryFocus(state, side)
  const copies = galleryCopies(state, side, focus).flatMap((entry) => {
    const point = copyPosition(state, entry)
    return point
      ? [{ id: entry.id, ...point, contacts: copyContacts(state, side, { entry, at: point }) }]
      : []
  })
  return {
    ...state,
    [side]: {
      ...state[side],
      chrolloHistorical: {
        ...state[side].chrolloHistorical,
        galleryReading: { frame: state.frame, originalId: focus.originalId, copies },
      },
    },
  }
}
function clearGalleryFocus(state: FightState, side: FightSide): FightState {
  const history = state[side].chrolloHistorical
  return history?.galleryFocus
    ? {
        ...state,
        [side]: {
          ...state[side],
          chrolloHistorical: {
            ...history,
            galleryFocus: undefined,
          },
        },
      }
    : state
}
function galleryTouchReady(state: FightState, side: FightSide, focus: GalleryFocus): boolean {
  const actor = state[side],
    original = originalPosition(state, focus)
  if (!original || !chrolloHasActivePage(actor, 'gallery-fake')) return false
  return Boolean(
    canAct({ ...actor, arenaRecovery: 0 }) &&
    !actor.hanzoProjection &&
    !actor.attack &&
    originalLeftHandReady(state, side, focus.originalId) &&
    originalWithinReach(state, side, { focus, original }),
  )
}
function originalWithinReach(
  state: FightState,
  side: FightSide,
  context: { focus: GalleryFocus; original: { x: number; y: number } },
): boolean {
  const entry = state.battlefield?.entities.find(
    (e) => e.id === context.focus.originalId && e.device,
  )
  if (entry) return touchesDevice(state, side, entry)
  return Math.hypot(state[side].x - context.original.x, state[side].y - context.original.y) <= 6
}
function touchOriginalBody(state: FightState, focus: GalleryFocus): FightState {
  const target = focus.originalId
  if (target !== 'player' && target !== 'opponent') return state
  if ((focus.originalMember ?? 0) !== (state.teamMatch?.seats[target].active ?? 0)) return state
  return state[target].hanzoProjection
    ? { ...state, [target]: wakeHanzoBody(state[target]) }
    : state
}
function originalPosition(
  state: FightState,
  focus: GalleryFocus,
): { x: number; y: number } | undefined {
  if (focus.originalId === 'player' || focus.originalId === 'opponent') {
    const body = physicalBodyAt(state, focus.originalId, focus.originalMember)
    return body ? sleepingBody(body) : undefined
  }
  const entry = state.battlefield?.entities.find(
    (e) => e.id === focus.originalId && e.present && e.health > 0,
  )
  if (!entry) return storedKitPosition(state, focus.originalId)
  if (entry.copy && historicalCopyExpired(state, entry)) return undefined
  return entry.device ? devicePosition(state, entry) : entry
}
export function galleryCopies(
  state: FightState,
  side: FightSide,
  focus: GalleryFocus,
): PreparedEntity[] {
  return (state.battlefield?.entities ?? []).filter(
    (entry) =>
      entry.copy?.owner === side &&
      entry.health > 0 &&
      !historicalCopyExpired(state, entry) &&
      entry.copy.originalId === focus.originalId &&
      entry.copy.originalMember === focus.originalMember,
  )
}
function copyPosition(
  state: FightState,
  entry: PreparedEntity,
): { x: number; y: number } | undefined {
  if (entry.device?.carrier) {
    const body = deviceCarrierBody(state, entry)
    return body ? devicePosition(state, entry) : undefined
  }
  if (entry.present) return entry
  return storedKitPosition(state, entry.id)
}
function storedKitPosition(state: FightState, id: string): { x: number; y: number } | undefined {
  for (const side of ['player', 'opponent'] as const) {
    const bodies = state.teamMatch?.seats[side].members ?? [state[side]]
    for (let index = 0; index < bodies.length; index++) {
      const body = physicalBodyAt(state, side, index)!
      if (body.writingKit?.sourceId === id) return sleepingBody(body)
    }
  }
  return undefined
}
function copyContacts(
  state: FightState,
  owner: FightSide,
  volume: { entry: PreparedEntity; at: { x: number; y: number } },
): GalleryContact[] {
  const { entry, at } = volume
  const points = [...bodyContacts(state, owner), ...objectContacts(state, entry.id)]
  const { width: halfWidth, height } = galleryVolume(entry)
  return points.filter(
    (p) => Math.abs(p.x - at.x) <= halfWidth && p.y >= at.y && p.y <= at.y + height,
  )
}
function bodyContacts(state: FightState, owner: FightSide): GalleryContact[] {
  return (['player', 'opponent'] as const).flatMap((side) => sideBodies(state, { side, owner }))
}
function sideBodies(
  state: FightState,
  context: { side: FightSide; owner: FightSide },
): GalleryContact[] {
  const { side, owner } = context
  const count = state.teamMatch?.seats[side].members.length ?? 1
  const active = state.teamMatch?.seats[side].active ?? 0
  const points: GalleryContact[] = []
  for (let member = 0; member < count; member++) {
    if (side === owner && member === active) continue
    points.push(...bodyVessels(state, { side, member }))
  }
  return points
}
function bodyVessels(
  state: FightState,
  identity: { side: FightSide; member: number },
): GalleryContact[] {
  const { side, member } = identity
  const actor = physicalBodyAt(state, side, member)!
  const body = sleepingBody(actor)
  const points: GalleryContact[] = [
    { key: `body:${side}:${member}`, side, member, x: body.x, y: body.y },
  ]
  if (actor.hanzoProjection)
    points.push({
      key: `projection:${side}:${member}`,
      side,
      member,
      projection: true,
      x: actor.x,
      y: actor.y,
    })
  return points
}
function objectContacts(state: FightState, excluded: string): GalleryContact[] {
  return (state.battlefield?.entities ?? [])
    .filter(
      (object) =>
        object.present &&
        object.health > 0 &&
        object.id !== excluded &&
        !['destination', 'delivery'].includes(object.kind),
    )
    .map((object) => {
      const point = object.device ? devicePosition(state, object) : object
      return { key: object.id, x: point.x, y: point.y }
    })
}
export function liveGalleryContacts(state: FightState, side: FightSide): GalleryContact[] {
  const focus = state[side].chrolloHistorical?.galleryFocus
  if (!focus || !galleryTouchReady(state, side, focus)) return []
  const unique = new Map<string, GalleryContact>()
  for (const entry of galleryCopies(state, side, focus)) {
    const point = copyPosition(state, entry)
    if (point)
      for (const contact of copyContacts(state, side, { entry, at: point }))
        unique.set(contact.key, contact)
  }
  return [...unique.values()]
}
function gallerySourceKey(source: GalleryFocus): string {
  return source.originalMember === undefined
    ? source.originalId
    : `body:${source.originalId}:${source.originalMember}`
}
function gallerySources(state: FightState, side: FightSide): GalleryFocus[] {
  const sources = new Map<string, GalleryFocus>()
  for (const entry of state.battlefield?.entities ?? []) {
    if (entry.copy?.owner !== side) continue
    const focus = { originalId: entry.copy.originalId, originalMember: entry.copy.originalMember }
    sources.set(gallerySourceKey(focus), focus)
  }
  return [...sources.values()]
}
export function gallerySenseOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!chrolloHasActivePage(state[side], 'gallery-fake')) return []
  const sources = gallerySources(state, side)
  const commands: ArsenalCommand[] = sources.map((source) => ({
    action: 'history-gallery-locate',
    target: gallerySourceKey(source),
  }))
  if (state[side].chrolloHistorical?.galleryFocus) commands.push({ action: 'history-gallery-stop' })
  return commands.map((command) => ({
    command,
    ready: performGallerySense(state, side, command) !== state,
    labelFr:
      command.action === 'history-gallery-stop'
        ? 'Gallery Fake · Cesser le contact'
        : `Gallery Fake · Repérer · ${galleryOriginalLabel(
            state,
            sources.find((item) => gallerySourceKey(item) === command.target)!,
            'fr',
          )}`,
    labelEn:
      command.action === 'history-gallery-stop'
        ? 'Gallery Fake · Stop contact'
        : `Gallery Fake · Locate · ${galleryOriginalLabel(
            state,
            sources.find((item) => gallerySourceKey(item) === command.target)!,
            'en',
          )}`,
    conditionFr:
      'Garder la main gauche au contact de l’original et Gallery Fake actif. Position des copies réellement présentes et contacts à l’intérieur de leur volume, sans rayon d’En universel ni lecture des pensées. Après interruption, seule la dernière observation datée reste disponible.',
    conditionEn:
      'Keep the left hand in contact with the original and Gallery Fake active. Actual copy positions and contacts within their volume, without a universal En radius or mind reading. Interruption leaves only the last dated observation.',
  }))
}

function galleryOriginalLabel(
  state: FightState,
  source: GalleryFocus,
  language: 'fr' | 'en',
): string {
  if (source.originalMember !== undefined)
    return `${language === 'fr' ? 'Personne copiée' : 'Copied person'} · ${source.originalId === 'player' ? 'P1' : 'P2'} / ${source.originalMember + 1}`
  const original = state.battlefield?.entities.find((e) => e.id === source.originalId)
  if (!original) return language === 'fr' ? 'Original matériel' : 'Physical original'
  return galleryMaterialLabel(original, language)
}
function galleryMaterialLabel(original: PreparedEntity, language: 'fr' | 'en'): string {
  if (original.writingKit) return language === 'fr' ? 'Matériel d’écriture' : 'Writing supplies'
  if (original.kind === 'room') return language === 'fr' ? 'Pièce' : 'Room'
  if (original.device) {
    const names = {
      camera: ['Caméra', 'Camera'],
      firearm: ['Arme à feu', 'Firearm'],
      transmitter: ['Émetteur', 'Transmitter'],
      receiver: ['Récepteur', 'Receiver'],
    }
    return names[original.device.kind][language === 'fr' ? 0 : 1]
  }
  return ENTITY_LABELS[language][original.kind]
}
