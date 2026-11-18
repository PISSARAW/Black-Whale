import { controlChest } from './fineControlAnchors'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { SweetHomeAccent } from './sweetHomePresentation'
import type { FightSide, FightState } from './types'
import type { Object3D, Vector3 } from 'three'

interface AnchorKey {
  key: string
  owner: Object3D | undefined
  source: Object3D | undefined
  target: Object3D | undefined
}
export interface SweetHomePath {
  points: Vector3[]
  right: Vector3
  left: Vector3
}
function same(a: AnchorKey, b: AnchorKey) {
  return a.key === b.key && a.owner === b.owner && a.source === b.source && a.target === b.target
}
/** Anatomical hands do not swap with the actor's facing. */
function hand(
  options: EffectSceneOptions,
  c: { state: FightState; side: FightSide; hand: 'left' | 'right' },
) {
  const joint = options.figureOf?.(c.side)?.getObjectByName(`hand-${c.hand}`)
  const fighter = c.state[c.side]
  return (
    joint?.getWorldPosition(new options.THREE.Vector3()) ??
    new options.THREE.Vector3(
      options.worldX(fighter.x) + fighter.facing * (c.hand === 'right' ? 0.22 : -0.12),
      options.worldY(fighter.y) + 1.1,
      c.hand === 'right' ? 0.4 : 0.5,
    )
  )
}
function targetObject(options: EffectSceneOptions, event: SweetHomeAccent) {
  return event.recipient.kind === 'body'
    ? options.figureOf?.(event.recipient.side)
    : options.scene.getObjectByName(`prepared:${event.recipient.id}`)
}
function destination(
  options: EffectSceneOptions,
  c: { state: FightState; event: SweetHomeAccent; left: Vector3 },
) {
  const { event, state, left } = c
  if (event.backlash) return left.clone()
  if (event.recipient.kind === 'body') return controlChest(options, state, event.recipient.side)
  const target = targetObject(options, event)
  return (
    target?.localToWorld(new options.THREE.Vector3(0, 0.38, 0.35)) ??
    new options.THREE.Vector3(
      options.worldX(event.recipient.x),
      options.worldY(event.recipient.y) + 0.38,
      0.7,
    )
  )
}
export function createSweetHomeAnchors(options: EffectSceneOptions) {
  const cache = new Map<string, { observed: AnchorKey; path: SweetHomePath }>()
  return {
    path(state: FightState, event: SweetHomeAccent): SweetHomePath {
      const observed = {
        key: `${state.frame}:${state.player.x}:${state.player.y}:${state.player.facing}:${state.opponent.x}:${state.opponent.y}:${state.opponent.facing}`,
        owner: options.figureOf?.(event.owner),
        source: options.figureOf?.(event.from),
        target: targetObject(options, event),
      }
      const old = cache.get(event.id)
      if (old && same(old.observed, observed)) return old.path
      const right = hand(options, { state, side: event.owner, hand: 'right' })
      const left = hand(options, { state, side: event.owner, hand: 'left' })
      const points = [controlChest(options, state, event.from)]
      if (event.from !== event.owner) points.push(right)
      points.push(left, destination(options, { state, event, left }))
      const path = { points, right, left }
      cache.set(event.id, { observed, path })
      return path
    },
    retain(ids: Set<string>) {
      for (const id of cache.keys()) if (!ids.has(id)) cache.delete(id)
    },
    clear() {
      cache.clear()
    },
  }
}
