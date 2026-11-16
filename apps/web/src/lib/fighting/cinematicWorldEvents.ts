import type { PreparedEntity } from './preparationTypes'
import { rig, node, point } from './cinematicRules'
import type { CameraSnapshot } from './cinematicSnapshot'
import type { CameraAnchor, CameraEvent } from './cinematicTypes'
import type { FightSide, FightState } from './types'

function event(
  state: FightState,
  options: {
    id: string
    side: FightSide
    fr: string
    en: string
    anchors: CameraAnchor[]
    priority?: number
  },
): CameraEvent {
  return {
    cue: { frame: state.frame, side: options.side, strength: 1, hold: 22, release: 44 },
    detail: {
      kind: 'focus',
      side: options.side,
      labelFr: options.fr,
      labelEn: options.en,
      anchors: options.anchors,
      eventId: options.id,
    },
    duration: 48,
    priority: options.priority ?? 2,
  }
}
function objectEvents(state: FightState, before: CameraSnapshot): CameraEvent[] {
  return (state.battlefield?.entities ?? []).flatMap((e) => {
    if (!e.arena) return []
    const old = before.entities.find((p) => p.id === e.id)
    if (!old) return []
    const side = e.arena.sun ?? e.arena.moon ?? closestActor(state, e.x)
    const anchors: CameraAnchor[] = [{ type: 'entity', id: e.id, x: e.x, y: e.y }]
    const output: CameraEvent[] = []
    if (old.health > 0 && e.health <= 0)
      output.push(
        event(state, {
          id: `arena.destroy:${e.id}`,
          side,
          fr: 'Arène · Couvert détruit',
          en: 'Arena · Cover destroyed',
          anchors,
          priority: 2.5,
        }),
      )
    output.push(...markEvents(state, { e, old, anchors }))
    if (e.arena.burning && !old.burning)
      output.push(
        event(state, {
          id: `arena.burn:${e.id}`,
          side,
          fr: 'Great Hiker · Couvert en flammes',
          en: 'Great Hiker · Burning cover',
          anchors,
        }),
      )
    return output
  })
}
function markEvents(
  state: FightState,
  {
    e,
    old,
    anchors,
  }: { e: PreparedEntity; old: CameraSnapshot['entities'][number]; anchors: CameraAnchor[] },
): CameraEvent[] {
  const output: CameraEvent[] = []
  if (e.arena!.sun !== old.sun && e.arena!.sun)
    output.push(
      event(state, {
        id: `arena.sun:${e.id}`,
        side: e.arena!.sun,
        fr: 'Sun and Moon · Objet marqué du Soleil',
        en: 'Sun and Moon · Object marked with Sun',
        anchors,
      }),
    )
  if (e.arena!.moon !== old.moon && e.arena!.moon)
    output.push(
      event(state, {
        id: `arena.moon:${e.id}`,
        side: e.arena!.moon,
        fr: 'Sun and Moon · Objet marqué de Lune',
        en: 'Sun and Moon · Object marked with Moon',
        anchors,
      }),
    )
  return output
}
function closestActor(state: FightState, x: number): FightSide {
  return Math.abs(state.player.x - x) < Math.abs(state.opponent.x - x) ? 'player' : 'opponent'
}
function tetherSubject(state: FightState, id: string, side: FightSide): CameraAnchor[] {
  const e = state.battlefield?.entities.find((e) => e.id === id)
  return e ? [rig(side, 'hands'), { type: 'entity', id, x: e.x, y: e.y }] : [rig(side, 'hands')]
}
function tetherPhase(t: { pulling: boolean } | undefined): [string, string] {
  if (!t) return ['Lien rompu', 'Broken link']
  return t.pulling ? ['Traction', 'Pull'] : ['Ancrage', 'Anchor']
}
function tetherChanged(
  old: CameraSnapshot['tether'][number],
  t: { objectId: string; pulling: boolean } | undefined,
): boolean {
  return old.object !== t?.objectId || old.pulling !== Boolean(t?.pulling)
}
function tetherEvents(state: FightState, before: CameraSnapshot): CameraEvent[] {
  return (['player', 'opponent'] as const).flatMap((side, index) => {
    const t = state.arena?.tether[side]
    const old = before.tether[index]
    const id = t?.objectId ?? old.object
    if (!id || !tetherChanged(old, t)) return []
    const name = (t?.kind ?? old.kind) === 'gum' ? 'Bungee Gum' : 'Fils de Nen'
    const [fr, en] = tetherPhase(t)
    return [
      event(state, {
        id: `arena.tether:${side}`,
        side,
        fr: `${name} · ${fr}`,
        en: `${name} · ${en}`,
        anchors: tetherSubject(state, id, side),
      }),
    ]
  })
}
function movementEvents(state: FightState, before: CameraSnapshot): CameraEvent[] {
  return (['player', 'opponent'] as const).flatMap((side, index) => {
    const f = state[side]
    const old = before.actors[index]
    if (
      Math.abs(f.x - old.x) < Math.max(5, (state.frame - before.frame + 1) * 2.5) ||
      !state.battlefield?.luiniAnchors?.[side]
    )
      return []
    // A legitimate Luini transit is discontinuous; ordinary walking and knockback are not.
    if (f.motion?.dash || f.hitStun || f.attack) return []
    return [
      event(state, {
        id: `luini.transit:${side}`,
        side,
        fr: 'Téléportation · Arrivée',
        en: 'Teleportation · Arrival',
        anchors: [point(old.x, old.y + 7), rig(side)],
        priority: 2.5,
      }),
    ]
  })
}
function supporterEvents(state: FightState, before: CameraSnapshot): CameraEvent[] {
  return (state.battlefield?.entities ?? []).flatMap((e) => {
    const old = before.entities.find((p) => p.id === e.id)
    if (e.kind !== 'supporter' || !e.sleepingFrames || old?.sleeping || e.owner === 'neutral')
      return []
    return [
      event(state, {
        id: `halkenburg.supporter:${e.id}`,
        side: e.owner,
        fr: 'Grimmel · Partisan endormi',
        en: 'Grimmel · Sleeping supporter',
        anchors: [node(`prepared:${e.id}`, point(e.x, e.y + 7), 1.8)],
        priority: 2.5,
      }),
    ]
  })
}
function projectionPassEvents(state: FightState, before: CameraSnapshot): CameraEvent[] {
  return (['player', 'opponent'] as const).flatMap((side, index) => {
    const f = state[side]
    const old = before.actors[index]
    if (!f.hanzoProjection || !old.projection) return []
    const e = state.battlefield?.entities.find(
      (e) => e.arena && e.health > 0 && (old.x - e.x) * (f.x - e.x) <= 0 && old.x !== f.x,
    )
    return e
      ? [
          event(state, {
            id: `hanzo.cover:${side}:${e.id}`,
            side,
            fr: 'Hanzo Skill 4 · Traversée',
            en: 'Hanzo Skill 4 · Traversal',
            anchors: [point(e.x, e.y + 7), rig(side)],
          }),
        ]
      : []
  })
}
export function cinematicWorldEvents(state: FightState, before: CameraSnapshot): CameraEvent[] {
  return [
    ...objectEvents(state, before),
    ...tetherEvents(state, before),
    ...movementEvents(state, before),
    ...supporterEvents(state, before),
    ...projectionPassEvents(state, before),
  ]
}
