import { sunMoonChargeAi } from './sunMoonChargeAi'
import { gumResuscitationAi } from './gumResuscitationAi'
import { ghostwriterAi } from './ghostwriterAi'
import { machiReattachmentAi } from './machiReattachmentAi'
import { performMachiMaterial } from './machiMaterial'
import { blackVoiceAvailable } from './blackVoiceControl'
import { luiniArsenalAi } from './luiniArsenal'
import { machiThreadForOwner } from './machiThread'
import { performArsenalCommand } from './retrospectiveArsenal'
import type { DuelAttack } from './duelStep/types'
import type { FightState } from './types'

export function priorityArsenalAi(state: FightState): FightState | null {
  const actor = state.opponent
  const bomb = sunMoonChargeAi(state)
  if (bomb !== state) return bomb
  const priorOrder = gumResuscitationAi(state)
  if (priorOrder !== state) return priorOrder
  const fortune = ghostwriterAi(state)
  if (fortune !== state) return fortune
  const stitching = machiReattachmentAi(state)
  if (stitching !== state) return stitching
  let next = state
  if (actor.id === 'halkenburg')
    next = performArsenalCommand(state, 'opponent', { action: 'halkenburg-transfer' })
  else if (actor.id === 'kurapika') next = kurapikaLoanAi(state)
  else if (actor.id === 'chrollo') next = chrolloPuppetAi(state)
  else if (actor.id === 'machi') next = machiMaterialAi(state)
  return next === state ? null : next
}

/** Partial emergence blocks ordinary actions, but the AI may still complete the passage. */
export function priorityBusyAi(state: FightState, attack: DuelAttack): FightState | null {
  return state.opponent.luiniPassage ? luiniArsenalAi(state, attack) : null
}

function kurapikaLoanAi(state: FightState): FightState {
  if (state.frame % 180 >= 30) return state
  return performArsenalCommand(state, 'opponent', { action: 'dolphin-loan' })
}

function chrolloPuppetAi(state: FightState): FightState {
  if (state.frame < 180 || state.opponent.aura < 25) return state
  if (
    state.rosterGuests?.some((guest) => guest.owner === 'opponent' && guest.phase !== 'eliminated')
  )
    return state
  if (blackVoiceAvailable(state, 'opponent'))
    return performArsenalCommand(state, 'opponent', { action: 'black-roster' })
  if (!state.opponent.chrolloBook?.pages.includes('black-voice')) return state
  return performArsenalCommand(state, 'opponent', { action: 'history-page', target: 'black-voice' })
}

function machiMaterialAi(state: FightState): FightState {
  const actor = state.opponent,
    thread = machiThreadForOwner(state, 'opponent')
  if (thread?.kind === 'bind') {
    const length = Math.max(
      4,
      Math.ceil(Math.hypot(actor.x - state.player.x, actor.y - state.player.y)),
    )
    if ((thread.length ?? 16) > length)
      return performMachiMaterial({
        state,
        side: 'opponent',
        command: { action: 'machi-length', target: String(length) },
      })
  }
  if (actor.openWounds && Math.abs(actor.x - state.player.x) > 16)
    return performMachiMaterial({
      state,
      side: 'opponent',
      command: { action: 'machi-suture', target: 'opponent' },
    })
  return state
}
