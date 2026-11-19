import { padaillePresentation } from './padaillePresentation'
import { voconteSpecialPresentation } from './vocontePresentation'
import { beyondPhysicalPresentation } from './beyondPresentation'
import { BEYOND_CURSE } from './beyondCurse'
import { illumiSpecialPresentation } from './illumiPresentation'
import { lynchSpecialPresentation } from './lynchPresentation'
import { crossGamePresentation } from './crossGamePresentation'
import { preparedSpecialPresentation } from './preparationPresentation'
import { chrolloPageForMove } from './chrolloBook'
import { chrolloPageName } from './chrolloPageNames'
import { predatorSpecialPresentation } from './predatorPresentation'
import { melodyCanPerform } from './melodyRules'
import { bashoPresentation } from './bashoPresentation'
import { cyclotronPresentation } from './phinksPresentation'
import { moonlightPresentation } from './moonlightPresentation'
import { erigeronPresentation, isErigeronAction } from './billSupport'
import { futureSpecialPresentation } from './parallelFuturePresentation'
import { canUseFightHatsu, FIGHT_HATSU_AURA_COST } from './hatsu'
import { canUseMovesetMove, moveForSlot, movesetFor } from './movesets'
import { fighterDefinition } from './roster'
import { isLsdfMove } from './lsdf'
import { lsdfHint } from './lsdfPresentation'
import type { FightState } from './types'
import { biohazardPresentation } from './biohazardPresentation'

interface SpecialPresentation {
  label: string
  ready: boolean
  hint: string
}

export function fightSpecialPresentation(
  state: FightState,
  language: 'fr' | 'en',
): SpecialPresentation {
  if (state.player.id === 'hinrigh') return biohazardPresentation(state, language)
  const prepared = preparedSpecialPresentation(state, language)
  if (prepared) return prepared
  const personal = PERSONAL_PRESENTATIONS[state.player.id]
  if (personal) return personal(state, language)
  if (isErigeronAction(state.player, 'special', `${state.player.id}:neutralSpecial`))
    return erigeronPresentation(language)
  return commonSpecialPresentation(state, language)
}

const PERSONAL_PRESENTATIONS: Partial<
  Record<
    import('./types').FighterId,
    (state: FightState, language: 'fr' | 'en') => SpecialPresentation
  >
> = {
  beyond: beyondPhysicalPresentation,
  padaille: padaillePresentation,
  voconte: voconteSpecialPresentation,
  illumi: illumiSpecialPresentation,
  lynch: lynchSpecialPresentation,
  hinrigh: biohazardPresentation,
  phinks: cyclotronPresentation,
  mizaistom: crossGamePresentation,
  melody: melodyPresentation,
  rihan: predatorSpecialPresentation,
  basho: bashoPresentation,
  longhi: moonlightPresentation,
  camilla: (_state, language) => camillaPresentation(language),
  tserriednich: futureSpecialPresentation,
  kurapika: kurapikaPresentation,
}

function commonSpecialPresentation(state: FightState, language: 'fr' | 'en'): SpecialPresentation {
  if (state.player.id === 'mizaistom') return crossGamePresentation(state, language)
  const move = moveForSlot(state.player.id, 'neutralSpecial')
  const ready = movesetFor(state.player.id)
    ? Boolean(move && canUseMovesetMove(state, 'player', move))
    : canUseFightHatsu(state.player)
  const label = specialLabel(state, language)
  return { label, ready, hint: specialHint({ state, language, ready, label }) }
}

function specialLabel(state: FightState, language: 'fr' | 'en'): string {
  if (state.player.id === 'chrollo')
    return chrolloPageName(chrolloPageForMove(state.player), language)
  if (isLsdfMove(state.player)) return 'LSDF'
  if (state.player.hanzoProjection) return language === 'fr' ? 'Réintégrer le corps' : 'Rejoin body'
  return ordinarySpecialLabel(state, language)
}

function ordinarySpecialLabel(state: FightState, language: 'fr' | 'en'): string {
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
  if (chrolloPageForMove(state.player) === 'beyond')
    return language === 'fr' ? BEYOND_CURSE.reasonFr : BEYOND_CURSE.reasonEn
  if (state.player.id === 'musse' && state.player.secretWindow)
    return language === 'fr'
      ? 'Secret Window · surveillance active'
      : 'Secret Window · monitoring active'
  if (isLsdfMove(state.player)) return lsdfHint(state, 'player', language)
  if (state.player.hanzoProjection) return projectionHint(options.ready, language)
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

function projectionHint(ready: boolean, language: 'fr' | 'en'): string {
  if (ready) return language === 'fr' ? 'Réintégrer le corps · 0 aura' : 'Rejoin body · 0 aura'
  return language === 'fr'
    ? 'Revenir près du corps pour le réintégrer'
    : 'Return close to the body to rejoin it'
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

function melodyPresentation(state: FightState, language: 'fr' | 'en'): SpecialPresentation {
  return {
    label: state.player.melodyPerformance
      ? language === 'fr'
        ? 'Arrêter la flûte'
        : 'Stop the flute'
      : language === 'fr'
        ? 'Jouer de la flûte'
        : 'Play the flute',
    ready:
      Boolean(state.player.melodyPerformance) ||
      (melodyCanPerform(state.player) && state.player.aura >= 8),
    hint:
      language === 'fr'
        ? 'L : jouer / arrêter · 8 aura puis 6/s · E : couvrir les oreilles'
        : 'L: play / stop · 8 aura then 6/s · E: cover ears',
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
