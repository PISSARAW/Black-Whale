import { concealDeviceMedia } from '../devicePrivacy'
import { futureVisibleState } from '../parallelFuturePresentation'
import { bungeeVisible } from '../hisokaTechnique'
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
  'killerSide',
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
  if (SIDE_FIELDS.has(field) && value === 'player') return 'opponent'
  if (SIDE_FIELDS.has(field) && value === 'opponent') return 'player'
  if (Array.isArray(value)) return value.map((entry) => localPerspective(entry, true, field))
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key === 'player' ? 'opponent' : key === 'opponent' ? 'player' : key,
      localPerspective(entry, true, key),
    ]),
  )
}
function redactEnemy(enemy: ArcadeFighter) {
  enemy.blackVoiceScreen = undefined
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
  enemy.bodyAndSoulReplies = undefined
  enemy.secretWindow = undefined
  enemy.melodyHearing = undefined
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
    enemy.chrolloBook = {
      ...enemy.chrolloBook,
      pagesPrivate: true,
      pages: [],
      bookmark: null,
      page: 0,
    }
}
export function privatePvpState(state: FightState, side: FightSide): FightState {
  const view = structuredClone(futureVisibleState(state, side))
  const other = side === 'player' ? 'opponent' : 'player'
  concealDeviceMedia(view.battlefield)
  redactEnemy(view[other])
  redactReserves(view, other)
  hideConcealedAura(view[other], view[side])
  view.commandFeedback = { [side]: view.commandFeedback?.[side] }
  if (view.parallelFuture?.owner !== side) view.parallelFuture = undefined
  for (const frame of view.parallelFuture?.frames ?? []) {
    concealDeviceMedia(frame.battlefield)
    redactEnemy(frame[other])
    hideConcealedAura(frame[other], frame[side])
    frame.projectiles = frame.projectiles.filter(
      (shot) => shot.owner === side || perceivesProjectile(frame[side], shot),
    )
    frame.command = null
  }
  if (view.parallelFuture) view.parallelFuture.controls = null
  view.bungeeGum = bungeeVisible(state, side) ? view.bungeeGum : null
  view.projectiles = view.projectiles.filter(
    (shot) => shot.owner === side || perceivesProjectile(state[side], shot),
  )
  // No second perspective selector or opponent-private controls in the ordinary HUD.
  const result = localPerspective(view, side === 'opponent') as FightState
  return { ...result, mode: 'versus-ai', pvpSeat: side }
}
function hideConcealedAura(enemy: ArcadeFighter, observer: ArcadeFighter) {
  if (gyoSight(observer)) return
  if (enemy.nen.in) {
    enemy.nen = createFightingNen()
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
