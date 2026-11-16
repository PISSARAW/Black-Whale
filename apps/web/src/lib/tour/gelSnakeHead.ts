import { SNAKE_BOW, SNAKE_HEAD } from './apparitions'
import type { BasicApparitionContext } from './apparitionBasicView'
import { modelKit } from './nenModelPrimitives'

/** Gel's violet snake face, shared by the coiled arm in the visit and the striking arm. */
export function buildGelSnakeHead(context: BasicApparitionContext) {
  const { THREE, glow } = context
  const head = new THREE.Group()
  head.name = 'gel-snake-head'
  const violet = glow(SNAKE_HEAD, 1),
    ribbon = glow(SNAKE_BOW, 1)
  const upper = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    violet,
  )
  upper.scale.set(1, 0.72, 1.4)
  upper.position.set(0, 0.045, -0.035)
  upper.name = 'gel-snake-upper-jaw'
  head.add(upper)
  const mouth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 24, 16).scale(0.193, 0.156, 0.215),
    glow(0x21152f, 1),
  )
  mouth.position.set(0, -0.088, -0.06)
  mouth.name = 'gel-snake-open-mouth'
  head.add(mouth)
  const lower = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16).scale(0.19, 0.037, 0.25), violet)
  lower.position.set(0, -0.245, -0.025)
  lower.name = 'gel-snake-lower-jaw'
  head.add(lower)
  const rim = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.19, 0.035, -0.21),
        new THREE.Vector3(-0.2, -0.1, -0.21),
        new THREE.Vector3(-0.14, -0.235, -0.23),
        new THREE.Vector3(0, -0.26, -0.25),
        new THREE.Vector3(0.14, -0.235, -0.23),
        new THREE.Vector3(0.2, -0.1, -0.21),
        new THREE.Vector3(0.19, 0.035, -0.21),
      ]),
      48,
      0.013,
      8,
      false,
    ),
    violet,
  )
  rim.name = 'gel-snake-purple-mouth-rim'
  head.add(rim)
  const kit = modelKit({ ...context, root: head, skin: violet })
  for (const [i, x, y] of [
    [0, 0, 0.15],
    [1, -0.065, 0.15],
    [2, 0.065, 0.15],
    [3, 0, 0.195],
  ]) {
    const mark = kit.heart({
      name: `heart-mark-${i}`,
      at: [x, y, -0.24],
      width: i === 0 ? 0.043 : 0.022,
      colour: 0x47326d,
    })
    mark.rotation.y = Math.PI
  }
  const bow = new THREE.Group()
  bow.name = 'gel-snake-pink-bow'
  bow.position.set(0, 0.15, 0.17)
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.bezierCurveTo(side * 0.2, 0.2, side * 0.2, -0.12, 0, 0)
    const wing = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.02,
        bevelEnabled: true,
        bevelSize: 0.008,
        bevelThickness: 0.006,
        bevelSegments: 2,
      }),
      ribbon,
    )
    wing.name = 'gel-snake-bow-wing'
    bow.add(wing)
  }
  bow.add(new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 12), ribbon))
  head.add(bow)
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(1, 20, 14).scale(0.055, 0.058, 0.027),
      glow(0xf9f6e8, 1),
    )
    eye.position.set(side * 0.16, 0.085, -0.21)
    eye.name = 'gel-snake-white-eye'
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 16, 12).scale(0.8, 1, 0.45),
      glow(0x514469, 1),
    )
    pupil.position.z = -0.025
    eye.add(pupil)
    head.add(eye)
    const fang = new THREE.Mesh(
      new THREE.ConeGeometry(0.018, 0.15, 12).rotateZ(Math.PI),
      glow(0xf9f6e8, 1),
    )
    fang.position.set(side * 0.13, -0.025, -0.23)
    fang.name = 'gel-snake-upper-fang'
    head.add(fang)
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.055, 10), glow(0xf9f6e8, 1))
    tooth.position.set(side * 0.13, -0.21, -0.21)
    tooth.name = 'gel-snake-lower-fang'
    head.add(tooth)
  }
  const tongue = new THREE.Group()
  tongue.name = 'tongue'
  tongue.position.set(0, -0.16, -0.16)
  const stem = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.025, -0.025, -0.16),
        new THREE.Vector3(-0.025, -0.01, -0.34),
        new THREE.Vector3(0, 0.025, -0.46),
      ]),
      32,
      0.009,
      8,
      false,
    ),
    ribbon,
  )
  tongue.add(stem)
  for (const side of [-1, 1]) {
    const tip = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.025, -0.46),
          new THREE.Vector3(side * 0.024, 0.035, -0.5),
          new THREE.Vector3(side * 0.03, 0.02, -0.55),
        ]),
        12,
        0.0045,
        6,
        false,
      ),
      ribbon,
    )
    tongue.add(tip)
  }
  head.add(tongue)
  return head
}

/** A forward extension is a continuous black arm, rather than a miniature coil. */
export function buildGelSnakeStrike(context: BasicApparitionContext) {
  const { THREE, root, glow } = context
  const body = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.08, 0.4, 0),
        new THREE.Vector3(-0.06, 0.85, 0),
        new THREE.Vector3(0, 1.3, 0),
      ]),
      48,
      0.065,
      12,
      false,
    ),
    glow(0x14141a, 1),
  )
  body.name = 'gel-snake-black-arm'
  root.add(body)
  const head = buildGelSnakeHead(context)
  head.rotation.set(0, -Math.PI / 2, 0)
  head.rotateX(Math.PI / 2)
  head.position.y = 1.3
  root.add(head)
  return head
}
