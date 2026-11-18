import { gumObjectAnchors, gumObjectAnchorTarget } from './gumObjectAnchors'
import { gyoSight } from './nenPerception'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'
import type { GumObjectAnchor } from './gumObjectAnchors'

export function createGumObjectAnchorScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const material = new THREE.LineBasicMaterial({ color: 0xf06bb5, transparent: true, opacity: 0.8 })
  const lines = new Map<string, import('three').Line>()
  return {
    sync(state: FightState) {
      const visible = new Set<string>()
      for (const side of ['player', 'opponent'] as const)
        for (const anchor of gumObjectAnchors(state[side])) {
          const id = syncAnchor(state, side, anchor)
          if (id) visible.add(id)
        }
      for (const [id, line] of lines) {
        if (visible.has(id)) continue
        scene.remove(line)
        line.geometry.dispose()
        lines.delete(id)
      }
    },
    dispose() {
      for (const line of lines.values()) {
        scene.remove(line)
        line.geometry.dispose()
      }
      lines.clear()
      material.dispose()
    },
  }

  function syncAnchor(
    state: FightState,
    side: FightSide,
    anchor: GumObjectAnchor,
  ): string | undefined {
    const viewer = options.viewer?.() ?? 'player'
    const entry = gumObjectAnchorTarget(state, anchor.objectId)
    if (!entry || (anchor.hidden && viewer !== side && !gyoSight(state[viewer]))) return undefined
    const id = `gum-object:${side}:${anchor.objectId}`
    let line = lines.get(id)
    if (!line) {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(25 * 3), 3))
      line = new THREE.Line(geometry, material)
      line.name = id
      line.frustumCulled = false
      lines.set(id, line)
      scene.add(line)
    }
    const body = state[side]
    const positions = line.geometry.attributes.position
    for (let index = 0; index < 25; index++) {
      const ratio = index / 24
      positions.setXYZ(
        index,
        worldX(body.x + (entry.x - body.x) * ratio),
        worldY(body.y + 6 + (entry.y + entry.arena!.height / 2 - body.y - 6) * ratio) -
          Math.sin(ratio * Math.PI) * 0.08,
        0.5,
      )
    }
    positions.needsUpdate = true
    return id
  }
}
