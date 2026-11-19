import * as THREE from 'three'
import { Box3, Quaternion, Scene, Vector3, type Object3D } from 'three'
import {
  createVisitHatsuModel,
  type VisitHatsuKind,
  type VisitHatsuModel,
} from '../../src/lib/fighting/visitHatsuModel'
import type { Segment } from './reel'

/**
 * A Nen creature that belongs to the hero but has no combat role in Clash (a guardian
 * spirit beast), shown on the hero for the closing shot. It is the archive's own model,
 * staged by the video only: it never touches the fight state.
 */
export interface Companion {
  model: VisitHatsuKind
  /** 0 → 1 as the creature rises out of the hero. */
  reveal: number
}

/** The companion a segment asks for at simulation frame `sim`. */
export function companionAt(segment: Pick<Segment, 'companion'>, sim: number): Companion | null {
  const key = segment.companion
  if (!key || sim < key.at) return null
  return { model: key.model, reveal: Math.min(1, (sim - key.at) / key.rise) }
}

function heroHead(scene: Scene, hero: string): Object3D | undefined {
  let found: Object3D | undefined
  scene.traverse((node) => {
    if (found) return
    // Same match as the portrait camera: `manga-head:<id>…`, or Kurapika's `kurapika-head`.
    const manga = node.name.startsWith('manga-head:') && node.name.includes(hero)
    if (node.name === `${hero}-head` || manga) found = node
  })
  return found
}

/** The hero's own figure: the head's first ancestor that also carries the legs. */
function figureOf(head: Object3D): Object3D {
  let node = head
  while (node.parent && !node.getObjectByName('knee-left')) node = node.parent
  return node
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3)

/** Chains onto the portrait camera's hook, so both stage the same render. */
export function installCompanion(hero: string, current: () => Companion | null) {
  const previous = Scene.prototype.onBeforeRender
  let built: { kind: VisitHatsuKind; model: VisitHatsuModel; height: number } | null = null
  Scene.prototype.onBeforeRender = function (this: Scene, ...args) {
    const [, scene] = args
    const wanted = current()
    if (built && built.model.root.parent !== scene) built.model.root.removeFromParent()
    if (built) built.model.root.visible = false
    const head = wanted && scene.getObjectByName('fight-collision-boxes') && heroHead(scene, hero)
    if (wanted && head) {
      if (!built || built.kind !== wanted.model) {
        built?.model.dispose()
        const model = createVisitHatsuModel(THREE, { model: wanted.model, anchor: 'floor' })
        built = { kind: wanted.model, model, height: 0 }
      }
      place(built.model, { head, scene, reveal: ease(wanted.reveal) })
    }
    previous.apply(this, args)
  }
}

function place(model: VisitHatsuModel, at: { head: Object3D; reveal: number; scene: Scene }) {
  const { head, reveal, scene } = at
  const figure = figureOf(head)
  figure.updateWorldMatrix(true, true)
  // Aura shells can widen the figure's box: the head gives the axis, the box only the floor.
  const body = new Box3().setFromObject(figure)
  const centre = head.getWorldPosition(new Vector3())
  const front = new Vector3(0, 0, 1).applyQuaternion(head.getWorldQuaternion(new Quaternion()))
  front.y = 0
  front.normalize()
  // Standing behind his shoulders, about half again his height.
  const height = (centre.y - body.min.y) * 1.12
  model.fit({ height: height * 1.55 })
  model.root.scale.multiplyScalar(0.55 + 0.45 * reveal)
  // Straight behind him as the audience sees it (the closing `tower` framing's own axis).
  const toward = front
    .clone()
    .multiplyScalar(0.45)
    .add(new Vector3(0, 0, 0.55))
    .normalize()
  model.root.position
    .set(centre.x, body.min.y - 0.4 * height * (1 - reveal), centre.z)
    .addScaledVector(toward, -0.45 * height)
  model.root.rotation.set(0, Math.atan2(toward.x, toward.z), 0)
  if (model.root.parent !== scene) scene.add(model.root)
  model.root.visible = reveal > 0
  audit = { centre: centre.toArray(), floor: body.min.y, height, at: model.root.position.toArray() }
}

let audit: Record<string, unknown> = {}
export const companionAudit = () => audit
