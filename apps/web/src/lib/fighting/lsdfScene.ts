import { buildLsdfGuard } from '$lib/tour/apparitionLsdfView'
import { buildHumanFigure, type HumanLook } from '$lib/tour/humanFigure'
import { humanProfile } from '$lib/tour/humanProfiles'
import { inMorenasHideout } from './fightEnvironment'
import type { FightSide, FightState } from './types'

interface LsdfSceneOptions {
  THREE: typeof import('three')
  scene: import('three').Scene
  glow: (colour: number, opacity: number) => import('three').MeshBasicMaterial
  worldX: (value: number) => number
}

/** The same numbered guards as the visit; they escort rather than throw punches. */
export function createLsdfScene(options: LsdfSceneOptions) {
  const { scene, worldX } = options
  const guards = new Map<FightSide, { level: number; root: import('three').Group }>()
  let morena: ReturnType<typeof buildHumanFigure> | undefined

  function syncGuard(state: FightState, side: FightSide, seconds: number) {
    const guard = state.lsdf?.[side]
    let model = guards.get(side)
    if (!guard) {
      if (model) model.root.visible = false
      return
    }
    if (!model || model.level !== guard.level) {
      if (model) disposeRoot(model.root)
      model = { level: guard.level, root: guardFormation(options, guard.level) }
      guards.set(side, model)
      scene.add(model.root)
    }
    model.root.visible = true
    model.root.position.set(worldX(guard.x), 0.77 + Math.sin(seconds * 8) * 0.015, -0.2)
    const heading = guard.phase === 'escorting' ? guard.exitX : state[guard.target].x
    model.root.rotation.y = (heading >= guard.x ? 1 : -1) * 0.7
  }

  return {
    sync(state: FightState, seconds: number) {
      const present = inMorenasHideout(state.environment)
      if (present && !morena) {
        morena = buildMorena(options)
        scene.add(morena.root)
      }
      if (morena) morena.root.visible = present
      if (!present) {
        for (const model of guards.values()) model.root.visible = false
        return
      }
      morena?.animate(seconds, 'idle')
      for (const side of ['player', 'opponent'] as const) syncGuard(state, side, seconds)
    },
    dispose() {
      for (const model of guards.values()) disposeRoot(model.root)
      if (morena) disposeRoot(morena.root)
      guards.clear()
    },
  }
}

function buildMorena({ THREE, glow }: LsdfSceneOptions) {
  const seen: HumanLook = {
    id: 'fighting:morena-witness',
    kind: 'combatant',
    tierId: 'interior-heilly-hideout',
    spaceId: 'tier-2-heilly-secret-hideout-corridor',
    at: [0, 0],
    y: 0,
    size: 1,
    colour: 0xd4c58b,
    stage: 0,
    hidden: false,
    human: { role: 'morena', identity: 'morena-prudo', pose: 'idle', aura: 'ten' },
  }
  const morena = buildHumanFigure({ THREE, glow, seen, profile: humanProfile(seen) })
  morena.root.position.set(0, 0, -2)
  return morena
}

function guardFormation(options: LsdfSceneOptions, level: number) {
  const root = new options.THREE.Group()
  root.name = 'fighting-lsdf-guards'
  const context = { ...options, root, skin: options.glow(0xe8e5da, 1) }
  for (let index = 0; index < 7; index++) {
    const row = Math.floor((index + 1) / 2)
    root.add(
      buildLsdfGuard(context, {
        level,
        scale: 0.55,
        at: [index === 0 ? 0 : (index % 2 ? -1 : 1) * 0.55, 0, -row * 0.55],
      }),
    )
  }
  return root
}

function disposeRoot(root: import('three').Object3D): void {
  root.removeFromParent()
  root.traverse((object) => {
    const mesh = object as import('three').Mesh
    mesh.geometry?.dispose()
  })
}
