import { concealFortuneWorld } from '../ghostwriterPrivacy'
import { concealCorpseWorld } from '../illumiCorpsePrivacy'
import { privateHalkenburgSouls } from '../halkenburgSoulPrivacy'
import { opposingKameoBodies } from '../kameos/pvp'
import { redactLegacyArsenal, redactLegacyWorld } from '../legacyArsenalPrivacy'
import { concealDocumentWorld } from '../paperDocumentPrivacy'
import { privateNeedleFaces } from '../illumiNeedlePrivacy'
import { redactPriorityWorld } from '../priorityPrivacy'
import { concealDolphinPeople } from '../dolphinPeoplePrivacy'
import { concealPaperScatters } from '../kallutoScatterVisibility'
import { concealPaperWords } from '../kallutoPrivacy'
import { enContactReadings } from '../en/contacts'
import { concealDeviceMedia } from '../devicePrivacy'
import { futureVisibleState } from '../parallelFuturePresentation'
import { bungeeVisible } from '../hisokaTechnique'
import { privateGumNetwork, privateGumFuture, privateGumProjectiles } from '../bungeePrivacy'
import { perceivesProjectile, gyoSight } from '../nenPerception'
import { concealNenInformation } from '../nenInformationWar'
import { encodeFightSnapshot } from '../fightReplaySnapshot'
import { fightReplayHash } from '../fightReplayHash'
import { immutableFightSnapshot, immutableSnapshotDigest } from '../immutableFightSnapshot'
import type { FutureFrame } from '../parallelFutureTypes'
import type { ArcadeFighter, FightSide, FightState } from '../types'

/** Presentation only: local controls always operate P1; the referee keeps canonical seats. */
const SIDE_FIELDS = new Set([
  'owner',
  'originalId',
  'target',
  'issuer',
  'recipient',
  'victimSide',
  'victim',
  'killerSide',
  'weaponSide',
  'attacker',
  'side',
  'winner',
  'matchWinner',
  'speaker',
  'questioner',
  'asker',
  'carrier',
  'captiveOf',
  'subject',
  'affected',
  'cohorts',
  'preparedAsphyxia',
  'recipientSide',
  'from',
  'to',
  'catsNameConsumed',
  'visitedBy',
  'transported',
  'sun',
  'moon',
])
const SOUL_MIND_FIELDS = new Set(['key', 'participantMind', 'halkRosterMind', 'halkTeamMind'])
function localSoulMindKey(key: string): string {
  return key.replace(
    /^mind:(player|opponent)(?=:|$)/,
    (_, side: string) => `mind:${localSide(side)}`,
  )
}

export function localPerspective(value: unknown, swap: boolean, field = ''): unknown {
  if (!swap) return value
  if (typeof value === 'string') return localReference(value, field)
  if (Array.isArray(value)) return value.map((entry) => localPerspective(entry, true, field))
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key === 'player' ? 'opponent' : key === 'opponent' ? 'player' : key,
      localPerspective(entry, true, key),
    ]),
  )
}
function localReference(value: string, field: string): string {
  if (field === 'sustainedKeys') return localSustainedKey(value)
  if (SOUL_MIND_FIELDS.has(field)) return localSoulMindKey(value)
  return SIDE_FIELDS.has(field) ? localSide(value) : value
}

function localSide(value: string): string {
  if (value === 'player') return 'opponent'
  return value === 'opponent' ? 'player' : value
}
function localSustainedKey(value: string): string {
  return value.replace(/^(player|opponent):/, (side) =>
    side === 'player:' ? 'opponent:' : 'player:',
  )
}

function redactEnemy(enemy: ArcadeFighter) {
  enemy.gumResuscitationProgram = undefined
  // A gum order around the heart is given in secret: the other player cannot see it.
  enemy.gumHeartArmed = undefined
  enemy.gumHeartPreparation = undefined
  enemy.asphyxiaCertificate = undefined
  enemy.gumObjectAnchors = enemy.gumObjectAnchors?.map((anchor) => ({
    ...anchor,
    source: undefined,
    theftId: undefined,
  }))
  redactLegacyArsenal(enemy)
  enemy.blackVoiceScreen = undefined
  enemy.littleEyeScreen = undefined
  if (enemy.blackVoiceGear)
    enemy.blackVoiceGear = {
      phone: enemy.blackVoiceGear.phone?.hand ? enemy.blackVoiceGear.phone : undefined,
      armed: enemy.blackVoiceGear.armed,
      antennas: [],
    }
  enemy.bashoArchive = undefined
  enemy.bashoInquiry = undefined
  if (enemy.bashoPoem?.writingFrames) enemy.bashoPoem = { ...enemy.bashoPoem, text: '...' }
  enemy.dowsingScreened = undefined
  enemy.personalEncounters = undefined
  enemy.devicePlayback = undefined
  enemy.receiverReading = undefined
  enemy.dowsingReading = undefined
  enemy.dowsingAcquaintances = undefined
  enemy.dowsingLocation = undefined
  enemy.judgmentPreset = undefined
  enemy.heardWords = undefined
  enemy.hunterInterview = undefined
  if (enemy.chrolloHistorical)
    enemy.chrolloHistorical = {
      ...enemy.chrolloHistorical,
      phone: undefined,
      galleryFocus: undefined,
      galleryReading: undefined,
      aiPlan: undefined,
      aiLastUse: undefined,
    }
  enemy.heardCorpse = undefined
  enemy.bodyAndSoulReplies = undefined
  enemy.halkSedativeSpent = undefined
  enemy.secretWindow = undefined
  enemy.secretWindowListening = undefined
  enemy.melodyHearing = undefined
  enemy.speechPulse = undefined
  enemy.comboMaster = undefined
  enemy.bufferedAttack = null
  enemy.predator = enemy.predator ? { ...enemy.predator, known: [], analysis: null } : undefined
  enemy.kallutoPaper = concealPaperWords(enemy.kallutoPaper)
  enemy.hatsuEffects = {
    ...enemy.hatsuEffects,
    baton: privateBaton(enemy.hatsuEffects.baton),
    witnessedHatsu: null,
    witnessedAt: undefined,
    witnessedMoveId: undefined,
  }
  if (enemy.chrolloBook)
    enemy.chrolloBook = {
      ...enemy.chrolloBook,
      pagesPrivate: true,
      pages: [],
      bookmark: null,
      page: 0,
    }
}

function privateBaton(baton: ArcadeFighter['hatsuEffects']['baton']) {
  return baton ? { ...baton, markedTarget: null, musseArchive: undefined } : baton
}
export function privatePvpState(
  state: FightState,
  side: FightSide,
  includeTimeline = true,
): FightState {
  const visible = futureVisibleState(state, side)
  const future = visible.parallelFuture?.owner === side ? visible.parallelFuture : undefined
  const view = privateHalkenburgSouls(
    privateNeedleFaces(
      structuredClone({
        ...visible,
        parallelFuture: future && { ...future, frames: [], forecast: undefined, controls: null },
      }),
      side,
    ),
    side,
  )
  redactLegacyWorld(view, side)
  view.arsenalTrace = undefined
  const other = side === 'player' ? 'opponent' : 'player'
  view.enReadings = enContactReadings(view, side)
  concealDeviceMedia(view.battlefield)
  concealDolphinPeople(view, side)
  concealPaperScatters(view, side)
  concealFortuneWorld(view, side)
  concealDocumentWorld(view, side)
  concealCorpseWorld(view, side)
  redactEnemy(view[other])
  redactGuests(view, other)
  redactReserves(view, other)
  redactPriorityWorld(view, side)
  hideConcealedAura(view[other], view[side])
  view.commandFeedback = { [side]: view.commandFeedback?.[side] }
  redactConcealedSound(view, side, other)
  view.bungeeGum = bungeeVisible(view, side) ? view.bungeeGum : null
  view.projectiles = privateGumProjectiles(view, side)
  view.gumNetwork = privateGumNetwork(view, side)
  view.projectiles = view.projectiles.filter(
    (shot) => shot.owner === side || perceivesProjectile(state[side], shot),
  )
  // No second perspective selector or opponent-private controls in the ordinary HUD.
  const result = localPerspective(view, side === 'opponent') as FightState
  const presented = { ...result, mode: 'versus-ai' as const, pvpSeat: side }
  if (includeTimeline && future)
    presented.parallelFuture!.frames = projectForecast(future.frames, view, side)
  return presented
}

function redactConcealedSound(view: FightState, side: FightSide, other: FightSide) {
  if (gyoSight(view[side])) return
  if (view.audioInterceptions)
    view.audioInterceptions = view.audioInterceptions.filter(
      (cue) => cue.side !== other || !cue.concealed,
    )
  if (view.audioContacts) {
    view.audioContacts = view.audioContacts.map((contact) =>
      contact.impact.attacker === other && contact.impact.concealed
        ? { ...contact, moveId: undefined, shape: undefined }
        : contact,
    )
  }
}
const privateForecast = {
  player: new WeakMap<FutureFrame, FutureFrame>(),
  opponent: new WeakMap<FutureFrame, FutureFrame>(),
}

function projectForecast(frames: readonly FutureFrame[], view: FightState, side: FightSide) {
  const cache = privateForecast[side]
  const sharedContext =
    view.halkSoulOrigins ||
    view.halkSoulMinds ||
    view.halkSoulLinks ||
    view.teamMatch ||
    view.rosterGuests?.length
  return frames.map((frame) => {
    // Papers can depend on the live document context and Halkenburg can depend on live
    // identities outside the two forecast bodies. Re-evaluate those views each time.
    const reusable =
      !sharedContext &&
      !frame.battlefield?.entities.some((entry) => entry.document) &&
      immutableSnapshotDigest(frame)
    if (!reusable) return projectForecastFrame(frame, view, side)
    let projected = cache.get(frame)
    if (!projected) {
      projected = immutableFightSnapshot(projectForecastFrame(frame, view, side))
      cache.set(frame, projected)
    }
    return projected
  })
}

function projectForecastFrame(source: FutureFrame, view: FightState, side: FightSide): FutureFrame {
  const frame = structuredClone(source)
  const other = side === 'player' ? 'opponent' : 'player'
  privateGumFuture(view, frame, side)
  concealDeviceMedia(frame.battlefield)
  concealDolphinPeople(frame, side)
  concealPaperScatters(frame, side)
  const documentView = privateHalkenburgSouls(
    privateNeedleFaces({ ...view, ...frame, ...frame.documentContext }, side),
    side,
  )
  frame.player = documentView.player
  frame.opponent = documentView.opponent
  concealFortuneWorld(documentView, side)
  concealDocumentWorld(documentView, side)
  concealCorpseWorld(documentView, side)
  frame.battlefield = documentView.battlefield
  redactEnemy(frame[other])
  hideConcealedAura(frame[other], frame[side])
  frame.projectiles = frame.projectiles.filter(
    (shot) => shot.owner === side || perceivesProjectile(frame[side], shot),
  )
  frame.command = null
  return localPerspective(frame, side === 'opponent') as FutureFrame
}
function redactGuests(view: FightState, other: FightSide): void {
  for (const guest of view.rosterGuests ?? []) if (guest.owner === other) redactEnemy(guest.fighter)
  for (const kameo of opposingKameoBodies(view, other)) redactEnemy(kameo)
}
function hideConcealedAura(enemy: ArcadeFighter, observer: ArcadeFighter) {
  if (gyoSight(observer)) return
  if (enemy.gumProstheses?.hidden) enemy.gumProstheses = undefined
  hideGumObjectAnchors(enemy)
  if (enemy.nen.in) concealNenInformation(enemy, observer)
  hideUnavailableDowsing(enemy)
  if (enemy.gumCatch?.hidden && !enemy.gumCatch.projectile) enemy.gumCatch = undefined
  if (enemy.attack?.concealed) enemy.attack = null
}
function hideUnavailableDowsing(enemy: ArcadeFighter) {
  if (enemy.aura < 0) {
    enemy.dowsingSession = undefined
    enemy.dowsingMapPose = undefined
  }
}
function hideGumObjectAnchors(enemy: ArcadeFighter): void {
  const anchors = enemy.gumObjectAnchors?.filter((anchor) => !anchor.hidden)
  enemy.gumResuscitationProgram = undefined
  enemy.asphyxiaCertificate = undefined
  enemy.gumObjectAnchors = anchors?.length ? anchors : undefined
}
export function pvpSnapshot(state: FightState, side: FightSide, includeTimeline = true) {
  const visible = privatePvpState(state, side, includeTimeline)
  return { snapshot: encodeFightSnapshot(visible), snapshotHash: fightReplayHash(visible) }
}

function redactReserves(view: FightState, side: FightSide): void {
  const observer = view[side === 'player' ? 'opponent' : 'player']
  for (const member of view.teamMatch?.seats[side].members ?? []) {
    redactEnemy(member)
    if (!gyoSight(observer)) hideGumObjectAnchors(member)
  }
}
