import type { BufferGeometry, Group, Mesh } from 'three'
import type { HumanHeadBuild } from './humanHead'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { mergeHumanDetails } from './humanDetailGeometry'

export function addOrauFaceAndEarpiece(build: HumanHeadBuild, head: Group): void {
  const { THREE, geometry, materials, glow } = build
  const earpiece = new THREE.Group()
  earpiece.name = 'orau-left-earpiece'
  earpiece.position.set(0.204, -0.026, 0.018)
  const receiver = new THREE.Mesh(
    geometry(
      THREE,
      'manga:orau-earpiece-receiver',
      () => new THREE.CapsuleGeometry(0.011, 0.035, 5, 10),
    ),
    materials.ink,
  )
  receiver.rotation.z = -0.12
  const hook = new THREE.Mesh(
    geometry(
      THREE,
      'manga:orau-earpiece-hook',
      () => new THREE.TorusGeometry(0.027, 0.0035, 6, 20, Math.PI * 1.35),
    ),
    materials.ink,
  )
  hook.position.set(-0.012, 0.013, -0.003)
  hook.rotation.z = 0.4
  earpiece.add(receiver, hook)
  head.add(earpiece)

  const features = new THREE.Mesh(
    geometry(THREE, 'manga:orau-heavy-profile-lines', () => {
      const parts: BufferGeometry[] = []
      for (let line = 0; line < 3; line++)
        parts.push(
          new THREE.PlaneGeometry(0.105 - line * 0.015, 0.0026)
            .rotateZ(line === 1 ? 0.05 : -0.035)
            .translate(-0.01, 0.113 + line * 0.025, 0.177 - line * 0.002),
        )
      for (const side of [-1, 1]) {
        parts.push(
          new THREE.PlaneGeometry(0.004, 0.073)
            .rotateZ(side * 0.22)
            .translate(side * 0.107, -0.047, 0.175),
        )
        parts.push(
          new THREE.PlaneGeometry(0.004, 0.052)
            .rotateZ(side * -0.38)
            .translate(side * 0.08, -0.104, 0.179),
        )
      }
      parts.push(new THREE.PlaneGeometry(0.083, 0.004).rotateZ(-0.08).translate(0, -0.126, 0.184))
      return mergeHumanDetails(parts)
    }),
    glow(0x6b5047, 0.82),
  )
  features.name = 'orau-heavy-profile-folds'
  head.add(features)

  const crown = new THREE.Mesh(
    geometry(THREE, 'manga:orau-bald-crown-shine', () =>
      new THREE.SphereGeometry(0.168, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.38).scale(
        1,
        0.9,
        0.92,
      ),
    ),
    glow(0xf0d8ba, 0.18),
  )
  crown.name = 'orau-bald-crown-shine'
  crown.position.set(0, 0.13, -0.01)
  head.add(crown)
}

export function addOrauCombatBoots(build: HumanLimbsBuild, limbs: HumanLimbs): void {
  const { THREE, geometry, glow } = build
  const boot = geometry(THREE, 'manga:orau-combat-boot', () =>
    new THREE.CapsuleGeometry(0.051, 0.13, 6, 16)
      .rotateX(Math.PI / 2)
      .scale(1.38, 1, 1)
      .translate(0, 0, 0.024),
  )
  for (const knee of limbs.knees) {
    const shoe = knee.children[1]
    shoe.children.slice(0, 2).forEach((part) => {
      ;(part as Mesh).geometry = boot
      ;(part as Mesh).material = glow(0x1c2026, 1)
    })
    const shaft = new THREE.Mesh(
      geometry(THREE, 'manga:orau-combat-boot-shaft', () =>
        new THREE.CylinderGeometry(0.063, 0.056, 0.2, 20).translate(0, -0.39, 0.004),
      ),
      glow(0x1c2026, 1),
    )
    shaft.name = 'orau-combat-boot-shaft'
    knee.add(shaft)
  }
}
