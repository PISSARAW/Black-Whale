import { Vector3 } from 'three'
import type { VictoryActor, VictoryContext } from './types'
import { localToHead, reachVictoryHand, turnVictoryChest } from './pose'
import { reachCinematicHand } from './arm'
import { groundVictoryActor } from './actors'
import { voconteFall } from './voconteFall'
import { ease } from './resources'
import {
  VOCONTE_FALL,
  VOCONTE_LANDING,
  voconteDoorAngle,
  voconteHandle,
  voconteHeroFacing,
  voconteHeroMoving,
  voconteHeroTrack,
  voconteLayout,
  voconteVictimTrack,
} from './voconteTrack'

function stride(actor: VictoryActor, age: number, weight: number) {
  for (const [i, side] of ['left', 'right'].entries()) {
    const leg = Math.sin(age * 0.23 + i * Math.PI) * 0.45 * weight
    actor.root.getObjectByName(`hip-${side}`)!.rotation.x = leg
    actor.root.getObjectByName(`knee-${side}`)!.rotation.x = Math.max(0, -leg) * 1.2
  }
  groundVictoryActor(actor)
}
function arms(actor: VictoryActor, panic: number) {
  return (['left', 'right'] as const).map((side) => {
    const sign = side === 'left' ? -1 : 1
    const target = localToHead(
      actor,
      new Vector3(
        sign * actor.width * (0.35 + panic * 0.2),
        -actor.height * (0.3 - panic * 0.1),
        actor.width * 0.4,
      ),
    )
    return reachCinematicHand(actor.root, {
      side,
      target,
      pole: localToHead(actor, new Vector3(sign * 0.5, -0.45, 0.15)),
    })
  })
}
export function voconteVictoryPose(context: VictoryContext) {
  const { hero, victim } = context
  const age = Math.round(context.age * 1e6) / 1e6,
    layout = voconteLayout(context)
  const closing = ease((age - 396) / 24) * (1 - ease((age - 468) / 24))
  const angle = voconteDoorAngle(age)
  const track = voconteVictimTrack(age, layout),
    heroTrack = voconteHeroTrack(age, layout)
  victim.root.position.set(track.x, 0, 0)
  victim.root.rotation.y = track.facing
  victim.root.visible = !track.hidden
  stride(victim, age, ease((age - 60) / 12) * (1 - ease((age - 156) / 12)))
  const victimArms = age < VOCONTE_FALL ? arms(victim, ease((age - 162) / 18)) : []
  victim.root.position.y += track.y
  hero.root.position.set(heroTrack.x, 0, heroTrack.z)
  hero.root.rotation.y = voconteHeroFacing(age)
  hero.root.visible = !heroTrack.hidden
  const moving = voconteHeroMoving(age)
  stride(hero, age, moving ? 0.7 : 0)
  turnVictoryChest(context, hero, [0, 0, closing * 0.35 * (1 - (2 * angle) / 1.4)])
  const heroArms = arms(hero, 0)
  hero.root.position.y += heroTrack.y
  hero.head.rotation.y = -0.25 * ease((age - 168) / 18) * (1 - ease((age - 210) / 18))
  const handle = voconteHandle(layout, angle)
  const opening = 1 - ease((age - 36) / 12)
  if (age < 48)
    heroArms[1] = reachVictoryHand(context, {
      side: 'right',
      target: localToHead(hero, new Vector3(0.2, -0.5, 0.3)).lerp(handle, opening),
    })
  if (age >= 396)
    heroArms[0] = reachVictoryHand(context, {
      side: 'left',
      target: localToHead(hero, new Vector3(-0.2, -0.5, 0.3)).lerp(handle, closing),
    })
  if (age >= VOCONTE_FALL) victim.root.position.y -= layout.elevation
  const fall = age >= VOCONTE_FALL ? voconteFall({ ...context, age }, layout) : undefined
  hero.root.updateWorldMatrix(true, true)
  victim.root.updateWorldMatrix(true, true)
  return {
    layout,
    track,
    heroTrack,
    angle,
    handle,
    fall,
    grips: [...heroArms, ...victimArms],
    face: localToHead(victim, new Vector3(0, 0.02, 0.13)),
    landingFrame: fall ? VOCONTE_LANDING : undefined,
  }
}
export type VoconteVictoryPose = ReturnType<typeof voconteVictoryPose>
