import { redactBattleModels } from '../metamorphosenModels'
import { redactPriorityWorld } from '../priorityPrivacy'
import { enContactReadings } from '../en/contacts'
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
  'origin',
  'target',
  'issuer',
  'recipient',
  'victimSide',
  'killerSide',
  'weaponSide',
  'attacker',
  'side',
  'winner',
  'matchWinner',
  'speaker',
  'questioner',
  'asker',
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
  const scalar = swappedScalar(value, field)
  if (scalar !== value) return scalar
  if (Array.isArray(value)) return value.map((entry) => localPerspective(entry, true, field))
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key === 'player' ? 'opponent' : key === 'opponent' ? 'player' : key,
      localPerspective(entry, true, key),
    ]),
  )
}
function swappedScalar(value: unknown, field: string): unknown {
  if (SIDE_FIELDS.has(field) && value === 'player') return 'opponent'
  if (SIDE_FIELDS.has(field) && value === 'opponent') return 'player'
  if (field !== 'key') return value
  if (value === 'mind:player') return 'mind:opponent'
  return value === 'mind:opponent' ? 'mind:player' : value
}
function redactEnemy(enemy: ArcadeFighter) {
  if (enemy.halkSoul) enemy.halkSoul = { ...enemy.halkSoul, mind: undefined }
  enemy.halkSedativeSpent = undefined
  enemy.guardianWords = undefined
  enemy.toxinExposure = undefined
  enemy.futureStoredFrames = undefined
  enemy.futureIllusionMode = undefined
  enemy.gumHeartArmed = undefined
  enemy.gumHeartPreparation = undefined
  redactBattleModels(enemy)
  enemy.luiniExit = undefined
  enemy.luiniSelectedDestination = undefined
  enemy.luiniComplete = undefined
  if (enemy.bloodyMary) enemy.bloodyMary = { ...enemy.bloodyMary, lastSeen: undefined }
  enemy.biohazardFootage = undefined
  enemy.biohazardSignal = undefined
  enemy.biohazardDevices = enemy.biohazardDevices?.map((item) => ({
    ...item,
    recordings: undefined,
  }))
  enemy.gumThrowReady = undefined
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
      aiPlan: undefined,
      aiLastUse: undefined,
    }
  enemy.heardCorpse = undefined
  enemy.bodyAndSoulReplies = undefined
  enemy.secretWindow = undefined
  enemy.secretWindowMode = undefined
  enemy.sweetHomeObject = undefined
  enemy.melodyHearing = undefined
  enemy.speechPulse = undefined
  enemy.comboMaster = undefined
  enemy.bufferedAttack = null
  enemy.predator = enemy.predator ? { ...enemy.predator, known: [], analysis: null } : undefined
  enemy.kallutoPaper = enemy.kallutoPaper ? { ...enemy.kallutoPaper, heard: undefined } : undefined
  enemy.hatsuEffects = {
    ...enemy.hatsuEffects,
    witnessedHatsu: null,
    witnessedAt: undefined,
    witnessedMoveId: undefined,
  }
  if (enemy.chrolloBook)
    enemy.chrolloBook = { ...enemy.chrolloBook, pages: [], bookmark: null, page: 0 }
}
export function privatePvpState(state: FightState, side: FightSide): FightState {
  const view = structuredClone(futureVisibleState(state, side))
  view.toxinClouds = view.toxinClouds?.filter((cloud) => cloud.owner === side)
  view.arsenalTrace = undefined
  redactSoulView(view, side)
  const other = side === 'player' ? 'opponent' : 'player'
  view.enReadings = enContactReadings(view, side)
  redactEnemy(view[other])
  redactGuests(view, other)
  redactReserves(view, other)
  redactPriorityWorld(view, side)
  hideConcealedAura(view[other], view[side])
  view.commandFeedback = { [side]: view.commandFeedback?.[side] }
  if (view.parallelFuture?.owner !== side) view.parallelFuture = undefined
  if (view.futureIllusion?.owner !== side) view.futureIllusion = undefined
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
    redactPriorityWorld({ ...view, ...frame }, side)
    for (const guest of frame.scene?.rosterGuests ?? [])
      if (guest.owner === other) redactEnemy(guest.fighter)
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
}
function hideConcealedAura(enemy: ArcadeFighter, observer: ArcadeFighter) {
  if (gyoSight(observer)) return
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
export function pvpSnapshot(state: FightState, side: FightSide) {
  const visible = privatePvpState(state, side)
  return { snapshot: encodeFightSnapshot(visible), snapshotHash: fightReplayHash(visible) }
}

function redactReserves(view: FightState, side: FightSide): void {
  for (const member of view.teamMatch?.seats[side].members ?? []) redactEnemy(member)
}

function redactSoulView(view: FightState, side: FightSide): void {
  view.halkSoulLinks = view.halkSoulLinks?.map((link) => ({
    ...link,
    sourceMind:
      link.sourceMind.side === side ? link.sourceMind : { ...link.sourceMind, identity: undefined },
    targetMind:
      link.targetMind.side === side ? link.targetMind : { ...link.targetMind, identity: undefined },
    preparedSedative: link.owner === side ? link.preparedSedative : 0,
  }))
  if (view.halkenburgModes) view.halkenburgModes = { [side]: view.halkenburgModes[side] }
}
