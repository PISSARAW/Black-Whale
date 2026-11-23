import { activeEnRadius } from './en/access'
import type { ArcadeFighter, AttackKind, FightNenZone, FightSide, FightState } from './types'

export const HINRIGH_CUFF_BREAK_STUN = 16
export const ZAKURO_BLEED_REACH_FACTOR = 1.3
export const ZAKURO_BLEED_HP_DPS = 1.5
export const ZAKURO_BLOOD_DROP_RADIUS = 9
export const ZAKURO_REVEAL_FRAMES = 120

export interface ZakuroBloodDrops {
  owner: FightSide
  x: number
  radius: number
}

export interface LuiniExitPortal {
  owner: FightSide
  x: number
  y: number
  concealedIn: boolean
}

export interface HinrighBioPigeon {
  owner: FightSide
  x: number
  active: boolean
}

declare module './types' {
  interface ArcadeFighter {
    hinrighCuffed?: boolean
    zakuroRevealedFrames?: number
  }
  interface FightInput {
    breakCuffs?: boolean
  }
  interface FightState {
    hinrighBioPigeon?: HinrighBioPigeon
    zakuroBloodDrops?: ZakuroBloodDrops
    luiniPortal?: LuiniExitPortal
  }
}

/** Hinrigh 6S: handcuffs lock hands Ko, Throw, and hand strikes until broken via Contexte. */
export function applyHinrighHandcuffs(target: ArcadeFighter): ArcadeFighter {
  return { ...target, hinrighCuffed: true }
}

export function hinrighBlocksHandAction(
  fighter: ArcadeFighter,
  kind: AttackKind | 'throw',
  zone?: FightNenZone,
): boolean {
  if (!fighter.hinrighCuffed && !fighter.biohazardRestraint) return false
  if (kind === 'throw') return true
  return zone === 'hands'
}

/** Padaille drills free instantly (0 stun); everyone else pays a 16-frame opening via Contexte. */
export function breakHinrighHandcuffs(fighter: ArcadeFighter): ArcadeFighter {
  if (!fighter.hinrighCuffed && !fighter.biohazardRestraint) return fighter
  const isPadaille = (fighter.nenOwner ?? fighter.id) === 'padaille'
  return {
    ...fighter,
    hinrighCuffed: undefined,
    biohazardRestraint: undefined,
    hitStun: isPadaille ? fighter.hitStun : Math.max(fighter.hitStun, HINRIGH_CUFF_BREAK_STUN),
  }
}

/** Hinrigh real-object Biohazard pigeon persists even in Zetsu (but Blinky can swallow it). */
export function deployHinrighBioPigeon(state: FightState, side: FightSide): FightState {
  const hinrigh = state[side]
  return {
    ...state,
    hinrighBioPigeon: { owner: side, x: hinrigh.x + hinrigh.facing * 8, active: true },
  }
}

/** Zakuro gains +30% reach while deliberately keeping a wound open. */
export function zakuroBloodReachFactor(fighter: ArcadeFighter): number {
  if ((fighter.nenOwner ?? fighter.id) !== 'zakuro') return 1
  return (fighter.openWounds ?? 0) > 0 ? ZAKURO_BLEED_REACH_FACTOR : 1
}

/** Zakuro 4S: places physical blood drops; they do not reveal hidden aura. */
export function placeZakuroBloodDrops(state: FightState, side: FightSide): FightState {
  const zakuro = state[side]
  const x = Math.max(10, Math.min(90, zakuro.x + zakuro.facing * 8))
  return { ...state, zakuroBloodDrops: { owner: side, x, radius: ZAKURO_BLOOD_DROP_RADIUS } }
}

/** Luini 4S/2S: places an exit portal, concealed under In unless opponent uses full Gyo or En. */
export function placeLuiniExitPortal(
  state: FightState,
  side: FightSide,
  position: { x: number; y: number },
): FightState {
  const luini = state[side]
  return {
    ...state,
    luiniPortal: { owner: side, x: position.x, y: position.y, concealedIn: Boolean(luini.nen.in) },
  }
}

export function luiniPortalVisibleTo(state: FightState, observer: FightSide): boolean {
  const portal = state.luiniPortal
  if (!portal) return false
  if (observer === portal.owner || !portal.concealedIn) return true
  const viewer = state[observer]
  if (viewer.nen.gyo && !viewer.gyoLow) return true
  const en = activeEnRadius(viewer)
  return Boolean(en && Math.hypot(viewer.x - portal.x, viewer.y - portal.y) <= en)
}

function stepZakuroBlood(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const f = next[side]
    if (f.zakuroRevealedFrames) {
      const rem = Math.max(0, f.zakuroRevealedFrames - 1) || undefined
      next = { ...next, [side]: { ...next[side], zakuroRevealedFrames: rem } }
    }
  }
  return next
}

export function advanceHinrighZakuroLuiniUpgrades(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  let next = stepZakuroBlood(state)
  const portal = next.luiniPortal
  if (portal) {
    const foeSide: FightSide = portal.owner === 'player' ? 'opponent' : 'player'
    const foe = next[foeSide]
    const en = activeEnRadius(foe)
    if (en && Math.hypot(foe.x - portal.x, foe.y - portal.y) <= en) {
      next = {
        ...next,
        luiniPortal: { ...portal, concealedIn: false },
        [foeSide]: { ...foe, enReflexActive: true },
      }
    }
  }
  return next
}
