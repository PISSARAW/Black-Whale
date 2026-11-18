import { opposingKameoBodies } from '../kameos/pvp'
import { redactLegacyArsenal } from '../legacyArsenalPrivacy'
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
import { createFightingNen } from '../nen'
import { encodeFightSnapshot } from '../fightReplaySnapshot'
import { fightReplayHash } from '../fightReplayHash'
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
  'subject',
  'affected',
  'cohorts',
  'recipientSide',
  'from',
  'to',
  'catsNameConsumed',
  'visitedBy',
  'transported',
  'sun',
  'moon',
])
export function localPerspective(value: unknown, swap: boolean, field = ''): unknown {
  if (!swap) return value
  if (field === 'sustainedKeys' && typeof value === 'string') return localSustainedKey(value)
  if (SIDE_FIELDS.has(field) && typeof value === 'string') return localSide(value)
  if (Array.isArray(value)) return value.map((entry) => localPerspective(entry, true, field))
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key === 'player' ? 'opponent' : key === 'opponent' ? 'player' : key,
      localPerspective(entry, true, key),
    ]),
  )
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
export function privatePvpState(state: FightState, side: FightSide): FightState {
  const view = structuredClone(futureVisibleState(state, side))
  view.arsenalTrace = undefined
  const other = side === 'player' ? 'opponent' : 'player'
  view.enReadings = enContactReadings(view, side)
  concealDeviceMedia(view.battlefield)
  concealDolphinPeople(view, side)
  concealPaperScatters(view, side)
  redactEnemy(view[other])
  redactGuests(view, other)
  redactReserves(view, other)
  redactPriorityWorld(view, side)
  hideConcealedAura(view[other], view[side])
  view.commandFeedback = { [side]: view.commandFeedback?.[side] }
  if (view.parallelFuture?.owner !== side) view.parallelFuture = undefined
  redactForecast(view, side, other)
  if (view.parallelFuture) view.parallelFuture.controls = null
  view.bungeeGum = bungeeVisible(view, side) ? view.bungeeGum : null
  view.projectiles = privateGumProjectiles(view, side)
  view.gumNetwork = privateGumNetwork(view, side)
  view.projectiles = view.projectiles.filter(
    (shot) => shot.owner === side || perceivesProjectile(state[side], shot),
  )
  // No second perspective selector or opponent-private controls in the ordinary HUD.
  const result = localPerspective(view, side === 'opponent') as FightState
  return { ...result, mode: 'versus-ai', pvpSeat: side }
}
function redactForecast(view: FightState, side: FightSide, other: FightSide): void {
  for (const frame of view.parallelFuture?.frames ?? []) {
    privateGumFuture(view, frame, side)
    concealDeviceMedia(frame.battlefield)
    concealDolphinPeople(frame, side)
    concealPaperScatters(frame, side)
    redactEnemy(frame[other])
    hideConcealedAura(frame[other], frame[side])
    frame.projectiles = frame.projectiles.filter(
      (shot) => shot.owner === side || perceivesProjectile(frame[side], shot),
    )
    frame.command = null
  }
}
function redactGuests(view: FightState, other: FightSide): void {
  for (const guest of view.rosterGuests ?? []) if (guest.owner === other) redactEnemy(guest.fighter)
  for (const kameo of opposingKameoBodies(view, other)) redactEnemy(kameo)
}
function hideConcealedAura(enemy: ArcadeFighter, observer: ArcadeFighter) {
  if (gyoSight(observer)) return
  if (enemy.gumProstheses?.hidden) enemy.gumProstheses = undefined
  hideGumObjectAnchors(enemy)
  if (enemy.nen.in) {
    enemy.nen = createFightingNen()
    enemy.gyoFocus = undefined
    enemy.gyoLow = undefined
    enemy.defensiveKo = undefined
    enemy.dowsingSession = undefined
  }
  if (enemy.gumCatch?.hidden && !enemy.gumCatch.projectile) enemy.gumCatch = undefined
  if (enemy.attack?.concealed) enemy.attack = null
}
function hideGumObjectAnchors(enemy: ArcadeFighter): void {
  const anchors = enemy.gumObjectAnchors?.filter((anchor) => !anchor.hidden)
  enemy.gumObjectAnchors = anchors?.length ? anchors : undefined
}
export function pvpSnapshot(state: FightState, side: FightSide) {
  const visible = privatePvpState(state, side)
  return { snapshot: encodeFightSnapshot(visible), snapshotHash: fightReplayHash(visible) }
}

function redactReserves(view: FightState, side: FightSide): void {
  const observer = view[side === 'player' ? 'opponent' : 'player']
  for (const member of view.teamMatch?.seats[side].members ?? []) {
    redactEnemy(member)
    if (!gyoSight(observer)) hideGumObjectAnchors(member)
  }
}
