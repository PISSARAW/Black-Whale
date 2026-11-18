import { controlChest } from './fineControlAnchors'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { PhinksAccent } from './phinksAnimationClock'
import type { FightState } from './types'

/** Cache within a simulation frame; anatomical right stays right after a facing change. */
export function createPhinksAnchors(options: EffectSceneOptions) {
  const cache = new Map<string, ReturnType<typeof locate>>()
  function locate(state: FightState, event: PhinksAccent) {
    const owner = options.figureOf?.(event.owner),
      target = event.kind === 'impact' ? options.figureOf?.(event.target) : undefined
    const fighter = state[event.owner]
    const right =
      owner?.getObjectByName('hand-right')?.getWorldPosition(new options.THREE.Vector3()) ??
      new options.THREE.Vector3(
        options.worldX(fighter.x) + fighter.facing * 0.22,
        options.worldY(fighter.y) + 1.1,
        0.4,
      )
    return {
      key: `${state.frame}:${fighter.x}:${fighter.y}:${fighter.facing}:${state.player.x}:${state.opponent.x}`,
      owner,
      target,
      right,
      contact: event.kind === 'impact' ? controlChest(options, state, event.target) : right,
    }
  }
  return {
    path(state: FightState, event: PhinksAccent) {
      const next = locate(state, event),
        old = cache.get(event.id)
      if (old && old.key === next.key && old.owner === next.owner && old.target === next.target)
        return old
      cache.set(event.id, next)
      return next
    },
    retain(ids: Set<string>) {
      for (const id of cache.keys()) if (!ids.has(id)) cache.delete(id)
    },
    clear() {
      cache.clear()
    },
  }
}
