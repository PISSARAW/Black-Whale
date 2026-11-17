import { seesCombatBody } from './fightCounterplay'
import { senseDeprived } from './saiyuSenses'
import { deviceEntity, touchesDevice } from './physicalDevices'
import { dowsingBodyReady } from './dowsingRules'
import { triggerHatsuAction } from './hatsu'
import { judgmentActionBreach } from './judgmentAction'
import { DOWSING_COST, DOWSING_MOVE } from './dowsingTypes'
import type { RecordedSpeech } from './deviceTypes'
import type { ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function videoDowsingFocus(state: FightState, side: FightSide, deviceId: string): boolean {
  const camera = deviceEntity(state, deviceId)
  return Boolean(
    camera?.device?.kind === 'camera' &&
    camera.device.batteryFrames > 0 &&
    touchesDevice(state, side, camera) &&
    state[side].kurapika?.emperorTime &&
    videoSensesReady(state[side]) &&
    dowsingBodyReady(state[side]),
  )
}
function videoSensesReady(actor: FightState['player']): boolean {
  return (
    seesCombatBody(actor) &&
    !actor.clothCapture &&
    !actor.coveringEars &&
    !senseDeprived(actor, 'hearing')
  )
}
function eligibleVideoPlayback(
  state: FightState,
  side: FightSide,
  index: number,
): Omit<RecordedSpeech, 'deliberateLie'> | undefined {
  const playback = state[side].devicePlayback
  if (!playback || !videoDowsingFocus(state, side, playback.deviceId)) return undefined
  const visible = playback.words[index]
  if (!visible?.visibleBody || !visible.bodyKey || visible.sampleId === undefined) return undefined
  const met = state[side].personalEncounters?.some(
    (e) =>
      e.bodyKey === visible.bodyKey &&
      e.appearance === visible.appearance &&
      (e.round < state.roundNumber || (e.round === state.roundNumber && e.frame < state.frame)),
  )
  if (!met) return undefined
  return visible
}
function videoWord(state: FightState, side: FightSide, index: number): RecordedSpeech | undefined {
  const visible = eligibleVideoPlayback(state, side, index)
  if (!visible) return undefined
  const deviceId = state[side].devicePlayback!.deviceId
  return deviceEntity(state, deviceId)?.device?.words?.find(
    (word) =>
      word.sampleId === visible.sampleId &&
      word.frame === visible.frame &&
      word.subject === visible.subject &&
      word.bodyKey === visible.bodyKey &&
      word.appearance === visible.appearance &&
      word.text === visible.text &&
      word.visibleBody,
  )
}
export function canReadDowsingVideo(state: FightState, side: FightSide, index: number): boolean {
  return (
    !state[side].dowsingSession &&
    state[side].aura >= DOWSING_COST &&
    Boolean(eligibleVideoPlayback(state, side, index))
  )
}
export function performDowsingVideo(
  state: FightState,
  side: FightSide,
  target?: string,
): FightState {
  if (!target || !/^\d{1,3}$/.test(target)) return state
  const index = Number(target)
  if (!canReadDowsingVideo(state, side, index)) return state
  const word = videoWord(state, side, index)
  if (!word) return state
  const breach = judgmentActionBreach({
    state,
    side,
    kind: 'special',
    moveId: DOWSING_MOVE,
    auraCharged: false,
  })
  if (breach) return breach
  const deviceId = state[side].devicePlayback!.deviceId
  const witnessed = triggerHatsuAction({ state, side, source: 'kurapika', moveId: DOWSING_MOVE })
  const swings = word.deliberateLie === true
  return {
    ...witnessed,
    [side]: {
      ...witnessed[side],
      aura: witnessed[side].aura - DOWSING_COST,
      dowsingScreened: [
        ...(state[side].dowsingScreened ?? []),
        { deviceId, sampleId: word.sampleId! },
      ].slice(-480),
      dowsingSession: {
        question: 'recording',
        target: word.subject,
        startedAt: state.frame,
        readingAt: state.frame,
        swings,
        video: { deviceId },
      },
      dowsingReading: {
        frame: state.frame,
        text: word.text,
        swings,
        inconclusive: word.deliberateLie === undefined,
        source: { deviceId, recordedAt: word.frame, sampleId: word.sampleId! },
      },
    },
  }
}
export function dowsingVideoOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!state[side].devicePlayback) return []
  return state[side].devicePlayback!.words.map((word, index) => ({
    command: { action: 'dowsing-video', target: String(index) },
    labelFr: `Dowsing · Vidéo ${Math.floor(word.frame / 60)} s · ${word.text}`,
    labelEn: `Dowsing · Video ${Math.floor(word.frame / 60)} s · ${word.text}`,
    ready: canReadDowsingVideo(state, side, index),
    conditionFr:
      'Emperor Time, personne rencontrée auparavant et caméra réellement accessible. Analyse des paroles enregistrées avec visage visible, sans déduire la vérité objective. Coût de 3 aura : réglage de duel.',
    conditionEn:
      'Emperor Time, a previously met subject and physical access to the actual camera. Screens recorded speech with a visible face without revealing objective truth. The 3 aura cost is duel tuning.',
  }))
}
