import { blocksAttack } from './duelMoves'
import {
  activeHitbox,
  attackData,
  attackPhase,
  boxesOverlap,
  contactPoint,
  hurtboxes,
  otherSide,
} from './frameData'
import {
  consumeBaton,
  consumeHatsuAvoidance,
  hatsuAvoidsImpact,
  hatsuDamageFactor,
  hatsuDefenceFactor,
  resolveHatsuImpact,
} from './hatsu'
import {
  focusGuardRyu,
  isCriticalAuraStrike,
  nenAttackFactor,
  nenDamageFactor,
  releaseFocusedAura,
  setIn,
} from './nen'
import { fighterDefinition } from './roster'
import { fightFormat } from './formats'
import type { ProjectileHit } from './projectiles'
import type {
  ArcadeFighter,
  AttackKind,
  FightNenZone,
  FightFinishReason,
  FightSide,
  FightState,
  FighterId,
} from './types'

const GROUND = 0
const MIN_X = 7
const MAX_X = 93
const PARRY_WINDOW_FRAMES = 6
export const TOWER_WIN_SCORE = 10

export function resolveFightImpacts(state: FightState, projectiles: ProjectileHit[]): FightState {
  const trade =
    attackCanResolve(state.player) &&
    attackCanResolve(state.opponent) &&
    attackCollision(state.player, state.opponent) &&
    attackCollision(state.opponent, state.player)
  let next = resolveAttack(state, 'player')
  if (trade) next = resolveTrade(state, next)
  else if (next.phase === 'fighting') next = resolveAttack(next, 'opponent')
  return projectiles.reduce(resolveProjectileHit, next)
}

function resolveAttack(state: FightState, side: FightSide): FightState {
  const attacker = state[side]
  if (!attackCanResolve(attacker)) return state
  const defenderSide = otherSide(side)
  const defender = state[defenderSide]
  if (throwMisses(attacker, defender)) return state
  const collision = attackCollision(attacker, defender)
  if (!collision) return state
  const data = attackData(attacker.attack.kind, attacker)
  const defence = prepareDefence(defender, data.targetZone, attacker)
  const critical = isCriticalAuraStrike(attacker)
  const damage = resolvedDamage({
    attacker,
    defence,
    base: data.damage,
    zone: data.targetZone,
    kind: attacker.attack.kind,
  })
  const spent = spendAttacker(attacker, defence)
  const struck = defence.avoided
    ? defence.fighter
    : strikeDefender({ fighter: defence.fighter, attacker, damage, blocked: defence.blocked })
  const points = defence.avoided ? 0 : scoreForImpact(state.formatId, defence.blocked, critical)
  const score = { ...state.score, [side]: state.score[side] + points }
  let next: FightState = {
    ...state,
    [side]: spent,
    [defenderSide]: struck,
    score,
    impact: {
      sequence: (state.impact?.sequence ?? 0) + 1,
      attacker: side,
      kind: attacker.attack.kind,
      damage,
      blocked: defence.blocked,
      parried: defence.parried,
      critical,
      points,
      zone: data.targetZone,
      concealed: attacker.attack.concealed,
      avoided: defence.avoided,
      projectileId: null,
      position: collision.position,
    },
    hitstop: data.hitstop,
  }
  if (shouldResolveHatsu(attacker, defence)) {
    next = resolveHatsuImpact({
      state: next,
      side,
      defenderSide,
      source: attacker.attack.hatsuSource,
      blocked: defence.blocked,
      concealed: attacker.attack.concealed,
    })
  }
  return finishAfterImpact(next, side, defenderSide)
}

function spendAttacker(
  attacker: ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> },
  defence: PreparedDefence,
): ArcadeFighter {
  const spent = setIn(
    releaseFocusedAura({
      ...attacker,
      attack: {
        ...attacker.attack,
        impacted: true,
        confirmedHit: !defence.blocked && !defence.avoided,
        auraCharged: false,
      },
    }),
    false,
  )
  return attacker.attack.kind === 'special' ? spent : consumeBaton(spent)
}

function throwMisses(
  attacker: ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> },
  defender: ArcadeFighter,
): boolean {
  return attacker.attack.variant === 'throw' && throwImmune(defender)
}

function shouldResolveHatsu(
  fighter: ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> },
  defence: PreparedDefence,
): fighter is ArcadeFighter & {
  attack: NonNullable<ArcadeFighter['attack']> & { hatsuSource: NonNullable<FighterId> }
} {
  return (
    fighter.attack.kind === 'special' && Boolean(fighter.attack.hatsuSource) && !defence.avoided
  )
}

function resolveProjectileHit(state: FightState, hit: ProjectileHit): FightState {
  if (state.phase !== 'fighting') return state
  const side = hit.projectile.owner
  const attacker = state[side]
  const defender = state[hit.defenderSide]
  const defence = prepareDefence(defender, hit.projectile.targetZone)
  const damage = resolvedDamage({
    attacker,
    defence,
    base: hit.projectile.damage,
    zone: hit.projectile.targetZone,
    kind: 'ranged',
  })
  const struck = defence.avoided
    ? defence.fighter
    : strikeProjectileDefender({
        fighter: defence.fighter,
        attacker,
        projectile: hit.projectile,
        damage,
        blocked: defence.blocked,
      })
  const points = defence.avoided ? 0 : scoreForImpact(state.formatId, defence.blocked, false)
  const score = { ...state.score, [side]: state.score[side] + points }
  const next = {
    ...state,
    [side]: consumeBaton(attacker),
    [hit.defenderSide]: struck,
    score,
    hitstop: hit.projectile.hitstop,
    impact: {
      sequence: (state.impact?.sequence ?? 0) + 1,
      attacker: side,
      kind: 'ranged' as const,
      damage,
      blocked: defence.blocked,
      parried: defence.parried,
      critical: false,
      points,
      zone: hit.projectile.targetZone,
      concealed: false,
      avoided: defence.avoided,
      projectileId: hit.projectile.id,
      position: hit.position,
    },
  }
  return finishAfterImpact(next, side, hit.defenderSide)
}

interface PreparedDefence {
  fighter: ArcadeFighter
  blocked: boolean
  parried: boolean
  avoided: boolean
}

function prepareDefence(
  fighter: ArcadeFighter,
  zone: FightNenZone,
  attacker?: ArcadeFighter,
): PreparedDefence {
  const blocked = attacker
    ? blocksAttack(fighter, attacker)
    : fighter.blocking && fighter.y === GROUND
  const parried = parryActive(fighter, blocked)
  const avoided = hatsuAvoidsImpact(fighter)
  if (avoided) return { fighter: consumeHatsuAvoidance(fighter), blocked, parried, avoided }
  const defended = parried ? focusGuardRyu(fighter, zone) : fighter
  return { fighter: defended, blocked, parried, avoided }
}

function attackCanResolve(
  fighter: ArcadeFighter,
): fighter is ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> } {
  return Boolean(fighter.attack && !fighter.attack.impacted && attackPhase(fighter) === 'active')
}

function parryActive(fighter: ArcadeFighter, blocked: boolean): boolean {
  return blocked && fighter.guardFrames > 0 && fighter.guardFrames <= PARRY_WINDOW_FRAMES
}

function scoreForImpact(
  formatId: FightState['formatId'],
  blocked: boolean,
  critical: boolean,
): number {
  if (blocked) return 0
  if (fightFormat(formatId).victory === 'hits') return 1
  return critical ? 2 : 1
}

function attackCollision(attacker: ArcadeFighter, defender: ArcadeFighter) {
  const hitbox = activeHitbox(attacker)
  if (!hitbox) return null
  const hurtbox = hurtboxes(defender).find((candidate) => boxesOverlap(hitbox, candidate))
  return hurtbox ? { position: contactPoint(hitbox, hurtbox) } : null
}

interface DamageOptions {
  attacker: ArcadeFighter
  defender: ArcadeFighter
  base: number
  blocked: boolean
  zone: FightNenZone
  kind: AttackKind
}

interface ResolvedDamageOptions extends Omit<DamageOptions, 'defender' | 'blocked'> {
  defence: PreparedDefence
}

function resolvedDamage(options: ResolvedDamageOptions): number {
  if (options.defence.parried || options.defence.avoided) return 0
  return attackDamage({
    ...options,
    defender: options.defence.fighter,
    blocked: options.defence.blocked,
  })
}

function attackDamage({ attacker, defender, base, blocked, zone, kind }: DamageOptions): number {
  if (blocked && defender.nen.ken) return 0
  const guard = blocked ? 0.28 : 1
  return Math.max(
    1,
    Math.round(
      base *
        fighterDefinition(attacker.id).power *
        nenAttackFactor(attacker, kind) *
        nenDamageFactor(defender, zone) *
        hatsuDamageFactor(attacker) *
        hatsuDefenceFactor(defender) *
        guard,
    ),
  )
}

interface ProjectileStrikeOptions extends StrikeOptions {
  projectile: ProjectileHit['projectile']
}

function strikeProjectileDefender(options: ProjectileStrikeOptions): ArcadeFighter {
  const { projectile } = options
  return struckFighter({
    ...options,
    knockback: projectile.knockback,
    hitstun: projectile.hitstun,
    blockstun: projectile.blockstun,
  })
}

function finishAfterImpact(
  state: FightState,
  attackerSide: FightSide,
  defenderSide: FightSide,
): FightState {
  const durable = preserveHitFormatHealth(state, defenderSide)
  const reason = lossReason(durable, defenderSide)
  return reason ? finishFight(durable, attackerSide, reason) : durable
}

function lossReason(state: FightState, side: FightSide): Exclude<FightFinishReason, 'time'> {
  const format = fightFormat(state.formatId)
  if (format.victory !== 'hits' && state[side].health <= 0) return 'knockout'
  if (
    format.victory !== 'health' &&
    format.hitTarget !== null &&
    state.score[otherSide(side)] >= format.hitTarget
  )
    return 'hits'
  return null
}

function preserveHitFormatHealth(state: FightState, side: FightSide): FightState {
  const format = fightFormat(state.formatId)
  if (
    format.victory !== 'hits' ||
    format.hitTarget === null ||
    state.score[otherSide(side)] >= format.hitTarget ||
    state[side].health > 0
  )
    return state
  return { ...state, [side]: { ...state[side], health: 1 } }
}

interface StrikeOptions {
  fighter: ArcadeFighter
  attacker: ArcadeFighter
  damage: number
  blocked: boolean
}

function strikeDefender(options: StrikeOptions): ArcadeFighter {
  const data = attackData(options.attacker.attack?.kind ?? 'light', options.attacker)
  return struckFighter({ ...options, ...data })
}

function struckFighter(
  options: StrikeOptions & {
    knockback: number
    hitstun: number
    blockstun: number
  },
): ArcadeFighter {
  const { fighter, attacker, damage, blocked, knockback, hitstun, blockstun } = options
  const direction = fighter.x > attacker.x ? 1 : -1
  return {
    ...fighter,
    x: clamp(fighter.x + direction * knockback, MIN_X, MAX_X),
    health: Math.max(0, fighter.health - damage),
    hitStun: blocked ? 0 : hitstun,
    blockStun: blocked ? blockstun : 0,
    pose: blocked ? 'guard' : 'hit',
    blocking: blocked,
    attack: null,
    bufferedAttack: null,
  }
}

export function finishFight(
  state: FightState,
  winner: FightSide,
  finishReason: Exclude<FightFinishReason, null> = 'knockout',
): FightState {
  const loser = otherSide(winner)
  return {
    ...state,
    phase: 'finished',
    winner,
    finishReason,
    [loser]: {
      ...state[loser],
      pose: 'ko',
      blocking: false,
      attack: null,
      bufferedAttack: null,
    },
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function throwImmune(fighter: ArcadeFighter): boolean {
  return (
    fighter.y > 0 ||
    fighter.hitStun > 0 ||
    fighter.blockStun > 0 ||
    (fighter.throwTechFrames ?? 0) > 0 ||
    fighter.attack?.variant === 'throw'
  )
}

function resolveTrade(original: FightState, first: FightState): FightState {
  const second = resolveAttack(original, 'opponent')
  if (first === original || second === original) return first
  const traded: FightState = {
    ...original,
    player: tradeFighter({
      original: original.player,
      incoming: second.player,
      outgoing: first.player,
    }),
    opponent: tradeFighter({
      original: original.opponent,
      incoming: first.opponent,
      outgoing: second.opponent,
    }),
    bungeeGum: tradeAttachment(original, first, second),
    score: { player: first.score.player, opponent: second.score.opponent },
    impact: second.impact,
    hitstop: Math.max(first.hitstop, second.hitstop),
  }
  const durable = preserveHitFormatHealth(preserveHitFormatHealth(traded, 'player'), 'opponent')
  const playerLost = lossReason(durable, 'player')
  const opponentLost = lossReason(durable, 'opponent')
  const finishReason =
    playerLost === 'knockout' || opponentLost === 'knockout' ? 'knockout' : 'hits'
  if (playerLost && opponentLost)
    return { ...durable, phase: 'finished', winner: 'draw', finishReason }
  if (opponentLost) return finishFight(durable, 'player', opponentLost)
  return playerLost ? finishFight(durable, 'opponent', playerLost) : durable
}

function tradeFighter(options: {
  original: ArcadeFighter
  incoming: ArcadeFighter
  outgoing: ArcadeFighter
}): ArcadeFighter {
  const { original, incoming, outgoing } = options
  const hatsuEffects = { ...incoming.hatsuEffects }
  for (const key of Object.keys(hatsuEffects) as Array<keyof typeof hatsuEffects>) {
    if (outgoing.hatsuEffects[key] !== original.hatsuEffects[key]) {
      Object.assign(hatsuEffects, { [key]: outgoing.hatsuEffects[key] })
    }
  }
  return {
    ...incoming,
    hatsuEffects,
    nen: outgoing.nen,
    attack: null,
    aura: Math.max(0, Math.min(100, incoming.aura + outgoing.aura - original.aura)),
  }
}

function tradeAttachment(original: FightState, first: FightState, second: FightState) {
  const playerChanged = first.bungeeGum !== original.bungeeGum
  const opponentChanged = second.bungeeGum !== original.bungeeGum
  if (playerChanged && opponentChanged) return null
  return playerChanged ? first.bungeeGum : second.bungeeGum
}
