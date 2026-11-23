import { moveForSlot } from '../fighting/movesets'
import type { FighterId, MoveSlot } from '../fighting/types'
import type { ArenaHatsuEffect, BodyZone, CombatAction } from './types'

type FightingMoveAction = Extract<CombatAction, { type: 'FIGHTING_MOVE' }>
type HatsuAction = Extract<CombatAction, { type: 'HATSU' }>

interface FightingHatsuRoute {
  hatsuId: string
  effect: ArenaHatsuEffect
  zone: BodyZone
}

const ROUTES = {
  'kurapika:neutralSpecial': { hatsuId: 'chain-jail', effect: 'bind', zone: 'arms' },
  'hisoka:neutralSpecial': { hatsuId: 'bungee-gum', effect: 'bind', zone: 'arms' },
  'phinks:neutralSpecial': { hatsuId: 'ripper-cyclotron', effect: 'impact', zone: 'arms' },
  'franklin:neutralSpecial': {
    hatsuId: 'double-machine-gun',
    effect: 'barrage',
    zone: 'torso',
  },
  'machi:neutralSpecial': { hatsuId: 'nen-stitches', effect: 'bind', zone: 'arms' },
  'illumi:neutralSpecial': { hatsuId: 'illumi-needle-people', effect: 'bind', zone: 'head' },
  'hinrigh:neutralSpecial': { hatsuId: 'biohazard-hinrigh', effect: 'enhance', zone: 'arms' },
  'mizaistom:neutralSpecial': { hatsuId: 'cross-game', effect: 'bind', zone: 'torso' },
  'hanzo:neutralSpecial': { hatsuId: 'hanzo-skill-4', effect: 'enhance', zone: 'torso' },
  'zakuro:neutralSpecial': { hatsuId: 'bloody-mary', effect: 'bind', zone: 'arms' },
  'melody:neutralSpecial': {
    hatsuId: 'melody-enchanting-music',
    effect: 'enhance',
    zone: 'torso',
  },
  'halkenburg:neutralSpecial': {
    hatsuId: 'grimmel-the-dissonance',
    effect: 'impact',
    zone: 'torso',
  },
  'gel:neutralSpecial': { hatsuId: 'snake-arm', effect: 'bind', zone: 'arms' },
  'lynch:neutralSpecial': { hatsuId: 'body-and-soul', effect: 'impact', zone: 'torso' },
  'luini:neutralSpecial': {
    hatsuId: 'luini-spatial-teleportation',
    effect: 'enhance',
    zone: 'torso',
  },
  'bill:neutralSpecial': { hatsuId: 'erigeron', effect: 'restore', zone: 'torso' },
  'musse:neutralSpecial': { hatsuId: 'secret-window', effect: 'enhance', zone: 'head' },
  'padaille:neutralSpecial': {
    hatsuId: 'padaille-weapon-transformation',
    effect: 'impact',
    zone: 'arms',
  },
  'terebellum:neutralSpecial': {
    hatsuId: 'damage-sweet-home',
    effect: 'restore',
    zone: 'arms',
  },
  'yokotani:neutralSpecial': { hatsuId: 'lsdf', effect: 'bind', zone: 'torso' },
} satisfies Partial<Record<`${FighterId}:${MoveSlot}`, FightingHatsuRoute>>

export function fightingHatsuRoute(
  fighterId: FighterId,
  slot: MoveSlot,
): FightingHatsuRoute | null {
  const key = `${fighterId}:${slot}` as keyof typeof ROUTES
  return ROUTES[key] ?? null
}

/** Routes only slots whose authored move names the same complete Arena Hatsu. */
export function fightingHatsuAction(action: FightingMoveAction): HatsuAction | null {
  const route = fightingHatsuRoute(action.fighterId, action.slot)
  const move = moveForSlot(action.fighterId, action.slot)
  if (!route || !move) return null
  return {
    type: 'HATSU',
    side: action.side,
    effect: route.effect,
    zone: route.zone,
    hatsuId: route.hatsuId,
    cost: move.auraCost,
  }
}
