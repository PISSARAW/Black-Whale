import type { Mesh } from 'three'
import type { HumanLimbs, HumanLimbsBuild } from './humanLimbs'
import { cluckPlumage, type CluckPlume } from './cluckFeathers'
import { mergeHumanDetails } from './humanDetailGeometry'

function limbPlumes(build: HumanLimbsBuild, side: number) {
  const { THREE, geometry, glow, profile } = build
  const materials = {
    white: glow(profile.shirt, 1),
    teal: glow(profile.accent, 1),
    shaft: glow(0x8bacae, 1),
  }
  const shoulder: CluckPlume[] = []
  const cuff: CluckPlume[] = []
  for (let i = 0; i < 4; i++)
    shoulder.push({
      length: 0.19 + i * 0.035,
      width: 0.023,
      at: [side * 0.015, 0.015, -0.025 - i * 0.022],
      turn: [0, side * 0.1, -side * (0.8 + i * 0.18)],
    })
  for (let i = 0; i < 7; i++) {
    const angle = (i * Math.PI * 2) / 7
    cuff.push({
      length: 0.095,
      width: 0.014,
      at: [Math.cos(angle) * 0.037, -0.04, Math.sin(angle) * 0.037],
      turn: [Math.sin(angle) * 0.25, angle, -Math.cos(angle) * 0.25],
    })
  }
  return {
    shoulder: cluckPlumage({
      THREE,
      geometry,
      key: `cluck-shoulder-feathers:${side}`,
      plumes: shoulder,
      materials,
    }),
    cuff: cluckPlumage({ THREE, geometry, key: 'cluck-cuff-feathers', plumes: cuff, materials }),
  }
}

function bootLaces(build: HumanLimbsBuild) {
  const { THREE, geometry, glow } = build
  const shape = geometry(THREE, 'manga:cluck-boot-laces', () => {
    const parts = []
    for (let i = 0; i < 9; i++)
      for (const side of [-1, 1])
        parts.push(
          new THREE.BoxGeometry(0.045, 0.003, 0.003)
            .rotateZ(side * 0.65)
            .translate(0, -0.03 - i * 0.043, 0.061),
        )
    return mergeHumanDetails(parts)
  })
  const mesh = new THREE.Mesh(shape, glow(0x8ca9aa, 1))
  mesh.name = 'cluck-boot-laces'
  return mesh
}

export function addCluckLimbCostume(build: HumanLimbsBuild, limbs: HumanLimbs) {
  if (build.profile.likeness !== 'cluck') return
  const { THREE, geometry, glow, profile } = build
  for (let i = 0; i < 2; i++) {
    for (const group of [
      limbs.arms[i].children[0],
      limbs.arms[i].children[2],
      limbs.legs[i].children[0],
    ])
      (group.children[1] as Mesh).material = glow(profile.skin, 1)
    const shorts = new THREE.Mesh(
      geometry(
        THREE,
        'manga:cluck-shorts',
        () => new THREE.CylinderGeometry(0.078, 0.076, 0.15, 24),
      ),
      glow(profile.trousers, 1),
    )
    shorts.name = 'cluck-shorts'
    shorts.position.y = -0.025
    limbs.legs[i].add(shorts)
    const boot = new THREE.Mesh(
      geometry(THREE, 'manga:cluck-tall-boot', () =>
        new THREE.CylinderGeometry(0.063, 0.05, 0.42, 24).translate(0, -0.21, 0),
      ),
      glow(profile.trousers, 1),
    )
    boot.name = 'cluck-tall-boot'
    limbs.knees[i].add(boot, bootLaces(build))
    ;(limbs.knees[i].children[1].children[1] as Mesh).material = glow(profile.trousers, 1)
    const plumes = limbPlumes(build, i === 0 ? -1 : 1)
    limbs.arms[i].add(plumes.shoulder)
    limbs.elbows[i].add(plumes.cuff)
  }
}
