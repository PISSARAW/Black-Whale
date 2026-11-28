import type { BufferGeometry, Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import { mergeHumanDetails } from './humanDetailGeometry'

/** Panel-specific facial landmarks from Saquelle's close-up in room 1013. */
export function addSaquelleFace(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build

  for (const side of [-1, 1]) {
    const oldEye = head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')
    if (oldEye) oldEye.visible = false

    const eye = new THREE.Group()
    eye.name = 'saquelle-small-round-eye'
    eye.position.set(side * 0.069, 0.018, 0.184)
    const white = new THREE.Mesh(
      geometry(THREE, 'manga:saquelle-small-eye-white', () => new THREE.CircleGeometry(0.018, 18)),
      glow(0xfffcf5, 1),
    )
    const outline = new THREE.Mesh(
      geometry(
        THREE,
        'manga:saquelle-small-eye-outline',
        () => new THREE.TorusGeometry(0.018, 0.0023, 6, 20),
      ),
      materials.ink,
    )
    outline.position.z = 0.001
    const pupil = new THREE.Mesh(
      geometry(THREE, 'manga:saquelle-small-eye-pupil', () => new THREE.CircleGeometry(0.005, 14)),
      materials.ink,
    )
    pupil.position.z = 0.002
    eye.add(white, outline, pupil)
    head.add(eye)
  }

  const contours = new THREE.Mesh(
    geometry(THREE, 'manga:saquelle-cheekbone-contours', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1]) {
        parts.push(
          new THREE.PlaneGeometry(0.004, 0.075)
            .rotateZ(side * 0.72)
            .translate(side * 0.105, -0.035, 0.181),
        )
        parts.push(
          new THREE.PlaneGeometry(0.004, 0.045)
            .rotateZ(side * -0.3)
            .translate(side * 0.073, -0.082, 0.184),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x72564b, 0.78),
  )
  contours.name = 'saquelle-prominent-cheekbone-lines'
  head.add(contours)

  const oldMouth = head.getObjectByName('face-mouth')
  if (oldMouth) oldMouth.visible = false
  const lips = new THREE.Mesh(
    geometry(THREE, 'manga:saquelle-thick-lips', () => {
      const shape = new THREE.Shape()
      shape.moveTo(-0.044, 0)
      shape.quadraticCurveTo(-0.019, 0.018, 0, 0.009)
      shape.quadraticCurveTo(0.019, 0.018, 0.044, 0)
      shape.quadraticCurveTo(0.018, -0.019, 0, -0.011)
      shape.quadraticCurveTo(-0.018, -0.019, -0.044, 0)
      return new THREE.ShapeGeometry(shape, 18)
    }),
    glow(0x815851, 0.96),
  )
  lips.name = 'saquelle-thick-lips'
  lips.position.set(0, -0.104, 0.184)
  head.add(lips)

  const stubble = new THREE.Mesh(
    geometry(THREE, 'manga:saquelle-chin-stubble', () => {
      const parts: BufferGeometry[] = []
      for (let row = 0; row < 3; row++)
        for (let strand = -2; strand <= 2; strand++)
          parts.push(
            new THREE.PlaneGeometry(0.0022, 0.013 - Math.abs(strand) * 0.001)
              .rotateZ(strand * 0.12)
              .translate(strand * 0.015, -0.13 - row * 0.017, 0.178 - row * 0.004),
          )
      return mergeHumanDetails(parts)
    }),
    glow(0x635348, 0.8),
  )
  stubble.name = 'saquelle-chin-stubble'
  head.add(stubble)

  const veins = new THREE.Mesh(
    geometry(THREE, 'manga:saquelle-temple-veins', () => {
      const parts: BufferGeometry[] = []
      for (const side of [-1, 1]) {
        const points = [
          new THREE.Vector3(side * 0.124, 0.065, 0.153),
          new THREE.Vector3(side * 0.145, 0.09, 0.139),
          new THREE.Vector3(side * 0.134, 0.12, 0.132),
          new THREE.Vector3(side * 0.151, 0.142, 0.113),
        ]
        parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 18, 0.0024, 5, false))
        parts.push(
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              points[1]!,
              new THREE.Vector3(side * 0.162, 0.102, 0.118),
              new THREE.Vector3(side * 0.166, 0.123, 0.101),
            ]),
            10,
            0.0018,
            5,
            false,
          ),
        )
      }
      return mergeHumanDetails(parts)
    }),
    glow(0x81574d, 0.9),
  )
  veins.name = 'saquelle-visible-temple-veins'
  head.add(veins)
}
