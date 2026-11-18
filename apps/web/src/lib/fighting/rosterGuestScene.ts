import { createHanzoProjectionScene, type ProjectionSceneOptions } from './hanzoProjectionScene'
import { fightWorldY } from './fightCoordinates'
import { disposeMountedVisitHatsu } from './visitHatsuModel'
import { FIGHT_MODEL_POSES } from './sceneMotion'
import type { FightState } from './types'

export function createExtraBodyScenes(options: ProjectionSceneOptions) {
  const sleeping = createHanzoProjectionScene(options)
  const guests = new Map<
    string,
    { model: ReturnType<ProjectionSceneOptions['buildFighter']>; identity: string }
  >()
  function drawGuest(guest: NonNullable<FightState['rosterGuests']>[number], seconds: number) {
    if (guest.phase === 'eliminated' && guest.fighter.health > 0) return
    const identity = `${guest.fighter.id}:${guest.fighter.kurapika?.held?.source ?? ''}`
    let held = guests.get(guest.id)
    if (!held || held.identity !== identity) {
      if (held) {
        disposeMountedVisitHatsu(held.model.root)
        options.scene.remove(held.model.root)
      }
      held = { model: options.buildFighter(guest.fighter), identity }
      held.model.root.name = `roster-guest:${guest.id}`
      options.scene.add(held.model.root)
      guests.set(guest.id, held)
    }
    held.model.root.visible = true
    held.model.root.position.set(options.worldX(guest.fighter.x), fightWorldY(guest.fighter.y), 0.1)
    held.model.root.rotation.y = guest.fighter.facing * 1.25
    held.model.animate(
      seconds,
      guest.fighter.health <= 0 ? 'fallen' : FIGHT_MODEL_POSES[guest.fighter.pose],
    )
  }
  return {
    sync(state: FightState, seconds: number) {
      sleeping.sync(state, seconds)
      guests.forEach(({ model }) => {
        model.root.visible = false
      })
      for (const guest of state.rosterGuests ?? []) drawGuest(guest, seconds)
    },
    dispose() {
      sleeping.dispose()
      guests.forEach(({ model }) => {
        disposeMountedVisitHatsu(model.root)
        options.scene.remove(model.root)
      })
      guests.clear()
    },
  }
}

export { createExtraBodyScenes as createHanzoProjectionScene }
export { projectionCameraSpan } from './hanzoProjectionScene'
