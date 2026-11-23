import type { LivingPortraitMood } from './perception/opponentHudView'
import { livingPortraitPose } from './perception/livingPortraitPose'
import type { FighterId } from './types'

export type LivingPortraitSet = Record<LivingPortraitMood, string | null>

const MOODS: readonly LivingPortraitMood[] = ['calm', 'strained', 'critical']
const EMPTY_SET: LivingPortraitSet = { calm: null, strained: null, critical: null }

const cache = new Map<FighterId, Promise<LivingPortraitSet>>()
let queue: Promise<unknown> = Promise.resolve()

/** One immutable identity image per fighter, rendered serially and reused on every round. */
export function fightIdentityPortrait(id: FighterId): Promise<string | null> {
  return fightLivingPortraits(id).then((set) => set.calm)
}

/** Renders and caches all three Living Portrait moods (calm, strained, critical) in one WebGL pass. */
export function fightLivingPortraits(id: FighterId): Promise<LivingPortraitSet> {
  const cached = cache.get(id)
  if (cached) return cached
  const result = queue.then(() => renderLivingPortraits(id)).catch(() => ({ ...EMPTY_SET }))
  queue = result
  cache.set(id, result)
  return result
}

async function renderLivingPortraits(id: FighterId): Promise<LivingPortraitSet> {
  const [THREE, { buildFightFigure }, { createFightState }, { drawFightFace, fightFaceRig }] =
    await Promise.all([
      import('three'),
      import('./fighterFigure'),
      import('./fightState'),
      import('./fightExpressionRig'),
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
    const glow = createGlowPool(THREE, materials)
    const model = buildFightFigure({ THREE, glow, fighter: createFightState(id, id).player })
    const rig = fightFaceRig(model.root)
    const head = model.root.getObjectByName('face-eye-left')?.parent
    if (!head) return { ...EMPTY_SET }
    const { scene, camera } = framePortraitHead(THREE, head)
    const output: LivingPortraitSet = { calm: null, strained: null, critical: null }
    for (const mood of MOODS) {
      if (rig) drawFightFace(rig, livingPortraitPose(id, mood))
      renderer.render(scene, camera)
      output[mood] = canvas.toDataURL('image/webp', 0.9)
    }
    return output
  } finally {
    materials.forEach((material) => material.dispose())
    renderer.dispose()
    renderer.forceContextLoss()
  }
}

function createGlowPool(
  THREE: typeof import('three'),
  materials: import('three').MeshBasicMaterial[],
) {
  return (color: number, opacity: number) => {
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
}

function framePortraitHead(THREE: typeof import('three'), head: import('three').Object3D) {
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
  return { scene, camera }
}
