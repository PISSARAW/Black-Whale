import type { Group } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanClothesBuild } from './humanClothes'
import { mangaBodyShape } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addFakeWobleFace(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow, outlined } = build
  for (const side of [-1, 1]) {
    const oldEye = head.getObjectByName(side < 0 ? 'face-eye-left' : 'face-eye-right')
    if (oldEye) oldEye.visible = false
    const eye = new THREE.Mesh(
      geometry(THREE, 'manga:fake-woble-round-eye', () => new THREE.CircleGeometry(0.035, 24)),
      materials.ink,
    )
    eye.name = 'fake-woble-round-eye'
    eye.position.set(side * 0.066, 0.018, 0.181)
    const shine = new THREE.Mesh(
      geometry(THREE, 'manga:fake-woble-eye-shine', () =>
        mergeHumanDetails([
          new THREE.CircleGeometry(0.008, 12).translate(-0.009, 0.011, 0),
          new THREE.CircleGeometry(0.0035, 10).translate(0.012, -0.012, 0),
        ]),
      ),
      glow(0xfffcf5, 1),
    )
    shine.position.z = 0.002
    eye.add(shine)
    head.add(eye)

    const cheek = outlined({
      THREE,
      geometry: geometry(THREE, 'manga:fake-woble-full-cheek', () =>
        new THREE.SphereGeometry(1, 14, 10).scale(0.075, 0.066, 0.046),
      ),
      material: materials.skin,
      ink: materials.ink,
      scale: 1.012,
    })
    cheek.name = 'fake-woble-full-cheek'
    cheek.position.set(side * 0.106, -0.071, 0.119)
    head.add(cheek)
  }

  const oldNose = head.getObjectByName('face-relief')
  const oldMouth = head.getObjectByName('face-mouth')
  if (oldNose) oldNose.visible = false
  if (oldMouth) oldMouth.visible = false
  const nose = new THREE.Mesh(
    geometry(THREE, 'manga:fake-woble-button-nose', () =>
      mergeHumanDetails([
        new THREE.CircleGeometry(0.004, 10).translate(-0.009, 0, 0),
        new THREE.CircleGeometry(0.004, 10).translate(0.009, 0, 0),
        new THREE.PlaneGeometry(0.016, 0.0025).translate(0, 0.007, 0),
      ]),
    ),
    materials.ink,
  )
  nose.name = 'fake-woble-button-nose'
  nose.position.set(0, -0.046, 0.184)
  head.add(nose)
  const mouth = new THREE.Mesh(
    geometry(
      THREE,
      'manga:fake-woble-baby-mouth',
      () => new THREE.TorusGeometry(0.018, 0.003, 6, 22),
    ),
    glow(0x845852, 1),
  )
  mouth.name = 'fake-woble-baby-mouth'
  mouth.position.set(0, -0.105, 0.181)
  head.add(mouth)
}

export function addFakeWobleRomper(build: HumanClothesBuild): void {
  const { THREE, geometry, figure, materials, profile } = build
  const { chest, waist, neck } = mangaBodyShape(profile)
  const romper = new THREE.Mesh(
    geometry(THREE, 'manga:fake-woble-baby-romper', () =>
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(waist * 1.2, 0.7 * neck),
          new THREE.Vector2(waist * 1.28, 0.95 * neck),
          new THREE.Vector2(chest, 1.28 * neck),
          new THREE.Vector2(chest * 0.74, 1.43 * neck),
        ],
        28,
      ).scale(1, 1, 0.85),
    ),
    materials.cloth,
  )
  romper.name = 'fake-woble-baby-romper'
  figure.add(romper)
  const collar = new THREE.Mesh(
    geometry(THREE, 'manga:fake-woble-round-collar', () =>
      new THREE.TorusGeometry(chest * 0.38, 0.018, 8, 28).rotateX(Math.PI / 2),
    ),
    materials.shirt,
  )
  collar.name = 'fake-woble-round-collar'
  collar.position.y = 1.43 * neck
  figure.add(collar)
}
