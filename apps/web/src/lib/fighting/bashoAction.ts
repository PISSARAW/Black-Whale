import { writingMaterialsReady, spendWritingSheet } from './bashoMaterials'
import { witnessedHatsuState } from './nenWitness'
import { chrolloPageForMove, CHROLLO_SECONDARY, CHROLLO_USE } from './chrolloBook'
import {
  BASHO_POEMS,
  BASHO_POEM_MOVE,
  BASHO_WRITING_COST,
  BASHO_WRITING_FRAMES,
  bashoWriting,
  hasBashoPoem,
  recognizedBashoPoem,
  recognizedBashoEffect,
  writingBodyAvailable,
} from './bashoPoem'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightSide, FightState } from './types'

export function performBashoAction(options: AuraAttackOptions): FightState | null {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  if (bashoWriting(fighter)) return state
  if (kind !== 'special') return null
  if (fighter.id !== 'basho' && chrolloPageForMove(fighter, moveId) !== 'basho') return null
  if (fighter.id === 'basho' && moveId && moveId !== BASHO_POEM_MOVE) return state
  return startBashoWriting({ state, side, text: fighter.bashoPoem?.text ?? BASHO_POEMS.fr, moveId })
}

function startBashoWriting(options: {
  state: FightState
  side: FightSide
  text: string
  moveId?: string
}): FightState {
  const { state, side, text, moveId } = options
  const fighter = state[side]
  if (state.phase !== 'fighting' || state.catsName) return state
  if (!recognizedBashoPoem(text) || !hasBashoPoem(fighter, moveId)) return state
  if (
    !writingBodyAvailable(fighter) ||
    !writingMaterialsReady(state, side) ||
    fighter.aura < BASHO_WRITING_COST
  )
    return state
  const other = side === 'player' ? 'opponent' : 'player'
  const paid = spendWritingSheet(state, side)
  return {
    ...paid.state,
    [side]: {
      ...paid.state[side],
      bashoArchive: archivePrevious(fighter),
      aura: fighter.aura - BASHO_WRITING_COST,
      bufferedAttack: null,
      hatsuChargeFrames: 0,
      motion: undefined,
      bashoPoem: {
        text,
        effect: recognizedBashoEffect(text)!,
        paperId: paid.paperId,
        paperCopyId: fighter.writingKit?.copyId,
        sourceMoveId: moveId,
        writingFrames: BASHO_WRITING_FRAMES,
        originX: fighter.x,
        ready: false,
      },
    },
    [other]: {
      ...state[other],
      hatsuEffects: {
        ...state[other].hatsuEffects,
        ...witnessedHatsuState(state, { side, source: 'basho', moveId: BASHO_POEM_MOVE }),
      },
    },
  }
}

/** Use the normal command path, including copied/borrowed ability costs and signed clauses. */
export function composeBashoPoem(
  options: { state: FightState; side: FightSide; text: string },
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, text } = options
  const fighter = state[side]
  if (!recognizedBashoPoem(text) || bashoWriting(fighter)) return state
  const draft = {
    ...state,
    [side]: {
      ...fighter,
      bashoArchive: archivePrevious(fighter),
      bashoPoem: {
        text,
        effect: recognizedBashoEffect(text)!,
        writingFrames: 0,
        originX: fighter.x,
        ready: false,
      },
    },
  }
  const moveId = compositionMove(state, side)
  const next = perform({ state: draft, side, kind: 'special', moveId, auraCharged: false })
  if (next[side].health <= 0 || next.phase !== 'fighting') return next
  if (next[side].moonlightZetsu && !fighter.moonlightZetsu) return next
  return bashoWriting(next[side]) ? next : state
}

function compositionMove(state: FightState, side: FightSide): string {
  const fighter = state[side]
  if (fighter.id === 'chrollo')
    return fighter.chrolloBook?.open && chrolloPageForMove(fighter) === 'basho'
      ? CHROLLO_USE
      : CHROLLO_SECONDARY
  return fighter.kurapika?.held?.source === 'basho' ? 'kurapika:backSpecial' : BASHO_POEM_MOVE
}

function archivePrevious(fighter: FightState['player']) {
  const previous = fighter.bashoPoem
  return previous?.ready ? [...(fighter.bashoArchive ?? []), previous] : fighter.bashoArchive
}
