import { FIGHT_FPS } from './fightClock'
import type { ArcadeFighter, FightState } from './types'

export type BashoHaikuTheme = 'fire' | 'shield' | 'wind'
export type BashoHaikuQuality = 'mediocre' | 'masterpiece'

export const BASHO_WRITING_FRAMES = 35
export const BASHO_BEATS = [10, 22, 32] as const // 5 - 7 - 5 rhythm targets
export const BASHO_BEAT_TOLERANCE = 3
export const BASHO_BURN_HP_DPS = 4
export const BASHO_BURN_AURA_DPS = 3

export interface BashoRhythmSession {
  theme: BashoHaikuTheme
  frame: number
  hits: number
  lastMatchedBeat: number
}

export interface BashoHaikuBuff {
  theme: BashoHaikuTheme
  quality: BashoHaikuQuality
  /** Fire: remaining empowered hits (1 mediocre, 3 masterpiece). */
  fireCharges?: number
  /** Shield: Ken cost multiplier (0.5 mediocre, 0 masterpiece) + repel on impact. */
  kenCostFactor?: number
  kenRepel?: boolean
  /** Wind: extra Heavy reach, or super-armor (1 hit) + ignores Ten guard. */
  windReachBonus?: number
  superArmorHits?: number
  ignoresTenGuard?: boolean
}

declare module './types' {
  interface ArcadeFighter {
    bashoRhythm?: BashoRhythmSession
    bashoHaikuBuff?: BashoHaikuBuff
    haikuBurn?: boolean
  }
}

export function startBashoHaiku(fighter: ArcadeFighter, theme: BashoHaikuTheme): ArcadeFighter {
  return {
    ...fighter,
    bashoRhythm: { theme, frame: 0, hits: 0, lastMatchedBeat: -1 },
  }
}

/** Registers a rhythm tap during the 5-7-5 writing posture. */
export function tapBashoBeat(fighter: ArcadeFighter): ArcadeFighter {
  const session = fighter.bashoRhythm
  if (!session) return fighter
  const beatIndex = BASHO_BEATS.findIndex(
    (target, idx) =>
      idx > session.lastMatchedBeat && Math.abs(session.frame - target) <= BASHO_BEAT_TOLERANCE,
  )
  if (beatIndex === -1) return fighter
  return {
    ...fighter,
    bashoRhythm: { ...session, hits: session.hits + 1, lastMatchedBeat: beatIndex },
  }
}

function buildHaikuBuff(theme: BashoHaikuTheme, quality: BashoHaikuQuality): BashoHaikuBuff {
  if (theme === 'fire') {
    return { theme, quality, fireCharges: quality === 'masterpiece' ? 3 : 1 }
  }
  if (theme === 'shield') {
    return {
      theme,
      quality,
      kenCostFactor: quality === 'masterpiece' ? 0 : 0.5,
      kenRepel: quality === 'masterpiece',
    }
  }
  return {
    theme,
    quality,
    windReachBonus: quality === 'mediocre' ? 1.5 : 2.5,
    superArmorHits: quality === 'masterpiece' ? 1 : 0,
    ignoresTenGuard: quality === 'masterpiece',
  }
}

export function resolveBashoHaiku(fighter: ArcadeFighter): ArcadeFighter {
  const session = fighter.bashoRhythm
  if (!session) return fighter
  const quality: BashoHaikuQuality = session.hits >= BASHO_BEATS.length ? 'masterpiece' : 'mediocre'
  return {
    ...fighter,
    bashoRhythm: undefined,
    bashoHaikuBuff: buildHaikuBuff(session.theme, quality),
  }
}

export function bashoFireAttackFactor(fighter: ArcadeFighter): number {
  const buff = fighter.bashoHaikuBuff
  if (!buff || buff.theme !== 'fire' || !buff.fireCharges) return 1
  return buff.quality === 'masterpiece' ? 1.45 : 1.12
}

export function bashoKenCostFactor(fighter: ArcadeFighter): number {
  const buff = fighter.bashoHaikuBuff
  if (!buff || buff.theme !== 'shield') return 1
  return buff.kenCostFactor ?? 1
}

export function bashoIgnoresTenGuard(attacker: ArcadeFighter, defender: ArcadeFighter): boolean {
  const buff = attacker.bashoHaikuBuff
  return Boolean(
    buff?.theme === 'wind' &&
      buff.ignoresTenGuard &&
      attacker.attack?.kind === 'heavy' &&
      !defender.nen.ken &&
      !defender.nen.ko,
  )
}

/** Advances Basho's 5-7-5 writing clock and ticks persistent Masterpiece Fire burn until extinguished. */
export function advanceBashoHaiku(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    let f = next[side]
    if (f.bashoRhythm) {
      const frame = f.bashoRhythm.frame + 1
      f =
        frame >= BASHO_WRITING_FRAMES
          ? resolveBashoHaiku({ ...f, bashoRhythm: { ...f.bashoRhythm, frame } })
          : { ...f, bashoRhythm: { ...f.bashoRhythm, frame } }
    }
    if (f.haikuBurn && f.health > 0) {
      const catalyst = (f.erigeronCatalystFrames ?? 0) > 0 ? 2 : 1
      f = {
        ...f,
        health: Math.max(1, f.health - (BASHO_BURN_HP_DPS * catalyst) / FIGHT_FPS),
        aura: Math.max(0, f.aura - (BASHO_BURN_AURA_DPS * catalyst) / FIGHT_FPS),
      }
    }
    if (f !== next[side]) next = { ...next, [side]: f }
  }
  return next
}

export function extinguishBashoBurn(fighter: ArcadeFighter): ArcadeFighter {
  return fighter.haikuBurn ? { ...fighter, haikuBurn: undefined } : fighter
}
