import * as THREE from 'three'
import type { FighterId } from '../../src/lib/fighting/types'
import type { FightStageId } from '../../src/lib/fighting/stages'
import { buildFightScenery } from '../../src/lib/fighting/stageScenery'
import { createFightRenderResources } from '../../src/lib/fighting/fightRenderer'
import { createNobunagaVictory } from '../../src/lib/fighting/victory/nobunaga'
import { resetVictoryActor, groundVictoryActor } from '../../src/lib/fighting/victory/actors'
import { victoryTransaction } from '../../src/lib/fighting/victory/transaction'
import { victoryLighting } from '../../src/lib/fighting/victory/lighting'
import { defaultFightComfort } from '../../src/lib/fighting/fightComfort'
import { createNobunagaFatalityActors } from './nobunagaFatalityActors'

export async function createNobunagaFatalityScene(options: {
  canvas: HTMLCanvasElement
  target: FighterId | 'nobunaga'
  stageId: FightStageId
  reduced: boolean
}) {
  const resources = createFightRenderResources(THREE, options.canvas)
  const { renderer } = resources
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.05, 50)
  const scenery = await buildFightScenery(
    { THREE, glow: resources.glow, geometry: resources.geometry },
    options.stageId,
  )
  const actors = createNobunagaFatalityActors({ glow: resources.glow, target: options.target })
  scene.add(scenery.root, actors.hero.root, actors.victim.root)
  const victory = createNobunagaVictory(),
    lighting = victoryLighting()
  let last: ReturnType<typeof victory.update> | null = null
  const comfort = {
    ...defaultFightComfort(),
    camera: options.reduced ? 0 : 1,
    shake: 0,
    flashes: !options.reduced,
  }
  function draw(age: number) {
    const size = options.canvas.getBoundingClientRect()
    renderer.setSize(size.width, size.height, false)
    camera.aspect = size.width / size.height
    camera.updateProjectionMatrix()
    const transaction = victoryTransaction(camera)
    try {
      resetVictoryActor(actors.hero, transaction.save)
      resetVictoryActor(actors.victim, transaction.save)
      actors.hero.root.position.set(-2, 0, 0)
      actors.victim.root.position.set(3, 0, 0)
      actors.hero.root.rotation.set(0, 0, 0)
      actors.victim.root.rotation.set(0, 0, 0)
      groundVictoryActor(actors.hero)
      groundVictoryActor(actors.victim)
      lighting.apply(scenery.root, transaction)
      last = victory.update({
        ...actors,
        scene,
        camera,
        age,
        centre: 0,
        gap: 5,
        comfort,
        save: transaction.save,
        material: transaction.material,
        defer: transaction.defer,
        add(root) {
          scene.add(root)
          root.updateWorldMatrix(true, true)
          transaction.defer(() => root.removeFromParent())
        },
      })
      renderer.render(scene, camera)
    } finally {
      transaction.restore()
    }
  }
  draw(0)
  return {
    draw,
    audit: () => last,
    dispose() {
      victory.dispose()
      lighting.dispose()
      scenery.dispose()
      const materials = new Set<THREE.Material>()
      for (const actor of Object.values(actors))
        actor.root.traverse((node) => {
          if (node instanceof THREE.Mesh)
            (Array.isArray(node.material) ? node.material : [node.material]).forEach((material) =>
              materials.add(material),
            )
        })
      materials.forEach((material) => material.dispose())
      resources.dispose()
    },
  }
}
