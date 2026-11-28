import type { Group, Material, Mesh } from 'three'
import type { Apparition } from '../tour/apparitions'
import { buildBasicApparition } from '../tour/apparitionBasicView'
import type { HumanMotion } from '../tour/humanAnimation'
import { batchNenModel } from '../tour/nenModelBatch'
import { buildTsuchibokko } from '../tour/silentMajoritySnake'
import type { ReplayFrame } from './replay'

type Three = typeof import('three')
type Glow = (color: number, opacity: number) => import('three').MeshBasicMaterial
type ReplayAvatar = Pick<Apparition, 'id' | 'at' | 'size' | 'y' | 'human'>

const WARNING_CAMERA = { at: [3, 1.85, 4.8], target: [0, 0.82, 0] } as const
const ATTACK_CAMERA = { at: [1.35, 2.38, 4.7], target: [-0.1, 0.43, 0] } as const
const SNAKE_POSITIONS = [
  [-0.78, 0.32],
  [-1.16, -0.16],
  [-0.04, 0.4],
  [0.33, -0.38],
] as const
const pointAtDoll: HumanMotion = ({ arms, head }) => {
  arms[1].rotation.set(-0.35, 0, 1.25)
  head.rotation.y = 0.16
}
const lookAtLoberry: HumanMotion = ({ head }) => {
  head.rotation.y = -0.26
}

function actor(THREE: Three, glow: Glow, look: ReplayAvatar) {
  const root = new THREE.Group()
  root.name = look.id
  root.position.set(look.at[0], look.y, look.at[1])
  const parts = buildBasicApparition(
    {
      ...look,
      kind: 'avatar',
      spaceId: 'replay',
      tierId: 'replay',
      colour: 0xc5b3a0,
      stage: 0,
      hidden: false,
    },
    { THREE, root, glow, skin: glow(0xc5b3a0, 1) },
  )
  return { root, animate: parts?.humanAnimate }
}

function snake(THREE: Three, glow: Glow, index: number) {
  const root = new THREE.Group()
  root.name = `replay-tsuchibokko-${index + 1}`
  buildTsuchibokko(
    {
      id: root.name,
      kind: 'blood-snake',
      size: 0.43,
      at: [0, 0],
      y: 0,
      spaceId: 'replay',
      tierId: 'replay',
      colour: 0xeee9dd,
      stage: index,
      hidden: false,
    },
    { THREE, root, glow, skin: glow(0xeee9dd, 1) },
  )
  batchNenModel(root)
  return root
}

function setSnakes(actors: Group[], frame: ReplayFrame, seconds: number) {
  actors.forEach((root, index) => {
    root.visible = index < frame.snakes
    if (!root.visible) return
    const [x, z] = SNAKE_POSITIONS[index]
    const wave = Math.sin(seconds * 4.6 + index * 1.8)
    const contraction = 1 - (100 - frame.bloodLevel) / 410
    root.position.set(x + wave * 0.027, 0.025, z * contraction)
    root.rotation.set(z * 0.35 + wave * 0.08, (index - 1.5) * -0.36, wave * 0.09)
    root.scale.set(1 + wave * 0.035, 1 - wave * 0.035, 1)
  })
}

function floor(THREE: Three, glow: Glow) {
  const room = new THREE.Group()
  const slab = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), glow(0x29241f, 1))
  slab.rotation.x = -Math.PI / 2
  room.add(slab)
  const grid = new THREE.GridHelper(18, 18, 0x635747, 0x41362e)
  grid.position.y = 0.003
  room.add(grid)
  return room
}

function updateCamera(options: {
  camera: import('three').OrthographicCamera
  frame: ReplayFrame
  aspect: number
}) {
  const { camera, frame, aspect } = options
  const warning = frame.stage === 'warning' || frame.stage === 'diversion'
  const shot = warning ? WARNING_CAMERA : ATTACK_CAMERA
  const height = Math.max(warning ? 1.19 : 0.82, (warning ? 1.58 : 1.32) / aspect)
  camera.left = -height * aspect
  camera.right = height * aspect
  camera.top = height
  camera.bottom = -height
  camera.position.set(shot.at[0], shot.at[1], shot.at[2])
  camera.lookAt(shot.target[0], shot.target[1], shot.target[2])
  camera.updateProjectionMatrix()
}

export function createSilentMajorityReplay(THREE: Three) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x181716)
  scene.fog = new THREE.Fog(0x181716, 4.7, 10)
  const camera = new THREE.OrthographicCamera(-2, 2, 1, -1, 0.1, 22)
  const materials = new Map<string, import('three').MeshBasicMaterial>()
  const glow: Glow = (color, opacity) => {
    const key = `${color}:${opacity}`
    const existing = materials.get(key)
    if (existing) return existing
    const made = new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
    materials.set(key, made)
    return made
  }
  const doll = actor(THREE, glow, {
    id: 'replay-marionette',
    at: [0.61, -0.12],
    y: 0,
    size: 0.37,
    human: { role: 'silent-majority', identity: 'silent-majority', pose: 'idle', aura: 'none' },
  })
  const loberry = actor(THREE, glow, {
    id: 'replay-loberry',
    at: [-1.03, 0.27],
    y: 0,
    size: 0.42,
    human: { role: 'witness', identity: 'loberry', pose: 'idle', aura: 'none' },
  })
  loberry.root.rotation.y = 0.82
  const furykov = actor(THREE, glow, {
    id: 'replay-furykov',
    at: [-0.1, 0.29],
    y: 0,
    size: 0.42,
    human: { role: 'guard', identity: 'furykov', pose: 'idle', aura: 'none' },
  })
  furykov.root.rotation.y = -0.24
  const barrigen = actor(THREE, glow, {
    id: 'replay-barrigen',
    at: [0.91, 0.07],
    y: 0,
    size: 0.47,
    human: { role: 'victim', identity: 'barrigen', pose: 'fallen', aura: 'none' },
  })
  const snakes = Array.from({ length: 4 }, (_, i) => snake(THREE, glow, i))
  scene.add(floor(THREE, glow), doll.root, loberry.root, furykov.root, barrigen.root, ...snakes)
  return {
    scene,
    camera,
    update(frame: ReplayFrame, seconds: number, aspect: number) {
      const warning = frame.stage === 'warning' || frame.stage === 'diversion'
      doll.root.visible = loberry.root.visible = furykov.root.visible = warning
      barrigen.root.visible = !warning
      if (warning) {
        const diverted = frame.stage === 'diversion'
        doll.animate?.(seconds, 'idle')
        loberry.animate?.(seconds, 'idle', diverted ? { motion: pointAtDoll } : undefined)
        furykov.animate?.(seconds, 'idle', diverted ? { motion: lookAtLoberry } : undefined)
      } else {
        barrigen.animate?.(seconds, 'fallen')
      }
      setSnakes(snakes, frame, seconds)
      updateCamera({ camera, frame, aspect })
    },
    dispose() {
      const owned = new Set<Material>(materials.values())
      scene.traverse((object) => {
        const mesh = object as Mesh
        if (mesh.geometry && !mesh.geometry.userData.sharedHuman) mesh.geometry.dispose()
        for (const material of [mesh.material].flat()) if (material) owned.add(material)
      })
      for (const material of owned) material.dispose()
      scene.clear()
    },
  }
}
