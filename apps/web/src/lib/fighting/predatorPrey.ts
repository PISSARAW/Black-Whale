import { maryPredatorPrey } from './bloodyMaryPredator'
import { chrolloHasActivePage } from './chrolloBook'
import { wakeHanzoBody } from './hanzoProjection'
import type { PredatorPreyId } from './predatorTypes'
import type { ArcadeFighter, FighterId, FightSide, FightState } from './types'

export interface PredatorPrey {
  id: PredatorPreyId
  source: FighterId
  nameFr: string
  nameEn: string
  live: (state: FightState, owner: FightSide) => boolean
  consume: (state: FightState, owner: FightSide) => FightState
  point?: (state: FightState, owner: FightSide) => { x: number; y: number }
}

const other = (side: FightSide): FightSide => (side === 'player' ? 'opponent' : 'player')

/** Only identifiable manifestations are prey. Ordinary blows and simple aura shots are not. */
export const PREDATOR_PREY: readonly PredatorPrey[] = [
  {
    id: 'bungee-gum',
    source: 'hisoka',
    nameFr: 'Bungee Gum',
    nameEn: 'Bungee Gum',
    live: (s, side) => s.bungeeGum?.owner === side,
    consume: (s) => ({ ...s, bungeeGum: null }),
    point: (s, side) => ({ x: (s[side].x + s[other(side)].x) / 2, y: 7 }),
  },
  {
    id: 'hanzo-skill-4',
    source: 'hanzo',
    nameFr: 'Hanzo Skill 4',
    nameEn: 'Hanzo Skill 4',
    live: (s, side) => Boolean(s[side].hanzoProjection),
    consume: (s, side) => ({ ...s, [side]: wakeHanzoBody(s[side]) }),
  },
  {
    id: 'rising-sun',
    source: 'feitan',
    nameFr: 'Rising Sun',
    nameEn: 'Rising Sun',
    live: (s, side) => Boolean(s[side].hatsuEffects.painPacker?.sun),
    consume: (s, side) => {
      const fighter = s[side]
      const pain = fighter.hatsuEffects.painPacker!
      return {
        ...s,
        [side]: {
          ...fighter,
          hatsuEffects: { ...fighter.hatsuEffects, painPacker: { ...pain, sun: null } },
        },
      }
    },
    point: (s, side) => s[side].hatsuEffects.painPacker!.sun!,
  },
  ownCounter({
    id: 'blinky',
    source: 'shizuku',
    nameFr: 'Blinky',
    nameEn: 'Blinky',
    key: 'blinkyFrames',
  }),
  targetCounter({
    id: 'black-voice',
    source: 'chrollo',
    nameFr: 'Black Voice',
    nameEn: 'Black Voice',
    key: 'manipulatedFrames',
  }),
  {
    id: 'sun-and-moon',
    source: 'chrollo',
    nameFr: 'Sun and Moon',
    nameEn: 'Sun and Moon',
    live: (s, side) =>
      s[other(side)].hatsuEffects.sunMark + s[other(side)].hatsuEffects.moonMark > 0,
    consume: (s, side) => {
      const target = s[other(side)]
      return {
        ...s,
        [other(side)]: {
          ...target,
          hatsuEffects: { ...target.hatsuEffects, sunMark: 0, moonMark: 0 },
        },
      }
    },
    point: (s, side) => ({ x: s[other(side)].x, y: s[other(side)].y + 7 }),
  },
  {
    id: 'chain-jail',
    source: 'kurapika',
    nameFr: 'Chain Jail',
    nameEn: 'Chain Jail',
    live: (s, side) => s[other(side)].chainJail?.owner === side,
    consume: (s, side) => ({ ...s, [other(side)]: { ...s[other(side)], chainJail: undefined } }),
  },
  {
    id: 'steal-chain',
    source: 'kurapika',
    nameFr: 'Steal Chain',
    nameEn: 'Steal Chain',
    live: (s, side) => s[other(side)].drainingChain?.owner === side,
    consume: (s, side) => ({
      ...s,
      [other(side)]: { ...s[other(side)], drainingChain: undefined },
    }),
  },
  targetCounter({
    id: 'nen-stitches',
    source: 'machi',
    nameFr: 'Fils de Nen',
    nameEn: 'Nen threads',
    key: 'stitchedFrames',
  }),
  targetCounter({
    id: 'needle-control',
    source: 'illumi',
    nameFr: 'Aiguilles de contrôle',
    nameEn: 'Control needles',
    key: 'needleFrames',
  }),
  maryPredatorPrey,
  targetCounter({
    id: 'paper-serpent',
    source: 'kalluto',
    nameFr: 'Serpent de papier',
    nameEn: 'Paper serpent',
    key: 'serpentMarks',
  }),
]

type CounterKey =
  | 'blinkyFrames'
  | 'manipulatedFrames'
  | 'stitchedFrames'
  | 'needleFrames'
  | 'serpentMarks'
type CounterSpec = Pick<PredatorPrey, 'id' | 'source' | 'nameFr' | 'nameEn'> & { key: CounterKey }

function ownCounter(spec: CounterSpec): PredatorPrey {
  return {
    ...spec,
    live: (s, side) => s[side].hatsuEffects[spec.key] > 0,
    consume: (s, side) => clearCounter(s, side, spec.key),
  }
}

function targetCounter(spec: CounterSpec): PredatorPrey {
  return {
    ...spec,
    live: (s, side) => s[other(side)].hatsuEffects[spec.key] > 0,
    consume: (s, side) => clearCounter(s, other(side), spec.key),
    point: (s, side) => ({ x: s[other(side)].x, y: s[other(side)].y + 7 }),
  }
}

function clearCounter(state: FightState, side: FightSide, key: CounterKey): FightState {
  const fighter = state[side]
  return { ...state, [side]: { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, [key]: 0 } } }
}

export function predatorPrey(id: PredatorPreyId): PredatorPrey {
  return PREDATOR_PREY.find((prey) => prey.id === id)!
}

export function preyHasSource(fighter: ArcadeFighter, source: FighterId): boolean {
  if (fighter.id === source) return true
  if (fighter.id === 'chrollo' && source !== 'chrollo') return chrolloHasActivePage(fighter, source)
  return fighter.kurapika?.held?.used === true && fighter.kurapika.held.source === source
}

export function preyIsLive(state: FightState, owner: FightSide, preyId: PredatorPreyId): boolean {
  const prey = predatorPrey(preyId)
  return preyHasSource(state[owner], prey.source) && prey.live(state, owner)
}

export function preyPosition(state: FightState, owner: FightSide, preyId: PredatorPreyId) {
  const prey = predatorPrey(preyId)
  return prey.point?.(state, owner) ?? { x: state[owner].x, y: state[owner].y + 7 }
}
