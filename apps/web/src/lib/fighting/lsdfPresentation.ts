import { lsdfCanPersist } from './lsdf'
import type { FightSide, FightState } from './types'

export function lsdfFighterVisible(state: FightState, side: FightSide): boolean {
  return state.finishReason !== 'expulsion' || state.expulsion?.target !== side
}

const COPY = {
  fr: {
    outside: 'LSDF indisponible · hors de la planque Heil-Ly',
    absent: 'LSDF indisponible · Morena absente',
    lawful: 'LSDF indisponible · aucun intrus en infraction',
    sealed: 'LSDF indisponible · Nen inutilisable',
    aura: 'LSDF indisponible · 40 aura requises',
    guards: 'Gardes invulnérables · niveau',
    approaching: 'interpellation',
    escorting: 'escorte vers la sortie',
    ready: 'L · Se présenter · 40 aura · expulsion sans dégâts',
  },
  en: {
    outside: 'LSDF unavailable · outside the Heil-Ly hideout',
    absent: 'LSDF unavailable · Morena absent',
    lawful: 'LSDF unavailable · no unlawful intruder',
    sealed: 'LSDF unavailable · Nen unusable',
    aura: 'LSDF unavailable · requires 40 aura',
    guards: 'Invulnerable guards · level',
    approaching: 'approaching',
    escorting: 'escorting out',
    ready: 'L · Introduce yourself · 40 aura · expel without damage',
  },
}

export function lsdfHint(state: FightState, side: FightSide, language: 'fr' | 'en'): string {
  const copy = COPY[language]
  if (state.environment.stageId !== 'heilly-hideout') return copy.outside
  if (!state.environment.morenaPresent) return copy.absent
  const target = side === 'player' ? 'opponent' : 'player'
  if (!state.environment.unlawfulIntruders[target] || state[target].id === 'morena')
    return copy.lawful
  if (!lsdfCanPersist(state, side)) return copy.sealed
  const guard = state.lsdf?.[side]
  if (guard) return `${copy.guards} ${guard.level} · ${copy[guard.phase]}`
  return state[side].aura < 40 ? copy.aura : copy.ready
}
