import type { Group, Mesh, MeshBasicMaterial } from 'three'
import { type NenTechniqueState } from '@black-whale/nen-engine'
import type { BufferGeometry } from 'three'
import type { HumanLook } from './humanFigure'

type Three = typeof import('three')

export type HumanZone = 'head' | 'torso' | 'hands' | 'feet'

/**
 * The aura a figure is wearing, as meshes.
 *
 * Built apart from the body because it answers to a different source: the body
 * comes from the passenger's profile, the aura from their Nen state and from
 * whether the observer is using Gyo. The animation loop closes over what this
 * returns; nothing here moves on its own.
 */
export interface HumanAuraBuild {
  THREE: Three
  geometry: (THREE: Three, key: string, make: () => BufferGeometry) => BufferGeometry
  glow: (colour: number, opacity: number) => MeshBasicMaterial
  seen: HumanLook
  nen: NenTechniqueState<HumanZone>
  /** False when the aura is concealed with In and the observer has no Gyo. */
  auraVisible: boolean
  figure: Group
  root: Group
}

export interface HumanAura {
  onFlames: Mesh[]
  renFlames: Mesh[]
  eyeAuras: Mesh[]
  koPoints: Mesh[]
  ryuPoints: Mesh[]
  enFields: Mesh[]
  onCore: Mesh | null
  zetsuTrace: Mesh | null
  auraShell: Mesh | null
  kenMantle: Mesh | null
}

const zonePositions: Record<HumanZone, [number, number, number]> = {
  head: [0, 1.62, 0],
  torso: [0, 1.08, 0],
  hands: [0, 1.02, 0.24],
  feet: [0, 0.14, 0.08],
}

export function buildHumanAura({
  THREE,
  geometry,
  glow,
  seen,
  nen,
  auraVisible,
  figure,
  root,
}: HumanAuraBuild): HumanAura {
  const onFlames: Mesh[] = []
  const renFlames: Mesh[] = []
  const eyeAuras: Mesh[] = []
  const koPoints: Mesh[] = []
  const ryuPoints: Mesh[] = []
  const enFields: Mesh[] = []
  let onCore: Mesh | null = null
  let zetsuTrace: Mesh | null = null
  let auraShell: Mesh | null = null
  let kenMantle: Mesh | null = null
  if (nen.mode === 'zetsu') {
    const trace = new THREE.Mesh(
      geometry(THREE, 'aura:zetsu', () => new THREE.SphereGeometry(0.69, 16, 10)),
      glow(seen.colour, 0.012),
    )
    trace.name = 'nen-zetsu-trace'
    trace.scale.y = 1.32
    trace.position.y = 0.9
    figure.add(trace)
    zetsuTrace = trace
  }
  if (auraVisible && nen.on) {
    const core = new THREE.Mesh(
      geometry(THREE, 'aura:on-core', () => new THREE.SphereGeometry(0.92, 22, 16)),
      glow(0x020612, 0.46),
    )
    core.name = 'nen-on-core'
    core.scale.y = 1.48
    core.position.y = 0.9
    figure.add(core)
    onCore = core
    for (let index = 0; index < 28; index++) {
      const outer = index % 2 === 0
      const flame = new THREE.Mesh(
        geometry(
          THREE,
          `aura:on-flame:${index % 4}:${index % 5}`,
          () => new THREE.ConeGeometry(0.07 + (index % 4) * 0.018, 0.58 + (index % 5) * 0.1, 7),
        ),
        glow(outer ? 0x123b7a : 0x01040c, outer ? 0.44 : 0.76),
      )
      const angle = (index / 28) * Math.PI * 2
      flame.name = 'nen-on-flame'
      flame.position.set(Math.cos(angle) * 0.62, 0.2 + (index % 7) * 0.27, Math.sin(angle) * 0.62)
      flame.rotation.z = Math.cos(angle) * -0.3
      flame.rotation.x = Math.sin(angle) * 0.3
      flame.userData.onAngle = angle
      flame.userData.onLayer = index % 7
      onFlames.push(flame)
      figure.add(flame)
    }
  }
  if (auraVisible && nen.mode !== 'zetsu' && !nen.ken && !nen.on) {
    const shell = new THREE.Mesh(
      geometry(
        THREE,
        `aura:${nen.mode}`,
        () => new THREE.SphereGeometry(nen.mode === 'ren' ? 0.9 : 0.72, 18, 12),
      ),
      glow(seen.colour, nen.mode === 'ren' ? 0.16 : 0.07),
    )
    shell.name = 'nen-ten-ren'
    shell.scale.y = 1.35
    shell.position.y = 0.9
    figure.add(shell)
    auraShell = shell
    if (nen.mode === 'ren') {
      for (let index = 0; index < 12; index++) {
        const flame = new THREE.Mesh(
          geometry(
            THREE,
            `aura:ren-flame:${index % 3}`,
            () => new THREE.ConeGeometry(0.1 + (index % 3) * 0.025, 0.55, 7),
          ),
          glow(seen.colour, 0.2),
        )
        const angle = (index / 12) * Math.PI * 2
        flame.name = 'nen-ren-flame'
        flame.position.set(Math.cos(angle) * 0.55, 0.5 + (index % 4) * 0.28, Math.sin(angle) * 0.55)
        flame.rotation.z = Math.cos(angle) * -0.22
        flame.rotation.x = Math.sin(angle) * 0.22
        flame.userData.auraAngle = angle
        flame.userData.auraLayer = index % 4
        renFlames.push(flame)
        figure.add(flame)
      }
    }
  }

  if (auraVisible && nen.ken) {
    const mantle = new THREE.Mesh(
      geometry(THREE, 'aura:ken', () => new THREE.SphereGeometry(0.96, 22, 16)),
      glow(seen.colour, 0.28),
    )
    mantle.name = 'nen-ken'
    mantle.scale.y = 1.42
    mantle.position.y = 0.9
    figure.add(mantle)
    kenMantle = mantle
  }

  if (auraVisible && nen.gyo) {
    for (const side of [-1, 1]) {
      const eyeAura = new THREE.Mesh(
        geometry(THREE, 'aura:gyo-eye', () => new THREE.SphereGeometry(0.075, 10, 7)),
        glow(seen.colour, 0.72),
      )
      eyeAura.name = side < 0 ? 'nen-gyo-left' : 'nen-gyo-right'
      eyeAura.position.set(side * 0.075, 1.61, 0.17)
      eyeAura.userData.eyeSide = side
      eyeAuras.push(eyeAura)
      figure.add(eyeAura)
    }
  }

  if (auraVisible && nen.en) {
    for (let index = 0; index < 3; index++) {
      const field = new THREE.Mesh(
        new THREE.RingGeometry(
          Math.max(0.05, nen.en.radius - 0.035 - index * 0.012),
          nen.en.radius + index * 0.018,
          64,
        ),
        glow(seen.colour, 0.24 - index * 0.045),
      )
      field.name = `nen-en-${index}`
      field.rotation.x = -Math.PI / 2
      field.position.y = 0.025 + index * 0.004
      enFields.push(field)
      root.add(field)
    }
  }

  if (auraVisible && nen.ko) {
    const zone = nen.ko as HumanZone
    const [x, y, z] = zonePositions[zone]
    for (const side of zone === 'hands' || zone === 'feet' ? [-1, 1] : [0]) {
      const point = new THREE.Mesh(
        geometry(THREE, `aura:ko:${nen.ko}`, () => new THREE.SphereGeometry(0.16, 12, 9)),
        glow(seen.colour, 0.78),
      )
      point.name = `nen-ko-${zone}`
      point.position.set(x + side * 0.23, y, z)
      point.userData.auraBase = [x + side * 0.23, y, z]
      koPoints.push(point)
      figure.add(point)
    }
  }

  if (auraVisible && !nen.ko) {
    for (const [zone, share] of Object.entries(nen.ryu) as [HumanZone, number][]) {
      if (!share) continue
      const [x, y, z] = zonePositions[zone]
      const point = new THREE.Mesh(
        geometry(THREE, `aura:ryu:${zone}`, () => new THREE.SphereGeometry(0.2, 12, 9)),
        glow(seen.colour, Math.min(0.68, 0.1 + share * 0.58)),
      )
      point.name = `nen-ryu-${zone}`
      point.position.set(x, y, z)
      point.scale.setScalar(0.65 + share * 0.85)
      point.userData.auraBase = [x, y, z]
      point.userData.auraShare = share
      point.userData.auraPhase = ryuPoints.length * 1.9
      ryuPoints.push(point)
      figure.add(point)
    }
  }
  return {
    onFlames,
    renFlames,
    eyeAuras,
    koPoints,
    ryuPoints,
    enFields,
    onCore,
    zetsuTrace,
    auraShell,
    kenMantle,
  }
}
