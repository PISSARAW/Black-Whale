import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { BiohazardDevice } from './biohazardDevices'

/** The cat lens, gun barrel and transmitter shells remain visible material objects. */
export function createBiohazardDeviceScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const models = new Map<string, import('three').Group>()
  const material = new THREE.MeshStandardMaterial({ color: '#b1a58b', roughness: 0.7 })
  const dark = new THREE.MeshStandardMaterial({ color: '#202c2c', metalness: 0.5 })
  const glass = new THREE.MeshStandardMaterial({ color: '#73d6c0', metalness: 0.8 })
  const geometry: import('three').BufferGeometry[] = []
  function mesh(shape: import('three').BufferGeometry, metal = false) {
    geometry.push(shape)
    return new THREE.Mesh(shape, metal ? dark : material)
  }
  function model(item: BiohazardDevice): import('three').Group {
    const root = new THREE.Group()
    root.name = `biohazard-${item.kind}`
    root.userData.form = item.phase === 'dropped' ? 'object' : 'animal'
    if (item.phase === 'dropped') {
      const body = mesh(new THREE.BoxGeometry(item.kind === 'gun' ? 0.12 : 0.32, 0.2, 0.15), true)
      root.add(body)
      if (item.kind === 'transmitter') {
        const antenna = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 6), true)
        antenna.position.set(0.1, 0.2, 0)
        root.add(antenna)
      } else {
        const barrel = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 10), true)
        barrel.rotation.z = Math.PI / 2
        barrel.position.x = 0.17
        root.add(barrel)
      }
    } else if (item.kind === 'camera') {
      const body = mesh(new THREE.SphereGeometry(0.24, 12, 8))
      body.scale.set(1.4, 0.75, 0.7)
      const head = mesh(new THREE.SphereGeometry(0.14, 12, 8))
      head.position.set(0.25, 0.12, 0)
      const lens = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.1, 12), true)
      lens.rotation.x = Math.PI / 2
      lens.position.set(0.25, 0.12, 0.13)
      lens.material = glass
      root.add(body, head, lens)
      for (const x of [0.17, 0.32]) {
        const ear = mesh(new THREE.ConeGeometry(0.06, 0.15, 4))
        ear.position.set(x, 0.28, 0)
        root.add(ear)
      }
    } else if (item.kind === 'gun') {
      const barrel = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 10), true)
      barrel.rotation.z = Math.PI / 2
      const neck = mesh(new THREE.TorusGeometry(0.16, 0.055, 7, 16, Math.PI))
      const head = mesh(new THREE.SphereGeometry(0.1, 10, 8))
      head.position.set(0.16, 0.14, 0)
      root.add(barrel, neck, head)
    } else {
      for (const sign of [-1, 1]) {
        const shell = mesh(new THREE.SphereGeometry(0.16, 12, 8))
        shell.scale.set(1.5, 0.3, 1)
        shell.position.y = sign * 0.035
        shell.rotation.z = sign * 0.15
        root.add(shell)
      }
    }
    scene.add(root)
    return root
  }
  function syncItem(side: import('./types').FightSide, item: BiohazardDevice, seconds: number) {
    if (item.phase === 'carried' || item.phase === 'broken' || item.swallowed) return
    const key = `${side}:${item.id}:${item.phase === 'dropped' ? 'object' : 'animal'}`
    let root = models.get(key)
    if (!root) {
      root = model(item)
      models.set(key, root)
    }
    root.visible = true
    root.position.set(worldX(item.x), worldY(item.y) + 0.2, 0.45)
    root.rotation.z = item.phase === 'active' ? Math.sin(seconds * 2) * 0.025 : 0
    root.scale.setScalar(item.phase === 'preparing' ? 0.5 + item.frames / 36 : 1)
  }
  return {
    sync(state, seconds) {
      models.forEach((root) => {
        root.visible = false
      })
      for (const side of ['player', 'opponent'] as const) {
        for (const item of state[side].biohazardDevices ?? []) {
          syncItem(side, item, seconds)
        }
      }
    },
    dispose() {
      models.forEach((root) => scene.remove(root))
      models.clear()
      geometry.forEach((shape) => shape.dispose())
      material.dispose()
      dark.dispose()
      glass.dispose()
    },
  }
}
