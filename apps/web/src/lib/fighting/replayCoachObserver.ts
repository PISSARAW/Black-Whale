import { attackPhase, otherSide } from './frameData'
import { visibleRecovery, coachTransitionSupported } from './replayCoachPerception'
import { probeRecoveryResponse } from './replayCoachProbe'
import { COACH_MAX_FINDINGS, COACH_MAX_PROBES, type ReplayCoachFinding } from './replayCoachTypes'
import type { FightSide, FightState } from './types'

interface Window {
  key: string
  note: ReplayCoachFinding
  freeFrames: number
  answered: boolean
}
export function createReplayCoachObserver(side: FightSide) {
  let window: Window | null = null
  let lastKey = ''
  let lastOwnAction = 0
  let lastPunished = ''
  let probes = 0
  const findings: ReplayCoachFinding[] = []
  function add(note: ReplayCoachFinding) {
    if (findings.length < COACH_MAX_FINDINGS) findings.push(note)
  }
  function close() {
    if (window && !window.answered && window.freeFrames >= (window.note.responseFrames ?? 1))
      add(window.note)
    window = null
  }
  function observeHit(before: FightState, after: FightState) {
    const hit = after.impact
    if (!hit || hit.sequence === before.impact?.sequence) return
    if (hit.attacker === side && !hit.blocked && window) window.answered = true
    const id = `${after.roundNumber}:${hit.sequence}`
    if (!incomingPunish(after, side) || id === lastPunished) return
    lastPunished = id
    add({
      id: `punished:${id}`,
      kind: 'recovery-punished',
      side,
      round: after.roundNumber,
      frame: after.frame,
      packet: Math.max(0, lastOwnAction - 1),
    })
  }
  function observeRecovery(after: FightState, packet: number) {
    const enemy = after[otherSide(side)]
    const key = enemy.attack
      ? `${after.roundNumber}:${enemy.attack.moveId}:${after.frame - enemy.attack.frame}`
      : ''
    if (window && (key !== window.key || attackPhase(enemy) !== 'recovery')) close()
    if (!visibleRecovery(after, side)) return
    if (window) {
      window.freeFrames++
      return
    }
    if (lastKey === key || probes >= COACH_MAX_PROBES) return
    lastKey = key
    probes++
    const frames = probeRecoveryResponse(after, side)
    if (frames === null) return
    window = {
      key,
      freeFrames: 1,
      answered: false,
      note: {
        id: `recovery:${key}`,
        kind: 'recovery-opportunity',
        side,
        round: after.roundNumber,
        frame: after.frame,
        packet,
        responseFrames: frames,
      },
    }
  }
  return {
    observe(before: FightState, after: FightState, packet: number) {
      if (!coachTransitionSupported(before, after)) {
        window = null
        return
      }
      if (before[side].attack?.frame === 0) lastOwnAction = packet
      observeHit(before, after)
      observeRecovery(after, packet)
    },
    finish: close,
    get findings() {
      return findings.slice()
    },
    get probes() {
      return probes
    },
  }
}

function incomingPunish(state: FightState, side: FightSide) {
  const hit = state.impact
  return Boolean(hit && hit.attacker !== side && hit.punish && !hit.blocked && hit.damage > 0)
}
