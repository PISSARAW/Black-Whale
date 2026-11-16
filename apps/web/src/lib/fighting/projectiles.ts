import { thetaShotAim } from './thetaFirearm'
import { benjaminBurstReady } from './benjaminWeapon'
import { hasMoveResources, moveForSlot } from './movesets'
import { advanceRemotePunch, remotePunchCanHit, spawnRemotePunch } from './remotePunch'
import { franklinNenAvailable } from './franklinAttack'
import { spawnFranklinBarrage } from './franklinBarrage'
import { attackPhase, boxesOverlap, hurtboxes, otherSide, type FightBox } from './frameData'
import type {
  ArcadeFighter,
  FightProjectile,
  FightSide,
  FightState,
  FighterId,
  ProjectileMatter,
  ProjectileShape,
} from './types'

export const RANGED_AURA_COST = 12

export interface ProjectileProfile {
  matter: ProjectileMatter
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
 * `matter` says what Shizuku's Blinky may swallow: real objects (cards, bullets,
 * needles, paper, stones) but never conjured or emitted aura, nor Hinrigh's
 * living weapons.
 *
 * Only attacks the character is actually shown carrying or producing belong
 * here. Everyone else still gets the shared ranged arcade action, but throws a
 * mundane stone instead of gaining an invented Nen technique.
 */
const CANONICAL_PROJECTILES: Partial<Record<FighterId, ProjectileProfile>> = {
  kurapika: projectile({
    matter: 'nen',
    labels: ['Chaîne divinatoire', 'Dowsing Chain'],
    shape: 'chain',
    colour: '#e8d44d',
    speed: 48,
    damage: 10,
    size: [1.25, 0.55],
  }),
  hisoka: projectile({
    matter: 'object',
    labels: ['Carte', 'Card'],
    shape: 'card',
    colour: '#ff5fb7',
    speed: 68,
    damage: 8,
    size: [0.85, 0.45],
  }),
  benjamin: projectile({
    matter: 'object',
    labels: ['Mitraillette · Rafale', 'Machine Gun · Burst'],
    shape: 'bullet',
    colour: '#d8c7a0',
    speed: 76,
    damage: 5,
    size: [0.65, 0.28],
  }),
  feitan: projectile({
    matter: 'object',
    labels: ['Pointe du parapluie', 'Umbrella spike'],
    shape: 'bullet',
    colour: '#cbd5e1',
    speed: 72,
    damage: 10,
    size: [0.9, 0.3],
  }),
  theta: projectile({
    matter: 'object',
    labels: ['Tir de pistolet', 'Handgun shot'],
    shape: 'bullet',
    colour: '#d8c7a0',
    speed: 76,
    damage: 10,
    size: [0.55, 0.2],
  }),
  franklin: projectile({
    matter: 'nen',
    labels: ['Balles d’aura', 'Aura bullets'],
    shape: 'bullet',
    colour: '#ef4444',
    speed: 82,
    damage: 11,
    size: [0.6, 0.24],
  }),
  machi: projectile({
    matter: 'nen',
    labels: ['Fil de Nen', 'Nen thread'],
    shape: 'chain',
    colour: '#f472b6',
    speed: 60,
    damage: 8,
    size: [1.2, 0.3],
  }),
  illumi: projectile({
    matter: 'object',
    labels: ['Aiguille', 'Needle'],
    shape: 'bullet',
    colour: '#a78bfa',
    speed: 74,
    damage: 9,
    size: [0.72, 0.22],
  }),
  kalluto: projectile({
    matter: 'object',
    labels: ['Confetti', 'Confetti'],
    shape: 'card',
    colour: '#fb7185',
    speed: 66,
    damage: 8,
    size: [0.7, 0.4],
  }),
  bonolenov: projectile({
    matter: 'nen',
    labels: ['Jupiter', 'Jupiter'],
    shape: 'orb',
    colour: '#fbbf24',
    speed: 42,
    damage: 11,
    size: [1.25, 1],
  }),
  hinrigh: projectile({
    matter: 'nen',
    labels: ['Arme Biohazard', 'Biohazard weapon'],
    shape: 'bullet',
    colour: '#34d399',
    speed: 64,
    damage: 10,
    size: [0.85, 0.32],
  }),
  leorio: projectile({
    matter: 'nen',
    labels: ['Poing à distance', 'Remote Punch'],
    shape: 'remote-fist',
    colour: '#bcecff',
    speed: 0,
    damage: 19,
    size: [1.6, 1.5],
  }),
}

const THROWN_STONE = projectile({
  matter: 'object',
  labels: ['Pierre', 'Stone'],
  shape: 'stone',
  colour: '#81715f',
  speed: 46,
  damage: 8,
  size: [0.72, 0.58],
})

interface ProjectileOptions {
  matter: ProjectileMatter
  labels: [string, string]
  shape: ProjectileShape
  colour: string
  speed: number
  damage: number
  size: [number, number]
}

function projectile(options: ProjectileOptions): ProjectileProfile {
  return {
    matter: options.matter,
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

export function canUseRangedAttack(fighter: ArcadeFighter): boolean {
  if (fighter.id === 'kurapika')
    return hasMoveResources(fighter, moveForSlot('kurapika', 'forwardSpecial')!)
  if (fighter.id === 'benjamin' || fighter.id === 'theta') return true
  if (fighter.id === 'leorio')
    return hasMoveResources(fighter, moveForSlot('leorio', 'neutralSpecial')!)
  if (fighter.id === 'franklin' && !franklinNenAvailable(fighter)) return false
  if (fighter.hanzoProjection) return false
  return fighter.aura >= RANGED_AURA_COST && fighter.nen.mode !== 'zetsu'
}

export function rangedAuraCost(id: FighterId): number {
  if (id === 'kurapika') return moveForSlot(id, 'forwardSpecial')!.auraCost
  if (id === 'benjamin' || id === 'theta') return 0
  return id === 'leorio' ? moveForSlot(id, 'neutralSpecial')!.auraCost : RANGED_AURA_COST
}

export function spawnRangedProjectiles(state: FightState): FightState {
  const barrage = spawnFranklinBarrage(spawnFranklinBarrage(state, 'player'), 'opponent')
  const remote = spawnRemotePunch(spawnRemotePunch(barrage, 'player'), 'opponent')
  return spawnForSide(spawnForSide(remote, 'player'), 'opponent')
}

function spawnForSide(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (
    fighter.id === 'leorio' ||
    fighter.id === 'franklin' ||
    fighter.hanzoProjection ||
    fighter.attack?.kind !== 'ranged' ||
    !benjaminBurstReady(fighter) ||
    attackPhase(fighter) !== 'active'
  ) {
    return state
  }
  const profile = projectileProfile(fighter.id)
  const aim = fighter.id === 'theta' ? thetaShotAim(fighter) : { y: profile.y, targetZone: 'torso' as const }
  const projectile: FightProjectile = {
    id: state.nextProjectileId,
    owner: side,
    fighterId: fighter.id,
    x: fighter.x + fighter.facing * 3.4,
    y: fighter.y + aim.y,
    velocityX: fighter.facing * profile.speed,
    width: profile.width,
    height: profile.height,
    damage: profile.damage,
    hitstun: profile.hitstun,
    blockstun: profile.blockstun,
    hitstop: profile.hitstop,
    knockback: profile.knockback,
    targetZone: aim.targetZone,
    shape: profile.shape,
    colour: profile.colour,
    matter: profile.matter,
    concealed: fighter.attack.concealed,
    age: 0,
    lifetime: 120,
  }
  return {
    ...state,
    [side]: {
      ...fighter,
      attack: {
        ...fighter.attack,
        projectileSpawned: true,
        projectilesSpawned: (fighter.attack.projectilesSpawned ?? 0) + 1,
        impacted: true,
      },
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
    const projectile = held.remotePunch
      ? advanceRemotePunch(held)
      : { ...held, x: held.x + held.velocityX * step, age: held.age + 1 }
    const defenderSide = otherSide(projectile.owner)
    const collision = projectileCollision(projectile, state[defenderSide])
    if (collision) {
      hits.push({ projectile, defenderSide, position: collision })
      if (projectile.remotePunch)
        projectile.remotePunch = { ...projectile.remotePunch, struck: true }
    }
    if (
      (!collision || projectile.remotePunch) &&
      projectile.age < projectile.lifetime &&
      projectile.x > 2 &&
      projectile.x < 98
    )
      kept.push(projectile)
  }
  return { state: { ...state, projectiles: kept }, hits }
}

function projectileCollision(
  projectile: FightProjectile,
  defender: ArcadeFighter,
): { x: number; y: number } | null {
  if (!remotePunchCanHit(projectile)) return null
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
