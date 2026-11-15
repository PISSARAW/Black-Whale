import { buildHeavensArenaScenery } from './stageHeavensArena'
import type { FightScenery, SceneryKit } from './stageKit'
import { fightStage, type FightStageId } from './stages'

export type { FightScenery, SceneryKit } from './stageKit'

/** The backdrop Clash shipped with: the ribs of the hull and one porthole. */
function buildHoldScenery(kit: SceneryKit): FightScenery {
  const { THREE, glow, geometry } = kit
  const root = new THREE.Group()

  const floor = new THREE.Mesh(geometry(new THREE.PlaneGeometry(16, 7)), glow(0x0b1015, 1))
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, -0.02, 1.15)
  root.add(floor)

  const wall = new THREE.Mesh(geometry(new THREE.PlaneGeometry(18, 7)), glow(0x091821, 1))
  wall.position.set(0, 2.75, -2.2)
  root.add(wall)

  for (const x of [-5.2, -2.6, 0, 2.6, 5.2]) {
    const rib = new THREE.Mesh(
      geometry(new THREE.TorusGeometry(3.7, 0.055, 7, 28, Math.PI)),
      glow(0x516875, 0.28),
    )
    rib.position.set(x, 3.65, -1.95)
    rib.rotation.z = Math.PI / 2
    rib.scale.set(1, 0.72, 1)
    root.add(rib)
  }

  const windowRing = new THREE.Mesh(
    geometry(new THREE.TorusGeometry(1.25, 0.1, 10, 42)),
    glow(0x59717f, 0.78),
  )
  windowRing.position.set(0, 3.05, -2.05)
  root.add(windowRing)
  const windowGlass = new THREE.Mesh(
    geometry(new THREE.CircleGeometry(1.16, 42)),
    glow(0x0e3d50, 0.84),
  )
  windowGlass.position.set(0, 3.05, -2.08)
  root.add(windowGlass)

  const stripeMaterial = glow(0xd2a52d, 0.55)
  for (let x = -7; x <= 7; x += 0.6) {
    const stripe = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.28, 0.018, 1.1)), stripeMaterial)
    stripe.position.set(x, 0.012, -0.9)
    stripe.rotation.y = -0.5
    root.add(stripe)
  }

  return {
    root,
    fog: { colour: 0x05090d, near: 8, far: 18 },
    cameraFar: 30,
    clipped: false,
    dispose: () => undefined,
  }
}

/**
 * Fetches a ship room's code and the blueprint ahead of the duel.
 *
 * Called when a stage is picked, so the wait is spent on the selection screen
 * rather than on a black arena after the fighters are announced.
 */
export function preloadFightStage(stageId: FightStageId): void {
  if (fightStage(stageId).kind === 'ship-room') void import('./stageShipRoom')
}

/**
 * Raises the scenery of one stage.
 *
 * The ship rooms are imported on demand: they bring the blueprint and the
 * visit's mesh builder with them, which the two authored stages never need.
 */
export async function buildFightScenery(
  kit: SceneryKit,
  stageId: FightStageId,
): Promise<FightScenery> {
  const stage = fightStage(stageId)
  if (stage.kind === 'heavens-arena') return buildHeavensArenaScenery(kit)
  if (stage.kind === 'ship-room' && stage.spaceId) {
    const { buildShipRoomScenery } = await import('./stageShipRoom')
    return buildShipRoomScenery(kit, stage.spaceId)
  }
  return buildHoldScenery(kit)
}
