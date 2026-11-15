import { attackPhase, boxesOverlap, hurtboxes, otherSide, type FightBox } from './frameData'
import type {
  ArcadeFighter,
  FightProjectile,
  FightSide,
  FightState,
  FighterId,
  ProjectileShape,
} from './types'

export const RANGED_AURA_COST = 12

export interface ProjectileProfile {
  labelFr: string
  labelEn: string
  shape: ProjectileShape
  colour: string
  speed: number
  damage: number
  hitstun: number
  blockstun: number
  hitstop: number
  knockback: number
  width: number
  height: number
  y: number
}

/**
 * Only attacks the character is actually shown carrying or producing belong
 * here. Everyone else still gets the shared ranged arcade action, but throws a
 * mundane stone instead of gaining an invented Nen technique.
 */
const CANONICAL_PROJECTILES: Partial<Record<FighterId, ProjectileProfile>> = {
  kurapika: projectile({
    labels: ['Chaîne', 'Chain'],
    shape: 'chain',
    colour: '#d7e6ff',
    speed: 48,
    damage: 10,
    size: [1.25, 0.55],
  }),
  hisoka: projectile({
    labels: ['Carte', 'Card'],
    shape: 'card',
    colour: '#ff5fb7',
    speed: 68,
    damage: 8,
    size: [0.85, 0.45],
  }),
  benjamin: projectile({
    labels: ['Tir d’arme lourde', 'Heavy firearm shot'],
    shape: 'bullet',
    colour: '#d8c7a0',
    speed: 76,
    damage: 11,
    size: [0.65, 0.28],
  }),
  feitan: projectile({
    labels: ['Pointe du parapluie', 'Umbrella spike'],
    shape: 'bullet',
    colour: '#cbd5e1',
    speed: 72,
    damage: 10,
    size: [0.9, 0.3],
  }),
  theta: projectile({
    labels: ['Projectile d’aura', 'Aura projectile'],
    shape: 'orb',
    colour: '#67e8f9',
    speed: 70,
    damage: 10,
    size: [0.8, 0.6],
  }),
  franklin: projectile({
    labels: ['Balles d’aura', 'Aura bullets'],
    shape: 'bullet',
    colour: '#ef4444',
    speed: 82,
    damage: 11,
    size: [0.6, 0.24],
  }),
  machi: projectile({
    labels: ['Fil de Nen', 'Nen thread'],
    shape: 'chain',
    colour: '#f472b6',
    speed: 60,
    damage: 8,
    size: [1.2, 0.3],
  }),
  illumi: projectile({
    labels: ['Aiguille', 'Needle'],
    shape: 'bullet',
    colour: '#a78bfa',
    speed: 74,
    damage: 9,
    size: [0.72, 0.22],
  }),
  kalluto: projectile({
    labels: ['Confetti', 'Confetti'],
    shape: 'card',
    colour: '#fb7185',
    speed: 66,
    damage: 8,
    size: [0.7, 0.4],
  }),
  bonolenov: projectile({
    labels: ['Jupiter', 'Jupiter'],
    shape: 'orb',
    colour: '#fbbf24',
    speed: 42,
    damage: 11,
    size: [1.25, 1],
  }),
  hinrigh: projectile({
    labels: ['Arme Biohazard', 'Biohazard weapon'],
    shape: 'bullet',
    colour: '#34d399',
    speed: 64,
    damage: 10,
    size: [0.85, 0.32],
  }),
  leorio: projectile({
    labels: ['Poing émissif', 'Emissive fist'],
    shape: 'orb',
    colour: '#38bdf8',
    speed: 68,
    damage: 11,
    size: [1, 0.75],
  }),
}

const THROWN_STONE = projectile({
  labels: ['Pierre', 'Stone'],
  shape: 'stone',
  colour: '#81715f',
  speed: 46,
  damage: 8,
  size: [0.72, 0.58],
})

interface ProjectileOptions {
  labels: [string, string]
  shape: ProjectileShape
  colour: string
  speed: number
  damage: number
  size: [number, number]
}

function projectile(options: ProjectileOptions): ProjectileProfile {
  return {
    labelFr: options.labels[0],
    labelEn: options.labels[1],
    shape: options.shape,
    colour: options.colour,
    speed: options.speed,
    damage: options.damage,
    width: options.size[0],
    height: options.size[1],
    hitstun: 13,
    blockstun: 9,
    hitstop: 5,
    knockback: 2.2,
    y: 6.1,
  }
}

export function projectileProfile(id: FighterId): ProjectileProfile {
  return CANONICAL_PROJECTILES[id] ?? THROWN_STONE
}

export function canUseRangedAttack(fighter: Pick<ArcadeFighter, 'aura' | 'nen'>): boolean {
  return fighter.aura >= RANGED_AURA_COST && fighter.nen.mode !== 'zetsu'
}

export function spawnRangedProjectiles(state: FightState): FightState {
  return spawnForSide(spawnForSide(state, 'player'), 'opponent')
}

function spawnForSide(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (
    fighter.attack?.kind !== 'ranged' ||
    fighter.attack.projectileSpawned ||
    attackPhase(fighter) !== 'active'
  ) {
    return state
  }
  const profile = projectileProfile(fighter.id)
  const projectile: FightProjectile = {
    id: state.nextProjectileId,
    owner: side,
    fighterId: fighter.id,
    x: fighter.x + fighter.facing * 3.4,
    y: fighter.y + profile.y,
    velocityX: fighter.facing * profile.speed,
    width: profile.width,
    height: profile.height,
    damage: profile.damage,
    hitstun: profile.hitstun,
    blockstun: profile.blockstun,
    hitstop: profile.hitstop,
    knockback: profile.knockback,
    targetZone: 'torso',
    shape: profile.shape,
    colour: profile.colour,
    age: 0,
    lifetime: 120,
  }
  return {
    ...state,
    [side]: {
      ...fighter,
      attack: { ...fighter.attack, projectileSpawned: true, impacted: true },
    },
    projectiles: [...state.projectiles, projectile],
    nextProjectileId: state.nextProjectileId + 1,
  }
}

export interface ProjectileHit {
  projectile: FightProjectile
  defenderSide: FightSide
  position: { x: number; y: number }
}

export function advanceProjectiles(
  state: FightState,
  step: number,
): { state: FightState; hits: ProjectileHit[] } {
  const hits: ProjectileHit[] = []
  const kept: FightProjectile[] = []
  for (const held of state.projectiles) {
    const projectile = { ...held, x: held.x + held.velocityX * step, age: held.age + 1 }
    const defenderSide = otherSide(projectile.owner)
    const collision = projectileCollision(projectile, state[defenderSide])
    if (collision) hits.push({ projectile, defenderSide, position: collision })
    else if (projectile.age < projectile.lifetime && projectile.x > 2 && projectile.x < 98)
      kept.push(projectile)
  }
  return { state: { ...state, projectiles: kept }, hits }
}

function projectileCollision(
  projectile: FightProjectile,
  defender: ArcadeFighter,
): { x: number; y: number } | null {
  const box: FightBox = {
    left: projectile.x - projectile.width,
    right: projectile.x + projectile.width,
    bottom: projectile.y - projectile.height,
    top: projectile.y + projectile.height,
  }
  const hurtbox = hurtboxes(defender).find((candidate) => boxesOverlap(box, candidate))
  if (!hurtbox) return null
  return {
    x: (Math.max(box.left, hurtbox.left) + Math.min(box.right, hurtbox.right)) / 2,
    y: (Math.max(box.bottom, hurtbox.bottom) + Math.min(box.top, hurtbox.top)) / 2,
  }
}
