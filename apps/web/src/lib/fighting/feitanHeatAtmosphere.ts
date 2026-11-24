import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** Stage-wide heat wash, rising distortion bands and embers for Rising Sun. */
export function createFeitanHeatAtmosphere(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const groups = new Map<FightSide, import('three').Group>()
  const geometries: import('three').BufferGeometry[] = []
  const materials: import('three').Material[] = []

  for (const side of ['player', 'opponent'] as const) {
    const group = new THREE.Group()
    group.name = `rising-sun-atmosphere:${side}`
    const washMaterial = new THREE.MeshBasicMaterial({
      color: 0x9d1d08,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    })
    const washGeometry = new THREE.PlaneGeometry(15, 8)
    const wash = new THREE.Mesh(washGeometry, washMaterial)
    wash.position.set(0, 3.2, -1.1)
    group.add(wash)
    geometries.push(washGeometry)
    materials.push(washMaterial)
    for (let i = 0; i < 6; i++) {
      const geometry = new THREE.TorusGeometry(0.55 + i * 0.18, 0.008, 5, 48)
      const material = new THREE.MeshBasicMaterial({
        color: i % 2 ? 0xff5b17 : 0xffb13b,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const band = new THREE.Mesh(geometry, material)
      band.name = 'rising-sun-heat-band'
      band.position.y = 0.28 + i * 0.34
      band.scale.y = 0.25
      group.add(band)
      geometries.push(geometry)
      materials.push(material)
    }
    const emberGeometry = new THREE.IcosahedronGeometry(0.018, 0)
    const emberMaterial = new THREE.MeshBasicMaterial({ color: 0xff7a21 })
    geometries.push(emberGeometry)
    materials.push(emberMaterial)
    for (let i = 0; i < 28; i++) {
      const ember = new THREE.Mesh(emberGeometry, emberMaterial)
      ember.name = 'rising-sun-ember'
      ember.userData.seed = i / 28
      group.add(ember)
    }
    group.visible = false
    scene.add(group)
    groups.set(side, group)
  }

  return {
    sync(state: FightState, seconds: number) {
      for (const [side, group] of groups) {
        const sun = state[side].hatsuEffects.painPacker?.sun
        group.visible = Boolean(sun) && state.phase === 'fighting'
        if (!sun) continue
        group.position.x = options.worldX(sun.x)
        group.children.forEach((node, index) => {
          if (node.name === 'rising-sun-heat-band') {
            const pulse = 1 + Math.sin(seconds * 7 + index) * 0.08
            node.scale.x = pulse * (1 + sun.radius * 0.025)
            node.position.y = 0.3 + ((seconds * 0.38 + index * 0.31) % 2.8)
          }
          if (node.name === 'rising-sun-ember') {
            const seed = node.userData.seed as number
            node.position.set(
              Math.sin(seed * 41 + seconds * 0.7) * (1.2 + sun.radius * 0.035),
              (seed * 5.3 + seconds * (0.7 + seed)) % 4.4,
              0.15 + Math.cos(seed * 29) * 0.28,
            )
          }
        })
      }
    },
    dispose() {
      groups.forEach((group) => scene.remove(group))
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      groups.clear()
    },
  }
}
