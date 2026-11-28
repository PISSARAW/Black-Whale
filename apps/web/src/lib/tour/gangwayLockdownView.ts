import type * as Three from 'three'

const OPEN_LENGTH = 1
const RETRACTED_LENGTH = 0.08
const TRAVEL_SECONDS = 2.2
const HOLD_SECONDS = 0.65

interface GangwayFrame {
  extended: boolean
  delta: number
  cutaway: boolean
  instant?: boolean
}

export type GangwayPresentation = 'open' | 'moving' | 'cutaway' | 'closed'

export function gangwayLockdownView(
  THREE: typeof Three,
  exterior: Three.Group,
  spans: readonly Three.Group[],
) {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 850)
  camera.position.set(5, 410, 18)
  camera.up.set(0, 0, -1)
  camera.lookAt(5, 100, 0)
  const viewport = new THREE.Vector2()
  const highlight = new THREE.MeshBasicMaterial({
    color: 0xf9cf83,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
  })
  let openness = 1
  let requested = true
  let remaining = 0

  function pose() {
    const eased = openness * openness * (3 - 2 * openness)
    for (const span of spans) {
      span.scale.z = RETRACTED_LENGTH + (OPEN_LENGTH - RETRACTED_LENGTH) * eased
    }
  }

  function setExtended(extended: boolean) {
    requested = extended
    openness = Number(extended)
    remaining = 0
    pose()
  }

  return {
    get passable() {
      return requested && openness === 1
    },
    get showingLockdown() {
      return remaining > 0
    },
    get presentation(): GangwayPresentation {
      if (remaining > 0) return 'cutaway'
      if (requested && openness === 1) return 'open'
      return !requested && openness === 0 ? 'closed' : 'moving'
    },
    setExtended,
    advance({ extended, delta, cutaway, instant }: GangwayFrame) {
      if (instant) {
        if (requested !== extended || openness !== Number(extended) || remaining)
          setExtended(extended)
        return
      }
      if (requested !== extended) {
        remaining = !extended && cutaway ? openness * TRAVEL_SECONDS + HOLD_SECONDS : 0
        requested = extended
      }
      remaining = Math.max(0, remaining - delta)
      const amount = delta / TRAVEL_SECONDS
      const next = extended ? Math.min(1, openness + amount) : Math.max(0, openness - amount)
      if (openness === next) return
      openness = next
      pose()
    },
    render(renderer: Three.WebGLRenderer, scene: Three.Scene) {
      if (remaining === 0) return false
      renderer.getSize(viewport)
      const aspect = viewport.x / Math.max(1, viewport.y)
      const halfWidth = Math.max(182, 98 * aspect)
      const halfHeight = halfWidth / aspect
      camera.left = -halfWidth
      camera.right = halfWidth
      camera.top = halfHeight
      camera.bottom = -halfHeight
      camera.updateProjectionMatrix()

      const hidden = scene.children.filter((object) => object !== exterior && object.visible)
      const meshes = spans.flatMap((span) => span.children as Three.Mesh[])
      const original = meshes.map((mesh) => ({ material: mesh.material, order: mesh.renderOrder }))
      const visible = exterior.visible
      const fog = scene.fog
      try {
        for (const object of hidden) object.visible = false
        exterior.visible = true
        scene.fog = null
        meshes.forEach((mesh) => {
          mesh.material = highlight
          mesh.renderOrder = 1000
        })
        renderer.render(scene, camera)
      } finally {
        meshes.forEach((mesh, index) => {
          mesh.renderOrder = original[index].order
          mesh.material = original[index].material
        })
        scene.fog = fog
        exterior.visible = visible
        for (const object of hidden) object.visible = true
      }
      return true
    },
    dispose: () => highlight.dispose(),
  }
}
