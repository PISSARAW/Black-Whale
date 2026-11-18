import { otherSide } from './frameData'
import type { FightSide, FightState } from './types'

export const SWEET_HOME_ACCENT_FRAMES = 18
export type SweetHomeRecipient =
  { kind: 'body'; side: FightSide } | { kind: 'object'; id: string; x: number; y: number }
export interface SweetHomeAccent {
  id: string
  owner: FightSide
  from: FightSide
  recipient: SweetHomeRecipient
  backlash: boolean
  damage: number
  started: number
  age: number
}
function confirmedTransfer(state: FightState): Omit<SweetHomeAccent, 'started' | 'age'> | null {
  const hit = state.impact
  if (!hit || hit.avoided || hit.invulnerable) return null
  const object = hit.objectTransfer
  if (object && object.damage > 0) {
    const target = state.battlefield?.entities.find(
      (e) => e.id === object.objectId && e.material === 'real',
    )
    if (!target) return null
    return {
      id: `${object.owner}:sweet-home:${hit.sequence}`,
      owner: object.owner,
      from: otherSide(hit.attacker),
      recipient: { kind: 'object', id: target.id, x: target.x, y: target.y },
      backlash: false,
      damage: object.damage,
    }
  }
  if (!hit.transfer || hit.damage <= 0) return null
  return {
    id: `${hit.transfer.owner}:sweet-home:${hit.sequence}`,
    owner: hit.transfer.owner,
    from: hit.transfer.from,
    recipient: { kind: 'body', side: hit.transfer.to },
    backlash: hit.transfer.backlash,
    damage: hit.damage,
  }
}
/** A confirmed injury transfer is presentation input, never an input press or a stored wound. */
export function createSweetHomeClock() {
  let previous: { key: string; frame: number; impact: number | undefined } | null = null
  let held: SweetHomeAccent[] = []
  return (state: FightState): SweetHomeAccent[] => {
    const next = {
      key: `${state.player.id}:${state.opponent.id}:${state.roundNumber}:${state.environment.stageId}`,
      frame: state.frame,
      impact: state.impact?.sequence,
    }
    if (
      !previous ||
      previous.key !== next.key ||
      next.frame < previous.frame ||
      state.phase !== 'fighting'
    ) {
      previous = next
      held = []
      return []
    }
    if (previous.impact !== next.impact) {
      const event = confirmedTransfer(state)
      if (event) held.push({ ...event, started: next.frame, age: 0 })
    }
    previous = next
    held = held.filter((e) => next.frame - e.started < SWEET_HOME_ACCENT_FRAMES).slice(-8)
    return held.map((e) => ({ ...e, age: next.frame - e.started }))
  }
}
