import type { BufferGeometry, Group, Material, Mesh, MeshBasicMaterial } from 'three'
import { buildHumanFigure, type HumanLook } from '../tour/humanFigure'
import { humanProfile } from '../tour/humanProfiles'
import type { AnimatedHuman } from '../tour/humanAnimation'
import { sceneryBox, type SceneryKit } from './stageKit'
import type { BackgroundSpectator, StageBackgroundContext } from './stageBackgroundTypes'
import { backgroundParticipants } from './stageBackgroundCatalogue'

export interface BackgroundAudience {
  root: Group
  update: (seconds: number, excitement: number) => void
  dispose: () => void
}
interface AudienceOptions {
  cast: readonly BackgroundSpectator[]
  arena: boolean
  context: StageBackgroundContext
}

function spectatorLook(spectator: BackgroundSpectator, identity: string): HumanLook {
  return {
    id: `background:${identity}`,
    kind: 'combatant',
    spaceId: 'clash-background',
    tierId: 'arcade-stage',
    at: [0, 0],
    y: 0,
    size: 1,
    colour: 0xcbbf9a,
    stage: 0,
    hidden: false,
    human: { identity, role: 'witness', pose: spectator.pose, aura: 'none' },
  }
}

function react(
  rig: AnimatedHuman,
  reaction: BackgroundSpectator['reaction'],
  motion: { clock: number; excitement: number },
): void {
  const { clock, excitement } = motion
  const motions = {
    quiet: () => undefined,
    nod: () => {
      rig.head.rotation.x += Math.sin(clock * 4) * excitement * 0.14
    },
    cheer: () => {
      rig.arms.forEach((arm, side) => {
        arm.rotation.x -= excitement * 0.7
        arm.rotation.z += (side === 0 ? 1 : -1) * excitement * (0.35 + Math.sin(clock * 9) * 0.16)
      })
      rig.head.rotation.x += Math.sin(clock * 5) * excitement * 0.1
    },
    cradle: () => {
      rig.arms.forEach((arm, side) => {
        arm.rotation.x = -0.9
        arm.rotation.z = side === 0 ? 0.55 : -0.55
      })
    },
  }
  motions[reaction]()
}

/** Private materials only; never release cached human geometry or contact shadows. */
function audienceDisposer(roots: Group[], sources: Iterable<Material>): () => void {
  const materials = new Set<Material>(sources)
  const geometries = new Set<BufferGeometry>()
  for (const root of roots)
    root.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh || mesh.name === 'contact-shadow') return
      if (mesh.geometry && !mesh.geometry.userData.sharedHuman) geometries.add(mesh.geometry)
      for (const material of [mesh.material].flat()) materials.add(material)
    })
  return () => {
    materials.forEach((material) => material.dispose())
    geometries.forEach((geometry) => geometry.dispose())
  }
}

function spectatorSeat(kit: SceneryKit, container: Group): void {
  container.add(
    sceneryBox(kit, { size: [0.6, 0.08, 0.48], at: [0, 0.42, -0.05], colour: 0x44392d }),
  )
  for (const x of [-0.22, 0.22])
    container.add(
      sceneryBox(kit, { size: [0.04, 0.4, 0.3], at: [x, 0.2, -0.05], colour: 0x756244 }),
    )
}

function placeSpectator(container: Group, index: number, arena: boolean): void {
  container.scale.setScalar(arena ? 1 : 0.78)
  container.position.set(
    (index === 0 ? -1 : 1) * (arena ? 2.8 : 1.65),
    arena ? 0.15 : 0.02,
    arena ? -9.5 : -0.85,
  )
}

export function buildBackgroundAudience(
  kit: SceneryKit,
  options: AudienceOptions,
): BackgroundAudience {
  const root = new kit.THREE.Group()
  root.name = 'background-audience'
  const materials = new Map<string, MeshBasicMaterial>()
  const glow = (colour: number, opacity: number) => {
    const key = `${colour}:${opacity}`
    let material = materials.get(key)
    if (!material) {
      material = new kit.THREE.MeshBasicMaterial({
        color: colour,
        opacity,
        transparent: opacity < 1,
      })
      materials.set(key, material)
    }
    return material
  }
  const active = backgroundParticipants(options.context.fight?.())
  const members = options.cast.map((spectator, index) => {
    const identity = active.includes(spectator.identity)
      ? `clash-passenger-${index}`
      : spectator.identity
    const seen = spectatorLook(spectator, identity)
    const profile = humanProfile(seen)
    const pose = profile.frame === 'adult' ? spectator.pose : 'idle'
    seen.human!.pose = pose
    const figure = buildHumanFigure({ THREE: kit.THREE, glow, seen, profile })
    const container = new kit.THREE.Group()
    container.name = `background-spectator:${identity}`
    container.userData.identity = identity
    placeSpectator(container, index, options.arena)
    figure.turns.rotation.y = index === 0 ? 0.12 : -0.12
    container.add(figure.root)
    if (pose === 'seated') spectatorSeat(kit, container)
    if (profile.frame === 'infant') {
      container.position.set(-1.85, 0.55, -0.65)
      container.rotation.z = -1.05
    }
    root.add(container)
    return { figure, container, identity, spectator, pose }
  })
  const dispose = audienceDisposer(
    members.map((member) => member.figure.root),
    materials.values(),
  )
  return {
    root,
    update: (seconds, excitement) => {
      const active = backgroundParticipants(options.context.fight?.())
      const clock = options.context.reducedMotion ? 0 : seconds
      for (const member of members) {
        member.container.visible = !active.includes(member.identity)
        member.figure.animate(clock, member.pose, {
          motion: (rig) =>
            react(rig, member.spectator.reaction, {
              clock,
              excitement: options.context.reducedMotion ? 0 : excitement,
            }),
        })
      }
    },
    dispose,
  }
}
