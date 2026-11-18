import { controlChest, controlHand } from './fineControlAnchors'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

export function createMachiObjectScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const material = new THREE.LineBasicMaterial({ color: '#f69ccd' })
  const lines = (['player', 'opponent'] as const).map((side) => {
    const line = new THREE.Line(new THREE.BufferGeometry(), material)
    line.name = `machi-material-thread:${side}`
    scene.add(line)
    return { side, line }
  })
  function draw(state: FightState, side: FightSide, line: import('three').Line) {
    const actor = state[side],
      anchor = actor.machiAnchor,
      suture = actor.machiSuture
    const object = state.battlefield?.entities.find(
      (entry) => entry.id === anchor?.objectId && entry.present && entry.health > 0,
    )
    line.visible = Boolean(suture || (anchor?.attached && object))
    if (!line.visible) return
    const end = suture
      ? controlChest(options, state, suture.target)
      : new THREE.Vector3(options.worldX(object!.x), options.worldY(object!.y + 4), 0.3)
    const start = controlHand(options, state, side)
    const points = [start]
    if (suture)
      for (let i = 0; i < 16; i++)
        points.push(end.clone().add(new THREE.Vector3(Math.sin(i) * 0.08, (i / 16 - 0.5) * 0.2, 0)))
    points.push(end)
    line.geometry.setFromPoints(points)
    line.geometry.computeBoundingSphere()
  }
  return {
    sync(state) {
      lines.forEach(({ side, line }) => draw(state, side, line))
    },
    dispose() {
      lines.forEach(({ line }) => {
        scene.remove(line)
        line.geometry.dispose()
      })
      material.dispose()
    },
  }
}
