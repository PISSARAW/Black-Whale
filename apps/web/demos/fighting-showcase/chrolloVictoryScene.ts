import { Euler, PerspectiveCamera, Quaternion, Scene, Vector3 } from 'three'
import type { Object3D } from 'three'
import type { FightState } from '../../src/lib/fighting/types'
import { applyCinematicFrame, type CinematicFrame } from './cinematicCamera'
import { reachCinematicHand } from './cinematicArmReach'
import { createChrolloSpectacleBlast } from './chrolloSpectacleBlast'
import { enhanceChrolloBook } from './chrolloSpectacleBook'
import { moveChrolloFromBlast } from './chrolloSpectacleMotion'
import { createSunInsert, spectacleCamera } from './chrolloSpectacleCamera'

const smooth = (v: number) => {
  const t = Math.max(0, Math.min(1, v))
  return t * t * (3 - 2 * t)
}

function stageBook(
  scene: Scene,
  camera: PerspectiveCamera,
  frame: { age: number; state: FightState; sun: ReturnType<typeof createSunInsert> },
) {
  const { age, state } = frame
  const head = scene.getObjectByName('manga-head:chrollo-lucilfer')!
  const root = scene.children.find((node) => node.getObjectByName(head.name) === head)!
  const victimHead = scene.getObjectByName('manga-head:hisoka')!
  const victimRoot = scene.children.find(
    (node) => node.getObjectByName(victimHead.name) === victimHead,
  )!
  const saved: Array<() => void> = []
  const save = (node: Object3D) => {
    const p = node.position.clone(),
      q = node.quaternion.clone(),
      scale = node.scale.clone(),
      v = node.visible
    saved.push(() => {
      node.position.copy(p)
      node.quaternion.copy(q)
      node.scale.copy(scale)
      node.visible = v
    })
  }
  for (const name of [
    'shoulder-right',
    'elbow-right',
    'hand-right',
    'shoulder-left',
    'elbow-left',
    'hand-left',
    'fight-chest',
    head.name,
  ])
    save(root.getObjectByName(name)!)
  save(root)
  if ((age >= 75 && age < 180) || age >= 420) {
    save(victimRoot)
    victimRoot.visible = false
  }
  const figure = head.parent!.parent!
  save(figure)
  figure.rotation.set(0, 0, 0)
  const chest = root.getObjectByName('fight-chest')!
  chest.rotation.set(0, 0, 0)
  chest.position.set(0, 0, 0)
  head.rotation.set(0.035, 0, 0)
  root.rotation.y = -state.opponent.facing * 1.05
  root.traverse((node) => {
    if (node.name.startsWith('nen-') || node.name === 'chrollo-closed-book') {
      save(node)
      node.visible = false
    }
  })
  const exit = moveChrolloFromBlast(root, age)
  saved.push(exit.restore)
  root.updateWorldMatrix(true, true)
  const q = head.getWorldQuaternion(new Quaternion())
  const origin = head.getWorldPosition(new Vector3())
  const local = (v: Vector3) => v.applyQuaternion(q).add(origin)
  const close = smooth((age - 150) / 30)
  const lowerBook = smooth((age - 240) / 60)
  const rightError = reachCinematicHand(root, {
    side: 'right',
    target: local(
      new Vector3(0.12 + lowerBook * 0.13, -0.5 - lowerBook * 0.4, 0.32 - lowerBook * 0.14),
    ),
    pole: local(new Vector3(0.48, -0.53, 0.26)),
  })
  const book = root.getObjectByName('chrollo-open-book')!
  save(book)
  book.visible = true
  book.position.set(-0.025, 0.02, 0.025)
  const orientation = new Quaternion()
    .setFromEuler(new Euler(0, (-close * Math.PI) / 2, 0))
    .multiply(new Quaternion().setFromEuler(new Euler(Math.PI / 2, 0, 0)))
  const hand = root.getObjectByName('hand-right')!
  book.quaternion.copy(
    hand.getWorldQuaternion(new Quaternion()).invert().multiply(q).multiply(orientation),
  )
  let leafCount = 0
  for (const side of [-1, 1]) {
    const leaf = book.getObjectByName(`book-leaf:${side}:combat-joint`)!
    if (!leaf) throw new Error('Missing native book hinge')
    save(leaf)
    leaf.rotation.z = side * (0.2 + close * (Math.PI / 2 - 0.2))
    leafCount++
  }
  book.updateWorldMatrix(true, true)
  const bookCentre = book.getWorldPosition(new Vector3())
  let leftError = 0
  if (age < 285) {
    leftError = reachCinematicHand(root, {
      side: 'left',
      target: bookCentre
        .clone()
        .add(new Vector3(-0.15 * (1 - close), 0.02, 0.02).applyQuaternion(q)),
      pole: local(new Vector3(-0.45, -0.6, 0.24)),
    })
  } else {
    root.getObjectByName('shoulder-left')!.rotation.set(0.05, 0, 0.07)
    root.getObjectByName('elbow-left')!.rotation.set(-0.1, 0, 0)
  }
  root.updateWorldMatrix(true, true)
  const restoreBook = enhanceChrolloBook(book, age)
  const lens = spectacleCamera(camera, { scene, head, hero: root, age, sun: frame.sun })
  return {
    audit: {
      age,
      shot: lens.shot,
      exitDistance: exit.distance,
      coatGust: exit.gust,
      closure: close,
      leafCount,
      rightHandError: rightError,
      leftHandError: leftError,
      leftHandReleased: age >= 285,
      bookHeld: book.visible,
      blastExpected: age >= 180 && age < 420,
    },
    restore: () => {
      lens.restore()
      restoreBook()
      saved.reverse().forEach((restore) => restore())
      root.updateWorldMatrix(true, true)
    },
  }
}

export function captureChrolloVictory(
  read: () => { state: FightState; age: number; camera: CinematicFrame },
) {
  const blast = createChrolloSpectacleBlast()
  const sun = createSunInsert()
  let renders = 0,
    restore: (() => void) | undefined
  let audit: Record<string, unknown> = {}
  Scene.prototype.onBeforeRender = function (_renderer, scene, camera) {
    if (!(camera instanceof PerspectiveCamera) || !scene.getObjectByName('fight-collision-boxes'))
      return
    restore?.()
    const frame = read()
    const resetCamera = applyCinematicFrame(camera, frame.camera)
    const up = camera.up.clone()
    let pose: ReturnType<typeof stageBook> | undefined
    if (frame.age >= 0) {
      pose = stageBook(scene, camera, { ...frame, sun })
      audit = pose.audit
      blast.sync(frame.state, frame.age)
      const head = scene.getObjectByName('manga-head:chrollo-lucilfer')!
      blast.group.quaternion.copy(head.getWorldQuaternion(new Quaternion()))
      blast.group.scale.z = 1
      scene.add(blast.group)
      blast.group.updateMatrixWorld(true)
    }
    restore = () => {
      pose?.restore()
      scene.remove(blast.group)
      camera.up.copy(up)
      resetCamera()
    }
  }
  Scene.prototype.onAfterRender = function (_renderer, scene) {
    if (!scene.getObjectByName('fight-collision-boxes')) return
    restore?.()
    restore = undefined
    renders++
  }
  return { ready: () => renders > 3, audit: () => audit }
}
