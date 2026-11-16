import { bashoPresentation } from './bashoPresentation'
import { moonlightPresentation } from './moonlightPresentation'
import { futureSpecialPresentation } from './parallelFuturePresentation'
import { erigeronPresentation, isErigeronAction } from './billSupport'
import { canUseFightHatsu, FIGHT_HATSU_AURA_COST } from './hatsu'
import { canUseMovesetMove, moveForSlot, movesetFor } from './movesets'
import { fighterDefinition } from './roster'
import { isLsdfMove } from './lsdf'
import { lsdfHint } from './lsdfPresentation'
import type { FightState } from './types'

interface SpecialPresentation {
  label: string
  ready: boolean
  hint: string
}

export function fightSpecialPresentation(
  state: FightState,
  language: 'fr' | 'en',
): SpecialPresentation {
  if (state.player.id === 'basho') return bashoPresentation(state, language)
  if (state.player.id === 'longhi') return moonlightPresentation(state, language)
  if (isErigeronAction(state.player, 'special', `${state.player.id}:neutralSpecial`))
    return erigeronPresentation(language)
  if (state.player.id === 'tserriednich') return futureSpecialPresentation(state, language)
  if (state.player.id === 'camilla') return camillaPresentation(language)
  if (state.player.id === 'kurapika') return kurapikaPresentation(state, language)
  return commonSpecialPresentation(state, language)
}

function commonSpecialPresentation(state: FightState, language: 'fr' | 'en'): SpecialPresentation {
  const move = moveForSlot(state.player.id, 'neutralSpecial')
  const ready = movesetFor(state.player.id)
    ? Boolean(move && canUseMovesetMove(state, 'player', move))
    : canUseFightHatsu(state.player)
  const label = specialLabel(state, language)
  return { label, ready, hint: specialHint({ state, language, ready, label }) }
}

function specialLabel(state: FightState, language: 'fr' | 'en'): string {
  if (isLsdfMove(state.player)) return 'LSDF'
  const move = moveForSlot(state.player.id, 'neutralSpecial')
  if (movesetFor(state.player.id))
    return (language === 'fr' ? move?.nameFr : move?.nameEn) ?? 'Technique'
  const definition = fighterDefinition(state.player.id)
  return language === 'fr' ? definition.specialFr : definition.specialEn
}

function specialHint(options: {
  state: FightState
  language: 'fr' | 'en'
  ready: boolean
  label: string
}): string {
  const { state, language } = options
  if (state.player.id === 'musse' && state.player.secretWindow)
    return language === 'fr'
      ? 'Secret Window · surveillance active'
      : 'Secret Window · monitoring active'
  if (isLsdfMove(state.player)) return lsdfHint(state, 'player', language)
  return ordinarySpecialHint(options)
}

function ordinarySpecialHint(options: {
  state: FightState
  language: 'fr' | 'en'
  ready: boolean
  label: string
}): string {
  const { state, language, ready, label } = options
  const move = moveForSlot(state.player.id, 'neutralSpecial')
  if (!movesetFor(state.player.id)) return `${label} · ${FIGHT_HATSU_AURA_COST} aura`
  if (ready) return `${label} · ${move?.auraCost ?? 40} aura`
  if (move?.id === 'kurapika:neutralSpecial')
    return language === 'fr'
      ? 'Chain Jail · Brigade Fantôme uniquement'
      : 'Chain Jail · Phantom Troupe only'
  return `${label} · indisponible`
}

function kurapikaPresentation(state: FightState, language: 'fr' | 'en'): SpecialPresentation {
  const release = state.opponent.chainJail?.owner === 'player'
  const ready =
    release ||
    Boolean(
      movesetFor('kurapika')?.moves.some(
        (move) => move.category === 'special' && canUseMovesetMove(state, 'player', move),
      ),
    )
  return {
    label: language === 'fr' ? 'Chaînes' : 'Chains',
    ready,
    hint:
      language === 'fr'
        ? 'L : Chain Jail (hors Brigade : mort) · → fouet · ↓ soin · ← Steal Chain / Dolphin'
        : 'L: Chain Jail (non-Troupe: death) · → whip · ↓ heal · ← Steal Chain / Dolphin',
  }
}

function camillaPresentation(language: 'fr' | 'en'): SpecialPresentation {
  return {
    label: 'Cat’s Name · auto',
    ready: false,
    hint:
      language === 'fr'
        ? 'Nen posthume : automatique après sa mort, aucun coup manuel.'
        : 'Post-mortem Nen: automatic after death, no manual attack.',
  }
}
