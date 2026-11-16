import type { Group, MeshBasicMaterial, Texture } from 'three'
import { fightStage, type FightStageId } from './stages'
import { sceneryBox, type SceneryKit } from './stageKit'
import { STAGE_BACKGROUNDS } from './stageBackgroundCatalogue'
import { backgroundArt } from './stageBackgroundArt'
import { buildBackgroundAudience } from './stageBackgroundSpectators'
import { buildBackgroundProp } from './stageBackgroundProps'
import type { StageBackgroundContext } from './stageBackgroundTypes'

export interface StageBackground {
  root: Group
  update: (seconds: number) => void
  dispose: () => void
}

function addPicture(
  kit: SceneryKit,
  stageId: FightStageId,
): { root: Group; texture: Texture; material: MeshBasicMaterial } {
  const { THREE } = kit
  const arena = stageId === 'heavens-arena'
  const image = STAGE_BACKGROUNDS[stageId].image
  const texture = backgroundArt(kit, image, fightStage(stageId).swatch[1])
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
  const root = new THREE.Group()
  root.name = `background-image:${image.motif}`
  root.userData.caption = image.caption
  const size = arena ? 1.7 : 1.05
  root.add(
    sceneryBox(kit, {
      size: [size + 0.1, size * 1.25 + 0.1, 0.065],
      at: [0, 0, -0.045],
      colour: 0x9e895b,
    }),
  )
  root.add(new THREE.Mesh(kit.geometry(new THREE.PlaneGeometry(size, size * 1.25)), material))
  root.position.set(arena ? 0 : 3.55, arena ? 3.2 : 2.15, arena ? -9.2 : -0.98)
  if (stageId === 'hull-suspension') root.position.y = 3.1
  // Gallery easel: the picture never floats in open-air stages.
  root.add(
    sceneryBox(kit, {
      size: [0.055, root.position.y, 0.06],
      at: [0, -root.position.y / 2, -0.08],
      colour: 0x736348,
    }),
  )
  root.add(
    sceneryBox(kit, {
      size: [size * 0.7, 0.045, 0.4],
      at: [0, -root.position.y + 0.03, -0.08],
      colour: 0x736348,
    }),
  )
  return { root, texture, material }
}

function backgroundEvent(context: StageBackgroundContext) {
  const state = context.fight?.()
  return {
    round: state?.roundNumber ?? 0,
    phase: state?.phase ?? 'ready',
    impact: state?.impact?.sequence ?? -1,
  }
}

function backgroundReactions(context: StageBackgroundContext): (seconds: number) => number {
  let previous = backgroundEvent(context)
  let started = -100
  return (seconds) => {
    const event = backgroundEvent(context)
    if (event.round !== previous.round || event.phase === 'ready') started = -100
    else if (
      (event.impact > 0 && event.impact !== previous.impact) ||
      (event.phase === 'finished' && previous.phase !== 'finished')
    )
      started = seconds
    previous = event
    return Math.max(0, 1 - (seconds - started) / 1.8)
  }
}

/** Cosmetic only. Reads impacts; never writes fighters, RNG, supports or room clearance. */
export function buildStageBackground(
  kit: SceneryKit,
  stageId: FightStageId,
  context: StageBackgroundContext = {},
): StageBackground {
  const root = new kit.THREE.Group()
  root.name = `stage-background:${stageId}`
  root.userData.decorative = true
  const definition = STAGE_BACKGROUNDS[stageId]
  const arena = stageId === 'heavens-arena'
  const audience = buildBackgroundAudience(kit, { cast: definition.spectators, arena, context })
  const picture = addPicture(kit, stageId)
  const prop = buildBackgroundProp(kit, definition.secret.motif)
  const display = new kit.THREE.Group()
  display.name = 'background-keepsake'
  display.position.set(arena ? -4.4 : -3.55, arena ? 0.65 : 0.68, arena ? -9.1 : -0.85)
  display.add(prop)
  display.add(sceneryBox(kit, { size: [0.58, 0.06, 0.46], at: [0, -0.33, 0], colour: 0x685b41 }))
  display.add(sceneryBox(kit, { size: [0.11, 0.35, 0.11], at: [0, -0.51, 0], colour: 0x685b41 }))
  prop.userData.caption = definition.secret.caption
  root.add(audience.root, picture.root, display)
  const excitement = backgroundReactions(context)
  let disposed = false
  return {
    root,
    update: (seconds) => {
      audience.update(seconds, excitement(seconds))
      if (context.reducedMotion) return
      prop.position.y = Math.sin(seconds * 1.25) * 0.035
      prop.rotation.y = Math.sin(seconds * 0.6) * 0.28
      prop.rotation.z = Math.sin(seconds * 1.1) * 0.08
    },
    dispose: () => {
      if (disposed) return
      disposed = true
      audience.dispose()
      picture.texture.dispose()
      picture.material.dispose()
    },
  }
}
