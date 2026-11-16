import type { ArcadeFighter, FightState } from '../types'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

export const gidalHatsu: FighterHatsu = {
  id: 'gidal',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) =>
    blocked ? state : setEffect(state, defenderSide, { key: 'gidalCurseFrames', value: 240 }),
  onFrame: (state) => tickState(state, 'gidalCurseFrames'),
}

export { longhiHatsu } from './longhi'

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

export { voconteHatsu } from './voconte'

type TimedKey =
  'gidalCurseFrames' | 'weaponFrames' | 'synthesisFrames' | 'eyeWogFrames'

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

function tickState(state: FightState, key: TimedKey): FightState {
  return {
    ...state,
    player: tickFighter(state.player, key),
    opponent: tickFighter(state.opponent, key),
  }
}

function tickFighter(fighter: ArcadeFighter, key: TimedKey): ArcadeFighter {
  const frames = fighter.hatsuEffects[key]
  if (frames <= 0) return fighter
  return {
    ...fighter,
    hatsuEffects: { ...fighter.hatsuEffects, [key]: frames - 1 },
  }
}

function drainAura(fighter: ArcadeFighter, frames: number): ArcadeFighter {
  if (frames <= 0 || frames % 30 !== 0) return fighter
  return { ...fighter, aura: Math.max(0, fighter.aura - 2) }
}
