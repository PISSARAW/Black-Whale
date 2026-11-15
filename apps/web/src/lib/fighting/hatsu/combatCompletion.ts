import type { ArcadeFighter, FightState } from '../types'
import { unchangedFrame, unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

export const gidalHatsu: FighterHatsu = {
  id: 'gidal',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) =>
    blocked ? state : setEffect(state, defenderSide, { key: 'gidalCurseFrames', value: 240 }),
  onFrame: (state) => tickState(state, 'gidalCurseFrames'),
}

export const longhiHatsu: FighterHatsu = {
  id: 'longhi',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) =>
    blocked ? state : setEffect(state, defenderSide, { key: 'contractFrames', value: 120 }),
  onFrame: (state) => tickState(state, 'contractFrames', true),
}

export const musseHatsu: FighterHatsu = dodgeHatsu('musse', 'secretWindowDodges')

export const padailleHatsu: FighterHatsu = {
  id: 'padaille',
  onTrigger: ({ state, side }) => setEffect(state, side, { key: 'weaponFrames', value: 180 }),
  onImpact: unchangedImpact,
  onFrame: (state) => tickState(state, 'weaponFrames'),
}

export const tubeppaHatsu: FighterHatsu = {
  id: 'tubeppa',
  onTrigger: ({ state, side }) => {
    const fighter = state[side]
    const boosted = setEffect(state, side, { key: 'synthesisFrames', value: 240 })
    return { ...boosted, [side]: { ...boosted[side], health: Math.min(100, fighter.health + 8) } }
  },
  onImpact: unchangedImpact,
  onFrame: (state) => tickState(state, 'synthesisFrames'),
}

export const tysonHatsu: FighterHatsu = {
  id: 'tyson',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide }) =>
    setEffect(state, defenderSide, { key: 'eyeWogFrames', value: 180 }),
  onFrame: (state) => {
    const next = tickState(state, 'eyeWogFrames')
    return {
      ...next,
      player: drainAura(next.player, state.player.hatsuEffects.eyeWogFrames),
      opponent: drainAura(next.opponent, state.opponent.hatsuEffects.eyeWogFrames),
    }
  },
}

export const sayirdHatsu: FighterHatsu = dodgeHatsu('sayird', 'littleEyeDodges')

export const silentMajorityHatsu: FighterHatsu = {
  id: 'silentmajority',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => {
    if (blocked) return state
    const fighter = state[defenderSide]
    const marks = fighter.hatsuEffects.silentMarks + 1
    const strikes = marks >= 3
    return {
      ...state,
      [defenderSide]: {
        ...fighter,
        health: Math.max(0, fighter.health - (strikes ? 22 : 0)),
        hatsuEffects: { ...fighter.hatsuEffects, silentMarks: strikes ? 0 : marks },
      },
    }
  },
  onFrame: unchangedFrame,
}

export const terebellumHatsu: FighterHatsu = dodgeHatsu('terebellum', 'sweetHomeCharges')
export const voconteHatsu: FighterHatsu = dodgeHatsu('voconte', 'doorDodges')
export const yokotaniHatsu: FighterHatsu = dodgeHatsu('yokotani', 'lsdfGuards')

type TimedKey =
  'gidalCurseFrames' | 'contractFrames' | 'weaponFrames' | 'synthesisFrames' | 'eyeWogFrames'
type DodgeKey =
  'secretWindowDodges' | 'littleEyeDodges' | 'sweetHomeCharges' | 'doorDodges' | 'lsdfGuards'

function setEffect(
  state: FightState,
  side: 'player' | 'opponent',
  effect: { key: TimedKey; value: number },
) {
  const fighter = state[side]
  return {
    ...state,
    [side]: {
      ...fighter,
      hatsuEffects: { ...fighter.hatsuEffects, [effect.key]: effect.value },
    },
  }
}

function tickState(state: FightState, key: TimedKey, lock = false): FightState {
  return {
    ...state,
    player: tickFighter(state.player, key, lock),
    opponent: tickFighter(state.opponent, key, lock),
  }
}

function tickFighter(fighter: ArcadeFighter, key: TimedKey, lock: boolean): ArcadeFighter {
  const frames = fighter.hatsuEffects[key]
  if (frames <= 0) return fighter
  return {
    ...fighter,
    hitStun: lock ? Math.max(fighter.hitStun, 2) : fighter.hitStun,
    hatsuEffects: { ...fighter.hatsuEffects, [key]: frames - 1 },
  }
}

function dodgeHatsu(id: FighterHatsu['id'], key: DodgeKey): FighterHatsu {
  return {
    id,
    onTrigger: ({ state, side }) => {
      const fighter = state[side]
      return {
        ...state,
        [side]: { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, [key]: 1 } },
      }
    },
    onImpact: unchangedImpact,
    onFrame: unchangedFrame,
  }
}

function drainAura(fighter: ArcadeFighter, frames: number): ArcadeFighter {
  if (frames <= 0 || frames % 30 !== 0) return fighter
  return { ...fighter, aura: Math.max(0, fighter.aura - 2) }
}
