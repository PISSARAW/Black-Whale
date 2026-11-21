import { doorLetter } from './voconteDoorLabels'
import { DOOR_FRAMES, doorFramesFor, doorFramesVisible } from './voconteDoors'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightState } from './types'
import { threadVisible } from './fineControlAnchors'

/** The lintel and jambs are existing duel props; only the threshold glow is Nen. */
export function createVoconteDoorScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const root = new THREE.Group()
  root.name = 'voconte:physical-frames'
  const wood = new THREE.MeshStandardMaterial({ color: 0x725847, roughness: 0.85 })
  const aura = new THREE.MeshBasicMaterial({
    color: 0x7ec8b6,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const arrowMaterial = new THREE.MeshBasicMaterial({
    color: 0x7ec8b6,
    transparent: true,
    opacity: 0.9,
  })
  const height = worldY(14) - worldY(0)
  const postGeometry = new THREE.BoxGeometry(0.12, height, 0.12)
  const lintelGeometry = new THREE.BoxGeometry(0.14, 0.14, 1.7)
  const thresholdGeometry = new THREE.PlaneGeometry(1.5, height)
  const arrowGeometry = new THREE.ConeGeometry(0.18, 0.45, 3)
  const lights: import('three').Mesh[] = []
  const labels: ReturnType<typeof doorLetter>[] = []
  const groups: import('three').Group[] = []
  /** One pair per seat: each Door user links the two frames they chose before the round. */
  for (const frame of [...DOOR_FRAMES, ...DOOR_FRAMES]) {
    const group = new THREE.Group()
    group.name = `voconte:frame:${frame.id}`
    group.position.set(worldX(frame.x), worldY(0), 0)
    for (const depth of [-0.8, 0.8]) {
      const post = new THREE.Mesh(postGeometry, wood)
      post.position.set(0, height / 2, depth)
      group.add(post)
    }
    const lintel = new THREE.Mesh(lintelGeometry, wood)
    lintel.position.y = height
    const threshold = new THREE.Mesh(thresholdGeometry, aura)
    threshold.rotation.y = Math.PI / 2
    threshold.position.y = height / 2
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial)
    arrow.rotation.z = (-frame.direction * Math.PI) / 2
    arrow.position.set(-frame.direction * 0.6, 0.14, 0.95)
    const label = doorLetter(options, frame.id)
    label.position.set(0, height + 0.18, 0.9)
    labels.push(label)
    group.add(lintel, threshold, arrow, label)
    lights.push(threshold, arrow)
    groups.push(group)
    root.add(group)
  }
  scene.add(root)
  return {
    sync: (state: FightState) => {
      root.visible = doorFramesVisible(state)
      placeChosenFrames({ state, groups, worldX })
      const active = (['player', 'opponent'] as const).some(
        (side) => state.voconteDoors?.networks[side]?.active && threadVisible(options, state, side),
      )
      lights.forEach((light) => {
        light.visible = active
      })
    },
    dispose: () => {
      scene.remove(root)
      for (const label of labels) {
        label.geometry.dispose()
        label.material.dispose()
      }
      for (const geometry of [postGeometry, lintelGeometry, thresholdGeometry, arrowGeometry])
        geometry.dispose()
      for (const material of [wood, aura, arrowMaterial]) material.dispose()
    },
  }
}

/** Frames are fixed for the round; a second seat sharing a position does not draw twice. */
function placeChosenFrames(c: {
  state: FightState
  groups: import('three').Group[]
  worldX: (x: number) => number
}) {
  const frames = [...doorFramesFor(c.state, 'player'), ...doorFramesFor(c.state, 'opponent')]
  const seen = new Set<string>()
  frames.forEach((frame, index) => {
    const key = `${frame.id}:${frame.x}`
    c.groups[index].visible = !seen.has(key)
    c.groups[index].position.x = c.worldX(frame.x)
    seen.add(key)
  })
}
