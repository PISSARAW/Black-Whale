import type { FightState } from '../types'
import { isCareerDuel } from './eligibility'
import type { CareerProfile, PendingRematchVow, RematchVowKind } from './types'

export interface ActiveRematchVow extends PendingRematchVow {
  breached: boolean
  retreatFrames: number
  lastDistance: number
  lockedHatsu?: string
}

declare module '../types' {
  interface FightState {
    rematchVow?: ActiveRematchVow
  }
}

export function applyRematchVow(state: FightState, profile: CareerProfile): FightState {
  if (!isCareerDuel(state)) return state
  const vow = profile.rematchVows[state.opponent.id]
  if (!vow) return state
  return {
    ...state,
    rematchVow: {
      ...vow,
      breached: false,
      retreatFrames: 0,
      lastDistance: distance(state),
    },
  }
}

export function advanceRematchVow(state: FightState): FightState {
  const vow = state.rematchVow
  if (!vow || vow.breached || state.phase !== 'fighting') return state
  const attackHatsu = state.player.attack?.hatsuSource ? state.player.attack.moveId : undefined
  const lastDistance = distance(state)
  const retreatFrames = lastDistance > vow.lastDistance + 0.05 ? vow.retreatFrames + 1 : 0
  const lockedHatsu = vow.lockedHatsu ?? attackHatsu
  const breached = breach(vow.kind, state, retreatFrames, lockedHatsu, attackHatsu)
  return {
    ...state,
    rematchVow: { ...vow, retreatFrames, lastDistance, lockedHatsu, breached },
    player: breached
      ? { ...state.player, aura: 0, nen: { ...state.player.nen, mode: 'zetsu' } }
      : state.player,
  }
}

function breach(
  kind: RematchVowKind,
  state: FightState,
  retreatFrames: number,
  lockedHatsu?: string,
  attackHatsu?: string,
): boolean {
  if (kind === 'no-retreat') return retreatFrames > 10
  if (kind === 'open-hatsu') return state.player.nen.in
  return Boolean(lockedHatsu && attackHatsu && lockedHatsu !== attackHatsu)
}

function distance(state: FightState): number {
  return Math.abs(state.player.x - state.opponent.x)
}

export function rematchVowLabel(kind: RematchVowKind, language: 'fr' | 'en'): string {
  const labels: Record<RematchVowKind, readonly [string, string]> = {
    'no-retreat': ['Sans retraite', 'No retreat'],
    'open-hatsu': ['Hatsu à découvert', 'Open Hatsu'],
    'single-hatsu': ['Un seul Hatsu', 'Single Hatsu'],
  }
  return labels[kind][language === 'fr' ? 0 : 1]
}
