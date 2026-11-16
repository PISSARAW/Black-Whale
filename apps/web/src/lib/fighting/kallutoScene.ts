import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

/** A swirling stream of real scraps; no explosion geometry or detonation flash. */
export function createKallutoPaperScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const geometry = new THREE.BoxGeometry(0.05, 0.08, 0.012)
  const material = new THREE.MeshBasicMaterial({ color: 0xf4e9e5 })
  const group = new THREE.Group()
  group.name = 'kalluto-paper'
  const stream = Array.from({ length: 32 }, () => new THREE.Mesh(geometry, material))
  group.add(...stream)
  scene.add(group)
  return {
    sync: (state, seconds) => {
      const shots = state.projectiles.filter((shot) => shot.kallutoPaper === 'serpent')
      stream.forEach((mesh, index) => {
        const shot = shots[Math.floor(index / 16)]
        mesh.visible = Boolean(shot)
        if (!shot) return
        const trail = index % 16
        mesh.position.set(
          worldX(shot.x) - Math.sign(shot.velocityX) * trail * 0.035,
          worldY(shot.y) + Math.sin(seconds * 12 - trail * 0.5) * trail * 0.009,
          0.35,
        )
        mesh.rotation.z = seconds * 7 + index
      })
    },
    dispose: () => {
      scene.remove(group)
      geometry.dispose()
      material.dispose()
    },
  }
}
