import { interceptProjectileWorld } from './projectileInterception'
import { passProjectileThroughDoor } from './voconteDoorProjectiles'
import { rosterProjectileTarget } from './rosterGuestContacts'
import { canReceiveCombatHit } from './combatTargets'
import { BODYGUARD_PISTOL, hasBodyguardFirearm, bodyguardShotHeight } from './bodyguardFirearms'
import { hasIllumiNeedles } from './illumiEquipment'
import { travelKallutoPaper } from './kallutoFlight'
import { paperAvailable, paperZonePoint } from './kallutoPaper'
import { paperStockReady } from './kallutoMaterials'
import { illumiBodyFree } from './illumiState'
import { battleRangedAvailable } from './battleCantabileRules'
import { advanceJupiter } from './jupiterFlight'
import { commitProjectileNen } from './nenProjectiles'
import { travelFightProjectile, keepFightProjectile } from './projectileFlight'
import { predatorNenLocked } from './predatorSeal'
import { CAMILLA_PISTOL, camillaCanFire, spendCamillaRound } from './camillaWeapon'
import { hinrighCanThrow, spendHinrighKnife, hinrighRangedBody } from './hinrighKnives'
import { spendBiohazardGunRound } from './biohazardGun'
import { thetaShotAim } from './thetaFirearm'
import { hasMoveResources, moveForSlot } from './movesets'
import { remotePunchCanHit, spawnRemotePunch } from './remotePunch'
import { benjaminBurstReady } from './benjaminWeapon'
import { franklinNenAvailable } from './franklinAttack'
import { spawnFranklinBarrage } from './franklinBarrage'
import { attackPhase, boxesOverlap, hurtboxes, otherSide, type FightBox } from './frameData'
import {
  bindGumThrow,
  travelGumProjectile,
  gumProjectileCanHit,
  settleGumProjectile,
  advanceGumObjectNen,
} from './bungeeProjectiles'
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
  hisoka: projectile({
    matter: 'object',
    labels: ['Carte', 'Card'],
    shape: 'card',
    colour: '#ff5fb7',
    speed: 68,
    damage: 8,
    size: [0.85, 0.45],
  }),
  musse: {
    ...projectile({
      matter: 'object',
      labels: ['Pistolet', 'Handgun'],
      shape: 'bullet',
      colour: '#e0d4b5',
      speed: 84,
      damage: 10,
      size: [0.45, 0.2],
    }),
    y: 11.4,
  },
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
    labels: ['Aiguille de pistage', 'Tracking needle'],
    shape: 'chain',
    colour: '#f472b6',
    speed: 60,
    damage: 8,
    size: [1.2, 0.3],
  }),
  illumi: projectile({
    matter: 'object',
    labels: ['Aiguille', 'Needle'],
    shape: 'needle',
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
    damage: 4,
    size: [0.7, 0.6],
  }),
  bonolenov: projectile({
    matter: 'nen',
    labels: ['Jupiter · Danse', 'Jupiter · Dance'],
    shape: 'orb',
    colour: '#d8aa72',
    speed: 84,
    damage: 38,
    size: [12, 12],
  }),
  hinrigh: projectile({
    matter: 'object',
    labels: ['Couteau réel', 'Real knife'],
    shape: 'needle',
    colour: '#d1d5db',
    speed: 76,
    damage: 10,
    size: [0.85, 0.22],
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
  if (id === 'camilla') return CAMILLA_PISTOL
  return CANONICAL_PROJECTILES[id] ?? (hasBodyguardFirearm(id) ? BODYGUARD_PISTOL : THROWN_STONE)
}

export function canUseRangedAttack(fighter: ArcadeFighter): boolean {
  if (physicalRangedUnavailable(fighter)) return false
  if (fighter.id === 'kalluto' && (!paperAvailable(fighter) || !paperStockReady(fighter, 'plant')))
    return false
  if (fighter.id === 'illumi' && !hasIllumiNeedles(fighter)) return false
  if (!illumiBodyFree(fighter)) return false
  return battleRangedAvailable(fighter) ?? standardRangedAvailable(fighter)
}
function physicalRangedUnavailable(fighter: ArcadeFighter): boolean {
  return (
    !camillaCanFire(fighter) ||
    !hinrighCanThrow(fighter) ||
    fighter.biohazardGunRounds === 0 ||
    Boolean(fighter.biohazardGun) ||
    Boolean(fighter.weaponsConfiscated && projectileProfile(fighter.id).matter === 'object')
  )
}

function standardRangedAvailable(fighter: ArcadeFighter): boolean {
  if (predatorNenLocked(fighter) && rangedAuraCost(fighter.id) > 0) return false
  if (fighter.id === 'franklin' && !franklinNenAvailable(fighter)) return false
  if (fighter.hanzoProjection) return false
  if (hasBodyguardFirearm(fighter.id)) return true
  if (fighter.id === 'leorio')
    return hasMoveResources(fighter, moveForSlot('leorio', 'neutralSpecial')!)
  return ordinaryRangedReady(fighter)
}

export function rangedAuraCost(id: FighterId): number {
  if (hasBodyguardFirearm(id)) return 0
  if (id === 'bonolenov') return 55
  if (id === 'machi') return moveForSlot(id, 'forwardSpecial')!.auraCost
  if (['benjamin', 'theta', 'camilla', 'hinrigh', 'musse'].includes(id)) return 0
  return id === 'leorio' ? moveForSlot(id, 'neutralSpecial')!.auraCost : RANGED_AURA_COST
}

export function spawnRangedProjectiles(state: FightState): FightState {
  const barrage = spawnFranklinBarrage(spawnFranklinBarrage(state, 'player'), 'opponent')
  const remote = spawnRemotePunch(spawnRemotePunch(barrage, 'player'), 'opponent')
  return spawnForSide(spawnForSide(remote, 'player'), 'opponent')
}

function spawnForSide(state: FightState, side: FightSide): FightState {
  const fighter = hinrighRangedBody(state[side])
  if (
    physicalRangedUnavailable(fighter) ||
    ['bonolenov', 'leorio', 'franklin', 'kalluto'].includes(fighter.id) ||
    fighter.hanzoProjection ||
    fighter.attack?.kind !== 'ranged' ||
    !benjaminBurstReady(fighter) ||
    attackPhase(fighter) !== 'active'
  ) {
    return state
  }
  const profile = projectileProfile(fighter.id)
  const aim =
    fighter.id === 'theta'
      ? thetaShotAim(fighter)
      : { y: bodyguardShotHeight(fighter, profile.y), targetZone: 'torso' as const }
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
    guard: 'mid',
    canHitDowned: false,
    shape: profile.shape,
    colour: profile.colour,
    ...rangedMaterial(fighter, profile),
    concealed: fighter.attack.concealed,
    age: 0,
    lifetime: 120,
  }
  const gum = bindGumThrow(state, projectile)
  return {
    ...gum.state,
    [side]: {
      ...spendRangedObject(gum.state[side]),
      attack: {
        ...fighter.attack,
        projectileSpawned: true,
        projectilesSpawned: (fighter.attack.projectilesSpawned ?? 0) + 1,
        impacted: true,
      },
    },
    projectiles: [
      ...gum.state.projectiles,
      { ...commitProjectileNen(gum.shot, fighter), hatsuPower: 1 },
    ],
    nextProjectileId: state.nextProjectileId + 1,
  }
}

function rangedMaterial(
  fighter: ArcadeFighter,
  profile: ProjectileProfile,
): Pick<FightProjectile, 'matter' | 'materialCopyId'> {
  const copyId = fighter.id === 'illumi' ? fighter.equipmentProps?.needles?.copyId : undefined
  return { matter: copyId ? 'nen' : profile.matter, materialCopyId: copyId }
}

export interface ProjectileHit {
  targetBody?: string
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
    const moved = advanceProjectileMotion(state, held, step)
    if (!moved) continue
    const passage = passProjectileThroughDoor(state, { projectile: moved, previousX: held.x })
    const projectile = passage.projectile
    const contact = interceptProjectileWorld(state, passage)
    state = contact.state
    if (contact.intercepted) {
      if (contact.terrain && projectile.gumFlight) kept.push(settleGumProjectile(projectile, true))
      continue
    }
    const hit = projectileHit(state, projectile)
    if (hit) {
      hits.push(hit)
      if (projectile.remotePunch)
        projectile.remotePunch = { ...projectile.remotePunch, struck: true }
    }
    if (keepFightProjectile(projectile, Boolean(hit)))
      kept.push(settleGumProjectile(projectile, Boolean(hit)))
  }
  return { state: { ...state, projectiles: kept }, hits }
}
function projectileHit(state: FightState, projectile: FightProjectile): ProjectileHit | null {
  const defenderSide = otherSide(projectile.owner)
  const contact = rosterProjectileTarget(
    state,
    { projectile, main: projectileCollision(projectile, state[defenderSide]) },
    projectileCollision,
  )
  if (!contact) return null
  return {
    projectile,
    defenderSide,
    position: contact.position,
    ...(contact.targetBody ? { targetBody: contact.targetBody } : {}),
  }
}

function projectileCollision(
  projectile: FightProjectile,
  defender: ArcadeFighter,
): { x: number; y: number } | null {
  if (
    !gumProjectileCanHit(projectile) ||
    !remotePunchCanHit(projectile) ||
    !canReceiveCombatHit(defender, projectile.canHitDowned)
  )
    return null
  if (projectile.kallutoPaper) {
    const point = paperZonePoint(defender, projectile.targetZone)
    if (
      Math.abs(projectile.x - point.x) > projectile.width + 1.5 ||
      Math.abs(projectile.y - point.y) > projectile.height + 1
    )
      return null
  }
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

function ordinaryRangedReady(fighter: ArcadeFighter): boolean {
  return (
    ['benjamin', 'theta', 'camilla', 'hinrigh'].includes(fighter.id) ||
    (fighter.aura >= RANGED_AURA_COST && fighter.nen.mode !== 'zetsu')
  )
}

function advanceProjectileMotion(
  state: FightState,
  held: FightProjectile,
  step: number,
): FightProjectile | null {
  if (held.gumFlight) return advanceGumObjectNen(travelGumProjectile(state, held, step))
  if (held.jupiter) return advanceJupiter(state, held, step) ?? null
  return held.kallutoPaper
    ? travelKallutoPaper(state, held, step)
    : travelFightProjectile(held, step)
}

function spendRangedObject(fighter: ArcadeFighter): ArcadeFighter {
  fighter = hinrighRangedBody(fighter)
  const spent = spendHinrighKnife(spendCamillaRound(fighter))
  return (fighter.nenOwner ?? fighter.id) === 'camilla' ? spent : spendBiohazardGunRound(spent)
}
