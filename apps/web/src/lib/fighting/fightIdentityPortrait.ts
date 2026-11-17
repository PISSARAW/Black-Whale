import type { FighterId } from './types'

const cache = new Map<FighterId, Promise<string | null>>()
let queue: Promise<unknown> = Promise.resolve()

/** One immutable identity image per fighter, rendered serially and reused on every round. */
export function fightIdentityPortrait(id: FighterId): Promise<string | null> {
  const cached = cache.get(id)
  if (cached) return cached
  const result = queue.then(() => renderPortrait(id)).catch(() => null)
  queue = result
  cache.set(id, result)
  return result
}

async function renderPortrait(id: FighterId): Promise<string | null> {
  const [THREE, { buildFightFigure }, { createFightState }] = await Promise.all([
    import('three'),
    import('./fighterFigure'),
    import('./fightState'),
  ])
  const canvas = document.createElement('canvas')
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: 'low-power',
  })
  const materials: import('three').MeshBasicMaterial[] = []
  try {
    renderer.setSize(112, 112, false)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    const glow = (color: number, opacity: number) => {
      const held = materials.find(
        (material) => material.color.getHex() === color && material.opacity === opacity,
      )
      if (held) return held
      const material = new THREE.MeshBasicMaterial({
        color,
        opacity,
        transparent: opacity < 1,
        depthWrite: opacity >= 1,
      })
      materials.push(material)
      return material
    }
    const model = buildFightFigure({ THREE, glow, fighter: createFightState(id, id).player })
    const head = model.root.getObjectByName('face-eye-left')?.parent
    if (!head) return null
    head.removeFromParent()
    head.position.set(0, 0, 0)
    head.rotation.set(0, -0.18, 0)
    const scene = new THREE.Scene()
    scene.add(head)
    const box = new THREE.Box3().setFromObject(head)
    const size = box.getSize(new THREE.Vector3())
    const centre = box.getCenter(new THREE.Vector3())
    const half = Math.max(size.x, size.y) * 0.54
    const camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.01, 10)
    camera.position.copy(centre).add(new THREE.Vector3(0, 0, 2))
    camera.lookAt(centre)
    renderer.render(scene, camera)
    return canvas.toDataURL('image/webp', 0.9)
  } finally {
    materials.forEach((material) => material.dispose())
    renderer.dispose()
    renderer.forceContextLoss()
  }
}
