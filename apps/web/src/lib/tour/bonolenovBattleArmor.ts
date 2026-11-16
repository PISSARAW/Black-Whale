import type { Material, Mesh, Object3D } from 'three'
import type { HumanFigure, HumanFigureBuild } from './humanFigure'
import { kurapikaLock } from './kurapikaGeometry'
import { mergeHumanDetails } from './humanDetailGeometry'

type Three = HumanFigureBuild['THREE']
const SHAPES = new WeakMap<Three, ReturnType<typeof armorShapes>>()
function armorShapes(THREE: Three) {
  const crown = []
  const skirt = []
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2
    const r = 0.4 + (i % 2) * 0.055
    crown.push(
      kurapikaLock(THREE, {
        width: 0.026,
        depth: 0.012,
        points: [
          [Math.cos(a) * 0.12, 0.08 + Math.sin(a) * 0.14, 0],
          [Math.cos(a) * 0.21, 0.08 + Math.sin(a) * 0.23, -0.01],
          [Math.cos(a) * r * 0.88, 0.08 + Math.sin(a) * r * 0.88, -0.02],
          [Math.cos(a) * r, 0.08 + Math.sin(a) * r, -0.025],
        ],
      }),
    )
    skirt.push(
      kurapikaLock(THREE, {
        width: 0.043,
        depth: 0.014,
        points: [
          [Math.cos(a) * 0.15, -0.19, Math.sin(a) * 0.11],
          [Math.cos(a) * 0.23, -0.3, Math.sin(a) * 0.18],
          [Math.cos(a) * 0.29, -0.43, Math.sin(a) * 0.24],
          [Math.cos(a) * (0.32 + (i % 2) * 0.025), -0.51 - (i % 3) * 0.02, Math.sin(a) * 0.27],
        ],
      }),
    )
  }
  const shapes = {
    crown: mergeHumanDetails(crown),
    skirt: mergeHumanDetails(skirt),
    mask: new THREE.SphereGeometry(1, 24, 16).scale(0.09, 0.178, 0.054),
    crest: new THREE.BoxGeometry(0.016, 0.3, 0.009),
    shaft: new THREE.CylinderGeometry(0.012, 0.012, 2.6, 12),
    tip: new THREE.ConeGeometry(0.056, 0.34, 4).scale(1, 1, 0.4),
  }
  Object.values(shapes).forEach((shape) => {
    shape.userData.sharedHuman = true
  })
  return shapes
}

/** The same feathered Prologue equipment is used by the shared preview and live Fighting. */
export function addBonolenovBattleArmor(options: {
  THREE: Three
  glow: HumanFigureBuild['glow']
  model: HumanFigure
}) {
  const { THREE, glow, model } = options
  let shapes = SHAPES.get(THREE)
  if (!shapes) {
    shapes = armorShapes(THREE)
    SHAPES.set(THREE, shapes)
  }
  model.root.traverse((node) => {
    if (
      (node.name.startsWith('bonolenov-') && node.name !== 'bonolenov-exposed-body-holes') ||
      node.name === 'signature-bandages'
    )
      node.visible = false
  })
  bareArmorBody(model, glow)
  const costume = new THREE.Group()
  costume.name = 'bonolenov-prologue-attire'
  const skirt = new THREE.Mesh(shapes.skirt, glow(0xefede4, 1))
  skirt.name = 'bonolenov-prologue-feather-skirt'
  costume.add(skirt)
  costume.position.y = 1.12
  model.turns.add(costume)
  const head = model.root.getObjectByName('face-mouth')!.parent!
  const headdress = new THREE.Group()
  headdress.name = 'bonolenov-prologue-headdress'
  const feathers = new THREE.Mesh(shapes.crown, glow(0xf3f0e6, 1))
  feathers.name = 'bonolenov-prologue-feather-crown'
  const mask = new THREE.Mesh(shapes.mask, glow(0x7c2635, 1))
  mask.position.set(0, 0.08, 0.18)
  const crest = new THREE.Mesh(shapes.crest, glow(0xc1a856, 1))
  crest.position.set(0, 0.08, 0.236)
  headdress.add(feathers, mask, crest)
  head.add(headdress)
  const spear = new THREE.Group()
  spear.name = 'bonolenov-prologue-spear'
  const shaft = new THREE.Mesh(shapes.shaft, glow(0x908a90, 1))
  const tip = new THREE.Mesh(shapes.tip, glow(0xd7d2dd, 1))
  tip.position.y = 1.42
  spear.add(shaft, tip)
  spear.position.y = -0.2
  spear.rotation.x = Math.PI / 2
  model.root.getObjectByName('hand-right')?.add(spear)
}

function recolourPart(root: Object3D, route: readonly [string, ...number[]], material: Material) {
  const [name, ...indices] = route
  let node = root.getObjectByName(name)
  for (const index of indices) node = node?.children[index]
  const surface = node as Mesh | undefined
  if (surface?.isMesh) surface.material = material
}

function bareArmorBody(model: HumanFigure, glow: HumanFigureBuild['glow']) {
  const bare = glow(0x4b3935, 1)
  recolourPart(model.root, ['torso', 1], bare)
  for (const side of ['left', 'right']) {
    for (const part of ['shoulder', 'elbow', 'hip', 'knee'])
      recolourPart(model.root, [`${part}-${side}`, 0, 1], bare)
    recolourPart(model.root, [`shoulder-${side}`, 2, 1], bare)
    recolourPart(model.root, [`hand-${side}`, 1], bare)
    recolourPart(model.root, [`knee-${side}`, 1, 1], glow(0x393238, 1))
  }
}
