import type { FightImpact, FightProjectile, FightState, ProjectileShape } from '../types'

interface SoundContact {
  serial: number
  frame: number
  impact: FightImpact
  moveId?: string
  shape?: ProjectileShape
}

declare module '../types' {
  interface FightState {
    audioContacts?: readonly SoundContact[]
  }
}

export function retainSoundContacts(
  before: FightState,
  after: FightState,
  options: { simultaneous?: FightState; projectile?: Pick<FightProjectile, 'id' | 'shape'> } = {},
): FightState {
  if (after.forecastSimulation || (before.impact === after.impact && !options.simultaneous))
    return after
  const { simultaneous, projectile } = options
  const history = after.audioContacts ?? []
  const fresh = freshImpacts(before, after, simultaneous)
  if (!fresh.length) return after
  let serial = history.at(-1)?.serial ?? 0
  const contacts = fresh.map((impact) => ({
    serial: ++serial,
    frame: after.frame,
    impact,
    moveId: impact.projectileId == null ? before[impact.attacker].attack?.moveId : undefined,
    shape: impactProjectileShape(impact, projectile),
  }))
  return { ...after, audioContacts: [...history, ...contacts].slice(-24) }
}

function impactProjectileShape(
  impact: FightImpact,
  projectile?: Pick<FightProjectile, 'id' | 'shape'>,
) {
  return projectile && projectile.id === impact.projectileId ? projectile.shape : undefined
}

function freshImpacts(before: FightState, after: FightState, simultaneous?: FightState) {
  const impacts = simultaneous ? [simultaneous.impact, after.impact] : [after.impact]
  const lastSequence = simultaneous ? undefined : after.audioContacts?.at(-1)?.impact.sequence
  const previousImpact = before.impact?.sequence
  return impacts.filter((impact): impact is FightImpact =>
    Boolean(impact && impact.sequence !== previousImpact && impact.sequence !== lastSequence),
  )
}

export function newSoundContacts(before: FightState, after: FightState) {
  const cursor = before.audioContacts?.at(-1)?.serial ?? 0
  return (after.audioContacts ?? []).filter(
    (contact) => contact.serial > cursor && after.frame - contact.frame <= 30,
  )
}
