import type { Mesh } from 'three'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addSalesaleSleevesAndBoots(build: HumanLimbsBuild, limbs: HumanLimbs) {
  const { THREE, geometry, glow, profile } = build
  const bootShape = geometry(
    THREE,
    'manga:salesale-boot-shaft',
    () =>
      new THREE.LatheGeometry(
        [
          [0.054, -0.392],
          [0.059, -0.32],
          [0.074, -0.19],
          [0.072, -0.145],
        ].map(([r, y]) => new THREE.Vector2(r, y)),
        28,
      ),
  )
  const seams = geometry(THREE, 'manga:salesale-boot-seams', () =>
    mergeHumanDetails([
      new THREE.TorusGeometry(0.073, 0.002, 5, 28).rotateX(Math.PI / 2).translate(0, -0.15, 0),
      new THREE.BoxGeometry(0.003, 0.21, 0.003).translate(0.035, -0.265, 0.052),
    ]),
  )
  for (let i = 0; i < 2; i++) {
    limbs.arms[i].children[0].scale.multiply(new THREE.Vector3(1.18, 1, 1.18))
    limbs.elbows[i].children[0].scale.multiply(new THREE.Vector3(1.48, 1, 1.48))
    const cuff = new THREE.Mesh(
      geometry(
        THREE,
        'manga:salesale-robe-cuff',
        () => new THREE.CylinderGeometry(0.064, 0.061, 0.045, 28),
      ),
      glow(profile.shirt, 1),
    )
    cuff.name = 'salesale-robe-cuff'
    cuff.position.y = -0.267
    limbs.elbows[i].add(cuff)
    const boot = new THREE.Mesh(bootShape, glow(profile.trousers, 1))
    boot.name = 'salesale-boot-shaft'
    limbs.knees[i].add(boot)
    const detail = new THREE.Mesh(seams, glow(0x796854, 1))
    detail.name = 'salesale-boot-seams'
    limbs.knees[i].add(detail)
    ;(limbs.knees[i].children[1].children[1] as Mesh).material = glow(profile.trousers, 1)
  }
}
