import { revealBookSlot, type BookSlot } from './chrolloDeck'
import type { ArcadeFighter, FightInput, FightSide, FightState } from './types'

export const ERIGERON_SURGE_FRAMES = 360
export const ERIGERON_CATALYST_FRAMES = 360
export const ERIGERON_KAMEO_FACTOR = 0.5
export const ERIGERON_BODY_MEMORY_DRAIN = 5
export const LYNCH_CONFESSION_FRAMES = 360
export const MIZAISTOM_YELLOW_FRAMES = 180
export const MIZAISTOM_RED_STASIS_FRAMES = 90
export const GEL_VENOM_FRAMES = 300
export const GEL_VENOM_TRANSFER_PENALTY = 2
export const GEL_CONSTRICTION_DRAIN = 15

export interface CrossGameCardState {
  issuer: FightSide
  target: FightSide
  phase: 'yellow' | 'red'
  remainingFrames: number
}

declare module './types' {
  interface ArcadeFighter {
    erigeronSurgeFrames?: number
    erigeronCatalystFrames?: number
    soulConfessionFrames?: number
    gelVenomFrames?: number
    crossGameStasis?: boolean
  }
  interface FightState {
    crossGameCard?: CrossGameCardState
  }
}

/** Bill 5S: doubles Ten regen, halves Kameo cooldown, and doubles forced Zetsu recovery. */
export function activateErigeronSurge(fighter: ArcadeFighter): ArcadeFighter {
  return { ...fighter, erigeronSurgeFrames: ERIGERON_SURGE_FRAMES }
}

/** Bill 6S: accelerates poison/burn ticks (x2) and raises Body Memory Ryu drain to +5/s. */
export function applyErigeronCatalyst(target: ArcadeFighter): ArcadeFighter {
  return { ...target, erigeronCatalystFrames: ERIGERON_CATALYST_FRAMES }
}

/** Lynch 5S/6S: strips In & Texture Surprise, reveals Chrollo's deck, and applies 6s Soul Confession. */
export function applyBodyAndSoulTruth(state: FightState, attackerSide: FightSide): FightState {
  const targetSide: FightSide = attackerSide === 'player' ? 'opponent' : 'player'
  const target = state[targetSide]
  let book = target.chrolloBook
  if (book) {
    for (const slot of [0, 1, 2, 3, 'stolen'] as BookSlot[]) {
      if (slot !== 'stolen' || book.stolenPage) book = revealBookSlot(book, slot)
    }
  }
  return {
    ...state,
    [targetSide]: {
      ...target,
      nen: { ...target.nen, in: false },
      textureSurprise: undefined,
      chrolloBook: book,
      soulConfessionFrames: LYNCH_CONFESSION_FRAMES,
    },
  }
}

/** During Soul Confession, Lynch sees the opponent's next Ko/Ryu/Hatsu intent 3 frames early. */
export function lynchConfessionIntent(state: FightState, lynchSide: FightSide): string | null {
  const target = state[lynchSide === 'player' ? 'opponent' : 'player']
  if (!(target.soulConfessionFrames ?? 0)) return null
  if (target.attack?.auraCharged || target.nen.ko) return 'ko'
  if (target.attack?.hatsuSource) return 'hatsu'
  if (Object.values(target.nen.ryu).some((v) => Number(v) > 0)) return 'ryu'
  return null
}

/** Mizaistom 5S: imposes a 3s Yellow Card (no advancing or attacking). */
export function issueCrossGameYellow(state: FightState, side: FightSide): FightState {
  const target: FightSide = side === 'player' ? 'opponent' : 'player'
  return {
    ...state,
    crossGameCard: {
      issuer: side,
      target,
      phase: 'yellow',
      remainingFrames: MIZAISTOM_YELLOW_FRAMES,
    },
  }
}

function advancing(fighter: ArcadeFighter, input?: FightInput): boolean {
  if (!input) return false
  return fighter.facing === 1 ? input.right && !input.left : input.left && !input.right
}

function stepCrossGameCard(
  state: FightState,
  inputs: { player: FightInput; opponent?: FightInput },
): FightState {
  const card = state.crossGameCard
  if (!card) return state
  const target = state[card.target]
  if (card.phase === 'yellow') {
    const disobeyed = Boolean(target.attack) || advancing(target, inputs[card.target])
    if (disobeyed) {
      return {
        ...state,
        crossGameCard: { ...card, phase: 'red', remainingFrames: MIZAISTOM_RED_STASIS_FRAMES },
        [card.target]: {
          ...target,
          crossGameStasis: true,
          hitStun: Math.max(target.hitStun, MIZAISTOM_RED_STASIS_FRAMES),
          attack: null,
          bufferedAttack: null,
        },
      }
    }
  }
  const remaining = card.remainingFrames - 1
  if (remaining > 0) return { ...state, crossGameCard: { ...card, remainingFrames: remaining } }
  return {
    ...state,
    crossGameCard: undefined,
    [card.target]: { ...target, crossGameStasis: undefined },
  }
}

/** Gel 6S/Heavy: neurotoxic venom adds +2f to opponent's nenTransferFrames for 5s. */
export function applyGelVenom(target: ArcadeFighter): ArcadeFighter {
  return { ...target, gelVenomFrames: GEL_VENOM_FRAMES }
}

/** Gel 2S / Constriction: drains 15 aura from opponent to feed Gel. */
export function applyGelConstriction(state: FightState, gelSide: FightSide): FightState {
  const targetSide: FightSide = gelSide === 'player' ? 'opponent' : 'player'
  const gel = state[gelSide]
  const target = state[targetSide]
  const drained = Math.min(target.aura, GEL_CONSTRICTION_DRAIN)
  return {
    ...state,
    [gelSide]: { ...gel, aura: Math.min(100, gel.aura + drained) },
    [targetSide]: { ...target, aura: Math.max(0, target.aura - drained) },
  }
}

export function advanceZodiacAndHeirUpgrades(
  state: FightState,
  inputs: { player: FightInput; opponent?: FightInput },
): FightState {
  if (state.phase !== 'fighting') return state
  let next = stepCrossGameCard(state, inputs)
  for (const side of ['player', 'opponent'] as const) {
    const f = next[side]
    const erigeronSurgeFrames = Math.max(0, (f.erigeronSurgeFrames ?? 0) - 1) || undefined
    const erigeronCatalystFrames = Math.max(0, (f.erigeronCatalystFrames ?? 0) - 1) || undefined
    const soulConfessionFrames = Math.max(0, (f.soulConfessionFrames ?? 0) - 1) || undefined
    const gelVenomFrames = Math.max(0, (f.gelVenomFrames ?? 0) - 1) || undefined
    if (
      erigeronSurgeFrames !== f.erigeronSurgeFrames ||
      erigeronCatalystFrames !== f.erigeronCatalystFrames ||
      soulConfessionFrames !== f.soulConfessionFrames ||
      gelVenomFrames !== f.gelVenomFrames
    ) {
      next = {
        ...next,
        [side]: {
          ...f,
          erigeronSurgeFrames,
          erigeronCatalystFrames,
          soulConfessionFrames,
          gelVenomFrames,
        },
      }
    }
  }
  return next
}
