import { advanceUmbrellaFeints } from '../feitanUmbrella'
import { attackData } from '../frameData'
import { feitanMoveAvailable, feitanNenActive, painPackerAction } from '../feitanPain'
import { createRisingSun, resolveSolarHeat } from '../feitanSun'
import type { ArcadeFighter, FightState } from '../types'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

export const feitanHatsu: FighterHatsu = {
  id: 'feitan',
  sourceFor: (fighter, moveId) => (painPackerAction(fighter, moveId) ? 'feitan' : null),
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: advancePainPacker,
}

function advancePainPacker(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  state = advanceUmbrellaFeints(state)
  return resolveSolarHeat({
    ...state,
    player: advanceFighter(state.player),
    opponent: advanceFighter(state.opponent),
  })
}

function advanceFighter(fighter: ArcadeFighter): ArcadeFighter {
  const pain = fighter.hatsuEffects.painPacker
  if (!pain) return fighter
  if (!feitanNenActive(fighter)) {
    return {
      ...fighter,
      hatsuEffects: {
        ...fighter.hatsuEffects,
        painPacker: { ...pain, armour: false, packedDamage: 0, sun: null },
      },
    }
  }
  if (pain.sun) return advanceSun(fighter)
  return castReady(fighter) ? cast(fighter) : fighter
}

function castReady(fighter: ArcadeFighter): boolean {
  const attack = fighter.attack
  if (!attack || attack.impacted || attack.hatsuSource !== 'feitan') return false
  return attack.frame === attackData(attack.kind, fighter).startup
}

function cast(fighter: ArcadeFighter): ArcadeFighter {
  const attack = fighter.attack!
  if (!feitanMoveAvailable(fighter, attack.moveId)) return fighter
  const pain = fighter.hatsuEffects.painPacker!
  const packing = painPackerAction(fighter, attack.moveId) === 'pack'
  return {
    ...fighter,
    attack: { ...attack, impacted: true },
    hatsuEffects: {
      ...fighter.hatsuEffects,
      painPacker: packing
        ? { ...pain, injuries: 0, packedDamage: pain.injuries, armour: true }
        : { ...pain, packedDamage: 0, sun: createRisingSun(fighter, pain.packedDamage) },
    },
  }
}

function advanceSun(fighter: ArcadeFighter): ArcadeFighter {
  const pain = fighter.hatsuEffects.painPacker!
  const sun = pain.sun!
  const expired = sun.age >= sun.duration
  return {
    ...fighter,
    hatsuEffects: {
      ...fighter.hatsuEffects,
      painPacker: {
        ...pain,
        armour: expired ? false : pain.armour,
        sun: expired ? null : { ...sun, age: sun.age + 1 },
      },
    },
  }
}
