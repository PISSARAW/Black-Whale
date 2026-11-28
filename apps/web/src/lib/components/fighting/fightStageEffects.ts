import { createFightMotionTrailScene } from '$lib/fighting/fightMotionTrailScene'
import { createKurapikaSpeedScene } from '$lib/fighting/kurapikaSpeedScene'
import { createFeitanSpeedScene } from '$lib/fighting/feitanSpeedScene'
import { createFightCollisionScene } from '$lib/fighting/fightCollisionScene'
import { createLsdfScene } from '$lib/fighting/lsdfScene'
import { createPredatorScene } from '$lib/fighting/predatorScene'
import { createHanzoProjectionScene } from '$lib/fighting/kameos/stageScene'
import { createProjectileScene } from '$lib/fighting/projectileScene'
import { createFighterEffectScene } from '$lib/fighting/fighterEffectScene'
import { createFeitanScene } from '$lib/fighting/feitanScene'
import type { Object3D } from 'three'
import type { FightSide, FightState } from '$lib/fighting/types'
import type { FightComfort } from '$lib/fighting/fightComfort'

interface StageEffectSetup extends Pick<
  Parameters<typeof createProjectileScene>[0],
  'THREE' | 'scene' | 'glow' | 'geometry' | 'worldX' | 'worldY'
> {
  visualComfort: () => FightComfort
  viewer: () => FightSide
  readState: () => FightState
  buildReference: Parameters<typeof createHanzoProjectionScene>[0]['buildFighter']
  throwFrame: NonNullable<Parameters<typeof createFighterEffectScene>[0]['throwFrame']>
  rootOf: (side: FightSide) => Object3D
  figureOf: (side: FightSide) => Object3D
}

export function createFightStageEffects({
  THREE,
  scene,
  glow,
  geometry,
  visualComfort,
  worldX,
  worldY,
  viewer,
  readState,
  buildReference,
  throwFrame,
  rootOf,
  figureOf,
}: StageEffectSetup) {
  const collisions = createFightCollisionScene({ THREE, scene })
  const projectileScene = createProjectileScene({
    viewer,
    comfort: visualComfort,
    THREE,
    scene,
    glow,
    geometry,
    worldX,
    worldY,
  })
  const projectionScene = createHanzoProjectionScene({
    scene,
    buildFighter: buildReference,
    worldX,
  })
  const fighterEffects = createFighterEffectScene({
    throwFrame,
    comfort: visualComfort,
    viewer,
    THREE,
    scene,
    worldX,
    worldY,
    figureOf,
    handAnchor: (side, hand) => {
      const lead = readState()[side].facing === 1 ? 'right' : 'left'
      const limb = hand === 'lead' ? lead : lead === 'right' ? 'left' : 'right'
      return rootOf(side).getObjectByName(`hand-${limb}`)
    },
  })
  const lsdfScene = createLsdfScene({ THREE, scene, glow, worldX })
  const predatorScene = createPredatorScene({ THREE, scene, glow, worldX, worldY })
  const feitanScene = createFeitanScene({
    THREE,
    scene,
    worldX,
    worldY,
    figureOf,
    comfort: visualComfort,
  })
  const motionTrails = createFightMotionTrailScene({
    THREE,
    scene,
    comfort: visualComfort,
    figureOf,
  })
  const feitanSpeed = createFeitanSpeedScene({
    THREE,
    scene,
    comfort: visualComfort,
    figureOf: rootOf,
    worldX,
    worldY,
  })
  const kurapikaSpeed = createKurapikaSpeedScene({
    THREE,
    scene,
    comfort: visualComfort,
    figureOf: rootOf,
  })

  return {
    collisions,
    projectileScene,
    projectionScene,
    fighterEffects,
    lsdfScene,
    predatorScene,
    feitanScene,
    motionTrails,
    feitanSpeed,
    kurapikaSpeed,
  }
}
