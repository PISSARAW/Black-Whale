import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightState } from './types'

/** The visible line and target loop use the exact link that maintains the bind. */
export function createMachiThreadScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const material = new THREE.LineBasicMaterial({ color: 0xf69ccd, transparent: true, opacity: 0.8 })
  const needleGeometry = new THREE.BoxGeometry(0.025, 0.2, 0.025)
  const needleMaterial = new THREE.MeshBasicMaterial({ color: 0xe5e7eb })
  const needles = (['player', 'opponent'] as const).map((side) => {
    const geometry = new THREE.BufferGeometry()
    const line = new THREE.Line(geometry, material)
    const needle = new THREE.Mesh(needleGeometry, needleMaterial)
    scene.add(line, needle)
    return { side, geometry, line, needle }
  })
  return {
    sync: (state: FightState) => {
      for (const entry of needles) {
        const target = state[entry.side]
        const thread = target.machiThread
        entry.line.visible = Boolean(thread)
        entry.needle.visible = Boolean(thread)
        if (!thread) continue
        const owner = state[thread.owner]
        entry.line.visible = thread.owner === 'player' || !owner.nen.in || state.player.nen.gyo
        const y = worldY(target.y) + 1.05
        const points = [
          new THREE.Vector3(worldX(owner.x) + owner.facing * 0.18, worldY(owner.y) + 1.1, 0.32),
        ]
        const turns = thread.kind === 'bind' ? 2 : 0
        for (let i = 0; i <= 32; i++) {
          const angle = (i / 32) * Math.PI * 2 * turns
          points.push(
            new THREE.Vector3(
              worldX(target.x) + Math.sin(angle) * 0.22,
              y + (turns ? (i / 32 - 0.5) * 0.45 : 0),
              0.3 + Math.cos(angle) * 0.16,
            ),
          )
        }
        entry.geometry.setFromPoints(points)
        entry.needle.position.set(worldX(target.x), y, 0.5)
      }
    },
    dispose: () => {
      for (const entry of needles) {
        scene.remove(entry.line, entry.needle)
        entry.geometry.dispose()
      }
      needleGeometry.dispose()
      needleMaterial.dispose()
      material.dispose()
    },
  }
}
