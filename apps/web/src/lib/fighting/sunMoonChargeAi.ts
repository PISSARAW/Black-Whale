import { sunMoonChargeOptions } from './sunMoonChargeOptions'
import { performSunMoonCharge } from './sunMoonCharge'
import { traceArsenal } from './arsenalTrace'
import { perceivedOpponentGap } from './opponentAwareness'
import type { FightState } from './types'

/** Only nearby real matter and a known opening; no invented safe future or material. */
export function sunMoonChargeAi(state: FightState): FightState {
  if (state.opponent.id !== 'chrollo' || perceivedOpponentGap(state) < 20) return state
  const option = sunMoonChargeOptions(state, 'opponent').find(
    (entry) => entry.ready && entry.command.action !== 'sun-moon-release',
  )
  if (!option) return state
  const next = performSunMoonCharge(state, 'opponent', option.command)
  return traceArsenal({ state, side: 'opponent', command: option.command }, next)
}
