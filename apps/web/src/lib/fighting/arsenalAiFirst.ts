import { benjaminAiSlots } from './benjaminAi'
import { biohazardAiSlots } from './biohazardAi'
import { chrolloAiSlots } from './chrolloAi'
import { illumiAiSlots } from './illumiAi'
import { hasPlantedPaper, paperState } from './kallutoPaper'
import { currentPaperDoll } from './kallutoSurveillance'
import { BUNGEE_REST_DISTANCE } from './hisokaTechnique'
import { SENSE_BITS } from './saiyuSenses'
import { battleAppearance } from './battleCantabileRules'
import { blinkyBloodReady, blinkyState } from './blinky'
import { machiThreadForOwner } from './machiThread'
import {
  martialSlots,
  varySlots,
  type ArsenalAiContext,
  type ArsenalAiPlan,
} from './arsenalAiTypes'
import type { FightState, MoveSlot } from './types'

export const FIRST_ARSENAL_AI = {
  kurapika: kurapikaSlots,
  hisoka: hisokaSlots,
  chrollo: ({ state, roll, gap }) => chrolloAiSlots(state, roll, gap),
  benjamin: ({ state, roll, gap }) => benjaminAiSlots(state, roll, gap),
  tserriednich: martialSlots,
  feitan: ({ state, gap }) =>
    state.opponent.hatsuEffects.painPacker?.armour
      ? ['finisher', 'standingLight']
      : gap > 10
        ? ['neutralSpecial', 'forwardHeavy']
        : ['standingLight', 'forwardSpecial', 'neutralSpecial'],
  saiyu: saiyuSlots,
  theta: ({ roll }) =>
    varySlots(roll, ['neutralSpecial', 'forwardSpecial', 'downSpecial', 'backSpecial']),
  biscuit: ({ state, roll }) =>
    !state.opponent.biscuitTrueForm
      ? ['neutralSpecial']
      : varySlots(roll, ['forwardSpecial', 'downSpecial', 'backSpecial', 'finisher']),
  phinks: martialSlots, // The real winding/release action runs before attack selection.
  franklin: ({ roll }) =>
    varySlots(roll, ['neutralSpecial', 'forwardSpecial', 'downSpecial', 'backSpecial', 'finisher']),
  machi: machiSlots,
  illumi: ({ state, gap }) => illumiAiSlots(state, gap),
  kalluto: kallutoSlots,
  bonolenov: bonolenovSlots,
  shizuku: shizukuSlots,
  hinrigh: ({ state, roll, gap }) => biohazardAiSlots(state, roll, gap),
  mizaistom: () => ['neutralSpecial'],
  leorio: () => ['neutralSpecial'],
  hanzo: ({ state, gap }) =>
    state.opponent.hanzoProjection
      ? ['finisher', 'standingHeavy', 'standingLight']
      : gap > 12
        ? ['neutralSpecial']
        : ['standingLight', 'forwardHeavy'],
} satisfies Record<string, ArsenalAiPlan>

function kurapikaSlots({
  state,
  roll,
  gap,
}: ArsenalAiContext): readonly import('./types').MoveSlot[] {
  const utility = kurapikaUtility(state, gap)
  if (utility) return utility
  return roll < 0.5
    ? ['neutralSpecial', 'backSpecial', 'forwardSpecial']
    : ['backSpecial', 'forwardSpecial', 'neutralSpecial']
}

function kurapikaUtility(state: FightState, gap: number): readonly MoveSlot[] | null {
  const fighter = state.opponent
  const target = state.player
  if (fighter.maxHealth - fighter.health >= 25 && gap > 12) return ['downSpecial']
  const held = fighter.kurapika?.held
  if (held && !held.used) return ['backSpecial']
  if (target.chainJail?.owner === 'opponent') return ['finisher', 'forwardSpecial']
  return kurapikaTargetSlots(state, gap)
}

function kurapikaTargetSlots(state: FightState, gap: number): readonly MoveSlot[] | null {
  if (state.opponent.kurapika?.emperorTime && !state.player.judgmentChain && gap <= 7)
    return ['finisher']
  return state.player.drainingChain?.owner === 'opponent'
    ? ['forwardSpecial', 'standingLight']
    : null
}

function hisokaSlots({
  state,
  roll,
  gap,
}: ArsenalAiContext): readonly import('./types').MoveSlot[] {
  const gum = state.bungeeGum
  if (textureOpening({ state, roll, gap })) return ['downSpecial']
  if (gum?.owner !== 'opponent') return ['neutralSpecial']
  if (!gum.retracting && gap > BUNGEE_REST_DISTANCE)
    return [roll < 0.5 ? 'forwardSpecial' : 'backSpecial', 'finisher']
  if (gap <= 10) return ['finisher', 'standingHeavy']
  return !state.opponent.textureSurprise && roll > 0.8 ? ['downSpecial'] : []
}

function saiyuSlots({ state, roll }: ArsenalAiContext): readonly import('./types').MoveSlot[] {
  const seals = state.player.hatsuEffects.senseSeals
  const missing: import('./types').MoveSlot[] = []
  if (!(seals & SENSE_BITS.sight)) missing.push('neutralSpecial')
  if (!(seals & SENSE_BITS.hearing)) missing.push('forwardSpecial')
  if (!(seals & SENSE_BITS.speech)) missing.push('downSpecial')
  if (missing.length) {
    const start = Math.min(missing.length - 1, Math.floor(roll * missing.length))
    return [...missing.slice(start), ...missing.slice(0, start)]
  }
  return ['finisher', 'backSpecial']
}

function machiSlots({ state, gap }: ArsenalAiContext): readonly import('./types').MoveSlot[] {
  if (state.opponent.maxHealth - state.opponent.health >= 24 && gap > 12) return ['neutralSpecial']
  const thread = machiThreadForOwner(state, 'opponent')
  if (thread?.kind === 'bind') return ['finisher']
  return thread ? ['downSpecial', 'standingLight'] : ['forwardSpecial', 'downSpecial']
}

function kallutoSlots({ state, roll }: ArsenalAiContext): readonly import('./types').MoveSlot[] {
  const paper = paperState(state.opponent)
  if (!hasPlantedPaper(state, 'opponent', paper.zone))
    return [roll < 0.5 ? 'neutralSpecial' : 'downSpecial']
  return !currentPaperDoll(state, 'opponent') ? ['backSpecial'] : ['forwardSpecial', 'finisher']
}

function bonolenovSlots({
  state,
  roll,
  gap,
}: ArsenalAiContext): readonly import('./types').MoveSlot[] {
  const battle = state.opponent.battleCantabile
  if (battle?.preparation) return []
  if (roll > 0.8 && canImitateModel(state)) return ['downSpecial']
  if (gap > 12) return ['finisher', 'neutralSpecial']
  return battle?.prologue ? ['forwardSpecial'] : ['neutralSpecial']
}

function canImitateModel(state: FightState): boolean {
  const battle = state.opponent.battleCantabile
  if (!battle || battle.form) return false
  const model = battle.models[battleAppearance(state.player)]
  return Boolean(model?.spoken && model.frames > 0)
}

function shizukuSlots({ state }: ArsenalAiContext): readonly import('./types').MoveSlot[] {
  if (blinkyBloodReady(state, 'opponent')) return ['finisher']
  const stored = blinkyState(state.opponent)
  return stored.lastObject || stored.lastArenaObject || stored.lastWasBlood
    ? ['backSpecial', 'forwardSpecial']
    : ['forwardSpecial', 'standingLight']
}

function textureOpening({ state, roll, gap }: ArsenalAiContext): boolean {
  return (
    !state.opponent.textureSurprise &&
    roll > 0.85 &&
    gap > 10 &&
    state.bungeeGum?.owner !== 'opponent'
  )
}
