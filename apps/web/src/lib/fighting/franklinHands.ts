import type { Group, Mesh, MeshBasicMaterial, Object3D } from 'three'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import {
  FRANKLIN_SHOT_INTERVAL,
  franklinNenAvailable,
  franklinSalvo,
  franklinShotAt,
  usesFranklinBarrage,
} from './franklinAttack'
import type { ArcadeFighter } from './types'

type Three = HumanFigureBuild['THREE']
interface Finger {
  tip: Group
  chain: Group
  flash: Mesh
}
const HANDS = new WeakMap<Object3D, Finger[]>()
const GEOMETRIES = new WeakMap<Three, ReturnType<typeof makeGeometries>>()

function makeGeometries(THREE: Three) {
  const shapes = {
    palm: new THREE.SphereGeometry(1, 7, 5).scale(0.05, 0.04, 0.025),
    finger: new THREE.CylinderGeometry(0.012, 0.014, 0.055, 7),
    bore: new THREE.CylinderGeometry(0.008, 0.008, 0.002, 7),
    tip: new THREE.SphereGeometry(1, 7, 5).scale(0.013, 0.018, 0.013),
    link: new THREE.TorusGeometry(0.007, 0.0018, 3, 7),
    flash: new THREE.ConeGeometry(0.024, 0.1, 5),
  }
  Object.values(shapes).forEach((shape) => {
    shape.userData.sharedHuman = true
  })
  return shapes
}

interface HandBuild {
  THREE: Three
  glow: HumanFigureBuild['glow']
  shapes: ReturnType<typeof makeGeometries>
  skin: MeshBasicMaterial
}

/** Fighting-only detail: the shared visit's hands and other fighters keep their geometry. */
export function addFranklinHands(options: {
  THREE: Three
  glow: HumanFigureBuild['glow']
  model: HumanFigure
}): void {
  const { THREE, glow, model } = options
  let shapes = GEOMETRIES.get(THREE)
  if (!shapes) {
    shapes = makeGeometries(THREE)
    GEOMETRIES.set(THREE, shapes)
  }
  const fingers: Finger[] = []
  for (const side of ['left', 'right']) {
    const hand = model.root.getObjectByName(`hand-${side}`) as Mesh
    hand.geometry = shapes.palm
    hand.children.forEach((child) => {
      child.visible = false
    })
    for (let index = 0; index < 5; index++) {
      const finger = makeFinger(
        { THREE, glow, shapes, skin: hand.material as MeshBasicMaterial },
        index,
      )
      finger.root.name = `franklin-finger-${side}-${index}`
      hand.add(finger.root)
      fingers.push(finger)
    }
  }
  HANDS.set(model.turns, fingers)
}

function makeFinger(build: HandBuild, index: number) {
  const { THREE, glow, shapes, skin } = build
  const root = new THREE.Group()
  root.position.set((index - 2) * 0.023, -0.024 + Math.abs(index - 2) * 0.004, 0)
  const shaft = new THREE.Mesh(shapes.finger, skin)
  shaft.position.y = -0.025
  const bore = new THREE.Mesh(shapes.bore, glow(0x171318, 1))
  bore.position.y = -0.053
  const tip = new THREE.Group()
  tip.name = 'franklin-fingertip'
  tip.position.set(0.013, -0.054, 0)
  const cap = new THREE.Mesh(shapes.tip, skin)
  cap.position.set(-0.013, -0.012, 0)
  tip.add(cap)
  const chain = new THREE.Group()
  chain.name = 'franklin-finger-chain'
  for (let link = 0; link < 4; link++) {
    const ring = new THREE.Mesh(shapes.link, glow(0x96918b, 1))
    ring.position.set(0.015 + link * 0.006, -0.052 - Math.sin(link * 0.9) * 0.01, 0)
    ring.rotation.y = ((link % 2) * Math.PI) / 2
    chain.add(ring)
  }
  const flash = new THREE.Mesh(shapes.flash, glow(0xffd8a3, 1))
  flash.name = 'franklin-muzzle-flash'
  flash.rotation.z = Math.PI
  flash.position.y = -0.1
  flash.visible = false
  chain.visible = false
  root.add(shaft, bore, tip, chain, flash)
  return { root, tip, chain, flash }
}

export function animateFranklinHands(figure: Object3D, fighter: ArcadeFighter): void {
  const fingers = HANDS.get(figure)
  if (!fingers) return
  const shot = franklinNenAvailable(fighter) ? franklinShotAt(fighter) : null
  const opening = fingertipOpening(fighter)
  fingers.forEach((finger, index) => {
    finger.tip.rotation.z = opening * 1.9
    finger.chain.visible = opening > 0.1
    const physicalHand = index < 5 ? 0 : 1
    const hand = fighter.facing === 1 ? physicalHand : 1 - physicalHand
    finger.flash.visible =
      shot !== null && hand === shot % 2 && index % 5 === Math.floor(shot / 2) % 5
  })
}

function fingertipOpening(fighter: ArcadeFighter): number {
  if (!usesFranklinBarrage(fighter) || !franklinNenAvailable(fighter)) return 0
  const salvo = franklinSalvo(fighter)
  const frame = fighter.attack!.frame
  const start = salvo.startup + (fighter.attack?.concealed ? 10 : 0)
  const end = start + (salvo.shots - 1) * FRANKLIN_SHOT_INTERVAL + 1
  if (frame < start) return Math.max(0, Math.min(1, (frame - start * 0.3) / (start * 0.6)))
  return Math.max(0, 1 - Math.max(0, frame - end) / (salvo.recovery * 0.65))
}
