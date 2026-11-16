import { canUseHatsu } from '@black-whale/nen-engine'
import { hatsuSealedByOn } from './onTechnique'
import type { ArcadeFighter, FightSide, FightState, FighterId } from './types'
export { advanceHatsuFrames, hatsuFor } from './hatsu/registry'
import { hatsuFor } from './hatsu/registry'

/** Shared gameplay contract for every roster Hatsu. */
export const FIGHT_HATSU_AURA_COST = 40

export function canUseFightHatsu(fighter: Pick<ArcadeFighter, 'aura' | 'nen' | 'on'>): boolean {
  return (
    fighter.aura >= FIGHT_HATSU_AURA_COST && canUseHatsu(fighter.nen) && !hatsuSealedByOn(fighter)
  )
}

/**
 * `null` when no Hatsu acts: a martial-only fighter, or one whose ability is held
 * in Chrollo's book. Their techniques remain Ren-charged strikes.
 */
export function hatsuSourceFor(fighter: ArcadeFighter, moveId?: string): FighterId | null {
  const hatsu = hatsuFor(fighter.id)
  if (hatsu.martialOnly || fighter.hatsuEffects.hatsuStolen > 0) return null
  return hatsu.sourceFor ? hatsu.sourceFor(fighter, moveId) : fighter.id
}

/**
 * A direct hit killed `victimSide`. Returns the state rewritten by the victim's
 * conditional Nen, or `null` when nothing wakes and the KO stands.
 */
export function resolveDeathHatsu(
  state: FightState,
  killerSide: FightSide,
  victimSide: FightSide,
): FightState | null {
  const victim = state[victimSide]
  if (victim.hatsuEffects.hatsuStolen > 0) return null
  return hatsuFor(victim.id).onDeath?.({ state, victimSide, killerSide }) ?? null
}

/** Activating a Hatsu also shows it to the other fighter (Skill Hunter's first condition). */
export function triggerHatsu(state: FightState, side: FightSide, source: FighterId): FightState {
  const witnessSide = side === 'player' ? 'opponent' : 'player'
  const witness = state[witnessSide]
  const seen = {
    ...state,
    [witnessSide]: {
      ...witness,
      hatsuEffects: { ...witness.hatsuEffects, witnessedHatsu: source },
    },
  }
  return hatsuFor(source).onTrigger({ state: seen, side, source })
}

export function resolveHatsuImpact(options: {
  state: FightState
  side: FightSide
  defenderSide: FightSide
  source: FighterId
  moveId?: string
  blocked: boolean
  concealed: boolean
}): FightState {
  const { side, defenderSide, source, moveId, blocked, concealed } = options
  return hatsuFor(source).onImpact({
    state: options.state,
    side,
    defenderSide,
    source,
    moveId,
    blocked,
    concealed,
  })
}

export function hatsuDamageFactor(fighter: ArcadeFighter): number {
  const baton = 1 + fighter.hatsuEffects.batonCharges * 0.12
  const risingSun = risingSunFactor(fighter)
  const transformed = fighter.hatsuEffects.transformationFrames > 0 ? 1.35 : 1
  const cyclotron = 1 + fighter.hatsuEffects.cyclotronTurns * 0.22
  const cantabile = fighter.hatsuEffects.cantabileFrames > 0 ? 1.3 : 1
  const biohazard = fighter.hatsuEffects.biohazardFrames > 0 ? 1.2 : 1
  const haiku = fighter.hatsuEffects.haikuFrames > 0 ? 1.25 : 1
  const growth = fighter.hatsuEffects.growthFrames > 0 ? 1.15 : 1
  const coins = 1 + fighter.hatsuEffects.coinCharges * 0.1
  const completion = completionDamageFactor(fighter)
  return (
    baton *
    risingSun *
    transformed *
    cyclotron *
    cantabile *
    biohazard *
    haiku *
    growth *
    coins *
    completion
  )
}

function risingSunFactor(fighter: ArcadeFighter): number {
  if (fighter.id !== 'feitan' || fighter.attack?.kind !== 'special') return 1
  return 1 + ((100 - fighter.health) / 100) * 1.8
}

function completionDamageFactor(fighter: ArcadeFighter): number {
  const weapon = fighter.hatsuEffects.weaponFrames > 0 ? 1.25 : 1
  const synthesis = fighter.hatsuEffects.synthesisFrames > 0 ? 1.12 : 1
  return weapon * synthesis
}

export function hatsuDefenceFactor(fighter: ArcadeFighter): number {
  const transformed = fighter.hatsuEffects.transformationFrames > 0 ? 0.68 : 1
  const cantabile = fighter.hatsuEffects.cantabileFrames > 0 ? 0.82 : 1
  const biohazard = fighter.hatsuEffects.biohazardFrames > 0 ? 0.86 : 1
  const predator = fighter.hatsuEffects.predatorFrames > 0 ? 0.75 : 1
  const growth = fighter.hatsuEffects.growthFrames > 0 ? 0.82 : 1
  const exposed = fighter.hatsuEffects.soulExposedFrames > 0 ? 1.25 : 1
  const smoked = fighter.hatsuEffects.smokeFrames > 0 ? 1.1 : 1
  const coins = Math.max(0.76, 1 - fighter.hatsuEffects.coinCharges * 0.08)
  const completion = completionDefenceFactor(fighter)
  return (
    transformed * cantabile * biohazard * predator * growth * exposed * smoked * coins * completion
  )
}

function completionDefenceFactor(fighter: ArcadeFighter): number {
  const curse = fighter.hatsuEffects.gidalCurseFrames > 0 ? 1.25 : 1
  const eyes = fighter.hatsuEffects.eyeWogFrames > 0 ? 1.1 : 1
  const synthesis = fighter.hatsuEffects.synthesisFrames > 0 ? 0.88 : 1
  return curse * eyes * synthesis
}

export function hatsuAvoidsImpact(fighter: ArcadeFighter): boolean {
  return AVOIDANCE_KEYS.some((key) => fighter.hatsuEffects[key] > 0)
}

export function consumeBaton(fighter: ArcadeFighter): ArcadeFighter {
  if (!fighter.hatsuEffects.batonCharges) return fighter
  return {
    ...fighter,
    hatsuEffects: { ...fighter.hatsuEffects, batonCharges: 0 },
  }
}

export function consumeFutureSight(fighter: ArcadeFighter): ArcadeFighter {
  if (!fighter.hatsuEffects.futureSight) return fighter
  return {
    ...fighter,
    hatsuEffects: { ...fighter.hatsuEffects, futureSight: fighter.hatsuEffects.futureSight - 1 },
  }
}

export function consumeHatsuAvoidance(fighter: ArcadeFighter): ArcadeFighter {
  if (fighter.hatsuEffects.futureSight > 0) return consumeFutureSight(fighter)
  if (fighter.hatsuEffects.isolationFrames > 0) {
    return {
      ...fighter,
      hatsuEffects: { ...fighter.hatsuEffects, isolationFrames: 0 },
    }
  }
  if (fighter.hatsuEffects.cloneDodges > 0) {
    return {
      ...fighter,
      hatsuEffects: { ...fighter.hatsuEffects, cloneDodges: fighter.hatsuEffects.cloneDodges - 1 },
    }
  }
  return consumeStandardAvoidance(fighter)
}

type AvoidanceKey =
  | 'futureSight'
  | 'isolationFrames'
  | 'cloneDodges'
  | 'teleportDodges'
  | 'wormDodges'
  | 'kachoGuards'
  | 'sweetHomeCharges'
  | 'doorDodges'
  | 'lsdfGuards'

const AVOIDANCE_KEYS: readonly AvoidanceKey[] = [
  'futureSight',
  'isolationFrames',
  'cloneDodges',
  'teleportDodges',
  'wormDodges',
  'kachoGuards',
  'sweetHomeCharges',
  'doorDodges',
  'lsdfGuards',
]

/** Keys `consumeHatsuAvoidance` spends with their own rule; the rest lose one charge. */
const SPECIAL_AVOIDANCE_KEYS: readonly AvoidanceKey[] = [
  'futureSight',
  'isolationFrames',
  'cloneDodges',
]
const STANDARD_AVOIDANCE_KEYS = AVOIDANCE_KEYS.filter(
  (key) => !SPECIAL_AVOIDANCE_KEYS.includes(key),
)

function consumeStandardAvoidance(fighter: ArcadeFighter): ArcadeFighter {
  const key = STANDARD_AVOIDANCE_KEYS.find((candidate) => fighter.hatsuEffects[candidate] > 0)
  if (!key) return fighter
  return {
    ...fighter,
    hatsuEffects: { ...fighter.hatsuEffects, [key]: fighter.hatsuEffects[key] - 1 },
  }
}
