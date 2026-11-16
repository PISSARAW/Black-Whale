import type { HumanFigure, HumanFigureBuild } from './humanFigure'
import type { Mesh } from 'three'

/** The tapered silhouette belongs only to Skill 4's activation, before the complete astral double. */
export function addHanzoProjectionMantle(options: {
  THREE: HumanFigureBuild['THREE']
  glow: HumanFigureBuild['glow']
  model: HumanFigure
}) {
  const { THREE, glow, model } = options
  for (const side of ['left', 'right']) {
    model.root.getObjectByName(`shoulder-${side}`)!.visible = false
    model.root.getObjectByName(`hip-${side}`)!.visible = false
  }
  model.root.getObjectByName('torso')!.visible = false
  model.turns.children.forEach((node) => {
    if (
      node.name.startsWith('manga-') &&
      !node.name.startsWith('manga-head:') &&
      node.name !== 'manga-neck'
    )
      node.visible = false
  })
  const pelvis = model.turns.children.find(
    (node) => node.type === 'Group' && node.position.y > 0.7 && node.position.y < 0.8,
  )
  if (pelvis) pelvis.visible = false
  const { shape, badgeShape } = projectionShapes(THREE)
  const mantle = new THREE.Mesh(shape, glow(0x41434c, 0.52))
  mantle.position.y = 1.12
  mantle.name = 'hanzo-skill-four-mantle'
  model.turns.add(mantle)
  const badge = new THREE.Mesh(badgeShape, glow(0xd9d8d3, 0.7))
  badge.position.set(-0.085, 1.34, 0.13)
  badge.name = 'hanzo-skill-four-badge'
  model.turns.add(badge)
  const head = model.root.getObjectByName('face-mouth')!.parent!
  head.traverse((node) => {
    if (!(node as Mesh).isMesh) return
    // The pre-existing projected face material stays translucent, including pupils.
    node.renderOrder = 1
  })
}

const SHAPES = new WeakMap<
  HumanFigureBuild['THREE'],
  { shape: import('three').BufferGeometry; badgeShape: import('three').BufferGeometry }
>()
function projectionShapes(THREE: HumanFigureBuild['THREE']) {
  const existing = SHAPES.get(THREE)
  if (existing) return existing
  const shape = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0, -0.9),
      new THREE.Vector2(0.04, -0.76),
      new THREE.Vector2(0.12, -0.55),
      new THREE.Vector2(0.19, -0.2),
      new THREE.Vector2(0.23, 0.23),
      new THREE.Vector2(0.075, 0.37),
    ],
    32,
  ).scale(1, 1, 0.65)
  shape.userData.sharedHuman = true
  const badgeShape = new THREE.PlaneGeometry(0.032, 0.032).rotateZ(Math.PI / 4)
  badgeShape.userData.sharedHuman = true
  const made = { shape, badgeShape }
  SHAPES.set(THREE, made)
  return made
}
