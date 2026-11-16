import * as THREE from 'three'
import { buildHumanFigure } from '../../src/lib/tour/humanFigure'
import { buildFightFigure } from '../../src/lib/fighting/fighterFigure'
import { createFightState } from '../../src/lib/fighting/fightState'
import { fighterDefinition } from '../../src/lib/fighting/roster'
import { fightBodyMotion } from '../../src/lib/fighting/fightBodyMotion'
import type { FighterId } from '../../src/lib/fighting/types'

const identities: FighterId[] = ['kurapika', 'hisoka', 'biscuit', 'franklin']
document.body.style.cssText = 'margin:0;background:#101923;color:#e3ddd0;font:16px system-ui'
const title = document.createElement('h1')
title.textContent = 'Personnages · base commune / Fighting 2D'
title.style.cssText = 'margin:24px 32px 8px;font-size:24px'
document.body.append(title)
const legend = document.createElement('p')
legend.textContent = 'Ligne du haut : visite du bateau · Ligne du bas : Fighting 2D'
legend.style.cssText = 'margin:0 32px;color:#a4b2bf'
document.body.append(legend)
const labels = document.createElement('div')
labels.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);text-align:center'
for (const name of ['Kurapika', 'Hisoka', 'Biscuit', 'Franklin']) {
  const label = document.createElement('p')
  label.textContent = name
  labels.append(label)
}
document.body.append(labels)
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(1400, 1000)
renderer.setScissorTest(true)
renderer.setClearColor(0x101923)
document.body.append(renderer.domElement)
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-0.7, 0.7, 1, -1, 0.1, 50)
camera.position.set(0, 2, 12)
camera.lookAt(0, 2, 0)
const materials = new Map<string, THREE.MeshBasicMaterial>()
const glow = (colour: number, opacity: number) => {
  const key = `${colour}:${opacity}`
  let material = materials.get(key)
  if (!material) {
    material = new THREE.MeshBasicMaterial({ color: colour, opacity, transparent: opacity < 1 })
    materials.set(key, material)
  }
  return material
}
const models: Array<{
  model: ReturnType<typeof buildHumanFigure>
  mount: THREE.Group
  fight: boolean
  id: FighterId
}> = []
for (const fight of [false, true]) {
  identities.forEach((id, index) => {
    const definition = fighterDefinition(id)
    const fighter = createFightState(id, 'hisoka').player
    const model = fight
      ? buildFightFigure({ THREE, glow, fighter })
      : buildHumanFigure({
          THREE,
          glow,
          seen: {
            id,
            kind: 'avatar',
            spaceId: 'room',
            tierId: 'tier-1',
            at: [0, 0],
            y: 0,
            size: 0.42,
            colour: 0xffffff,
            stage: 0,
            hidden: false,
            human: {
              role: definition.modelRole,
              identity: definition.modelId,
              pose: 'idle',
              aura: 'none',
            },
          },
        })
    const mount = new THREE.Group()
    mount.position.set((index - 1.5) * 1.7, fight ? 0 : 2.4, 0)
    mount.add(model.root)
    scene.add(mount)
    models.push({ model, mount, fight, id })
  })
}
function show(view: 'body' | 'face' | 'profile' | 'combat' = 'body') {
  models.forEach(({ mount }) => {
    mount.visible = false
  })
  models.forEach(({ model, mount, fight, id }, index) => {
    mount.visible = true
    mount.position.set(0, 0, 0)
    model.root.scale.setScalar(1)
    model.root.position.y = 0
    model.root.rotation.y = view === 'profile' ? Math.PI / 2 : -0.22
    model.animate(0, 'idle')
    if (view === 'combat' && fight) {
      const fighter = createFightState(id, 'hisoka').player
      model.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
    }
    mount.updateMatrixWorld(true)
    const mouth = model.root.getObjectByName('face-mouth')!
    const target =
      view === 'face'
        ? mouth.parent!.getWorldPosition(new THREE.Vector3())
        : new THREE.Vector3(0, 1, 0)
    const range = view === 'face' ? 0.3 : 1.2
    camera.left = -range * 0.7
    camera.right = range * 0.7
    camera.top = range
    camera.bottom = -range
    camera.position.copy(target).add(new THREE.Vector3(0, 0, 12))
    camera.lookAt(target)
    camera.updateProjectionMatrix()
    renderer.setViewport((index % 4) * 350, index < 4 ? 500 : 0, 350, 500)
    renderer.setScissor((index % 4) * 350, index < 4 ? 500 : 0, 350, 500)
    renderer.render(scene, camera)
    mount.visible = false
  })
}

show()
Object.assign(window, { humanModelsFixture: { show, count: models.length, models } })
