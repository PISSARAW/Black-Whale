import type { FightState } from './types'

/** Optional probe set by the qualification fixture; describes the state actually posed before drawing. */
export function markFightRender(scene: { userData: Record<string, unknown> }, state: FightState) {
  if (!scene.userData.measureFight) return
  scene.userData.drawnFight = {
    frame: state.frame,
    player: state.player.id,
    moveId: state.player.attack?.moveId ?? null,
    attackFrame: state.player.attack?.frame ?? null,
  }
}
