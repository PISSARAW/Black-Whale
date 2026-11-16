import type { FightState } from '$lib/fighting/types'
import type { PvpView, PvpInputPacket } from '$lib/fighting/pvp/types'

interface Trial {
  at: number
  action: string
  sequence?: number
  sentMs?: number
  appliedMs?: number
  startedMs?: number
  contactMs?: number
  blocked?: boolean
}
function application(trial: Trial, view: PvpView, state: FightState) {
  if (trial.sequence === undefined || trial.sequence >= view.appliedSequence) return
  const now = performance.now()
  trial.appliedMs ??= now - trial.at
  if (state.player.attack?.kind === trial.action) trial.startedMs ??= now - trial.at
}
/** Isolated, spaced trials only. Contacts come exclusively from confirmed views. */
export function createImpactProbe() {
  let trials: Trial[] = []
  let lastImpact = 0
  const seen = new Set<number>()
  function contact(state: FightState) {
    const impact = state.impact
    if (!impact || impact.sequence === lastImpact) return
    lastImpact = impact.sequence
    if (impact.attacker !== 'player' || impact.avoided || impact.invulnerable) return
    const trial = trials.find(
      (row) =>
        row.startedMs !== undefined && row.contactMs === undefined && row.action === impact.kind,
    )
    if (trial) {
      trial.contactMs = performance.now() - trial.at
      trial.blocked = impact.blocked
    }
  }
  return {
    queue(action: string) {
      trials.push({ at: performance.now(), action })
    },
    sent(packets: PvpInputPacket[]) {
      for (const packet of packets) {
        if (seen.has(packet.sequence)) continue
        seen.add(packet.sequence)
        if (seen.size > 120) seen.delete(seen.values().next().value!)
        for (const command of packet.commands) {
          if (command.kind !== 'move') continue
          const trial = trials.find(
            (row) => row.sequence === undefined && row.action === command.action,
          )
          if (trial) {
            trial.sequence = packet.sequence
            trial.sentMs = performance.now() - trial.at
          }
        }
      }
    },
    observe(view: PvpView, state: FightState) {
      for (const trial of trials) application(trial, view, state)
      contact(state)
    },
    reset() {
      trials = []
    },
    get trials() {
      return trials.map((row) => ({ ...row }))
    },
  }
}
