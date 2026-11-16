import * as THREE from 'three'
import { buildHumanFigure } from '../../src/lib/tour/humanFigure'
import { buildFightFigure } from '../../src/lib/fighting/fighterFigure'
import { createFightState } from '../../src/lib/fighting/fightState'
import { fightBodyMotion } from '../../src/lib/fighting/fightBodyMotion'

// A neutral, aura-free view makes the model itself reviewable against a manga panel.
document.body.style.cssText = 'margin:0;background:#f5f2eb;color:#202126;font:16px system-ui'
const title = document.createElement('h1')
title.textContent = 'Kurapika · modèle commun'
title.style.cssText = 'margin:28px 32px 8px;font-size:26px'
document.body.append(title)
const subtitle = document.createElement('p')
subtitle.textContent = 'Silhouette, costume, regard et mèches · rendu réel Three.js'
subtitle.style.cssText = 'margin:0 32px;color:#646263'
document.body.append(subtitle)
const labels = document.createElement('div')
labels.style.cssText =
  'display:grid;grid-template-columns:repeat(3,1fr);text-align:center;margin-top:22px'
for (const text of ['Visite · face', 'Fighting 2D · garde', 'Visage · trois quarts']) {
  const label = document.createElement('p')
  label.textContent = text
  labels.append(label)
}
document.body.append(labels)
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
renderer.setSize(1440, 860)
renderer.setPixelRatio(1)
renderer.setScissorTest(true)
renderer.setClearColor(0xf5f2eb)
document.body.append(renderer.domElement)
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-0.6, 0.6, 1.1, -1.1, 0.1, 30)
const materials = new Map<string, THREE.MeshBasicMaterial>()
function glow(color: number, opacity: number) {
  const key = `${color}:${opacity}`
  let material = materials.get(key)
  if (!material) {
    material = new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
    materials.set(key, material)
  }
  return material
}
function tourModel() {
  return buildHumanFigure({
    THREE,
    glow,
    seen: {
      id: 'kurapika',
      kind: 'avatar',
      spaceId: 'room',
      tierId: 'tier-1',
      at: [0, 0],
      y: 0,
      size: 0.42,
      colour: 0xffffff,
      stage: 0,
      hidden: false,
      human: { role: 'hunter', identity: 'kurapika', pose: 'idle', aura: 'none' },
    },
  })
}
const fighter = createFightState('kurapika', 'hisoka').player
fighter.nen = { ...fighter.nen, mode: 'zetsu' }
const models = [tourModel(), buildFightFigure({ THREE, glow, fighter }), tourModel()]
models.forEach((model) => scene.add(model.root))
function show(view = 'body') {
  models.forEach((model) => {
    model.root.visible = false
  })
  models.forEach((model, index) => {
    model.root.visible = true
    model.animate(0, 'idle')
    if (index === 1) {
      const motion = fightBodyMotion({ fighter, seconds: 1, progress: 0 })
      model.animate(1, 'idle', { motion, transitionSeconds: 0 })
    }
    model.root.rotation.y = view === 'profile' ? Math.PI / 2 : index === 0 ? 0 : -0.35
    const close = index === 2 || view === 'face'
    model.root.updateMatrixWorld(true)
    const head = model.root.getObjectByName('face-mouth')!.parent!
    const target = close
      ? head.getWorldPosition(new THREE.Vector3())
      : new THREE.Vector3(0, 0.99, 0)
    const range = close ? 0.27 : 1.13
    camera.left = -range * (480 / 860)
    camera.right = -camera.left
    camera.top = range
    camera.bottom = -range
    camera.position.copy(target).add(new THREE.Vector3(0, 0, 12))
    camera.lookAt(target)
    camera.updateProjectionMatrix()
    renderer.setViewport(index * 480, 0, 480, 860)
    renderer.setScissor(index * 480, 0, 480, 860)
    renderer.render(scene, camera)
    model.root.visible = false
  })
}
show()
Object.assign(window, { humanModelsFixture: { show, count: models.length, models } })
