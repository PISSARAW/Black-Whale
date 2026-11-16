import type { Group } from 'three'
import { humanProfile } from '../tour/humanProfiles'
import { sceneryBox, type SceneryKit } from './stageKit'
import { fightStage, type FightStageId } from './stages'
import { backgroundArt } from './stageBackgroundArt'
import { buildBackgroundAudience } from './stageBackgroundSpectators'
import { backgroundModelKit, buildBackgroundProp } from './stageBackgroundProps'
import { ANIMAL_EVENTS } from './stageBackgroundAnimals'
import { MECHANICAL_EVENTS } from './stageBackgroundMechanisms'
import { APPARITION_EVENTS } from './stageBackgroundApparitions'
import { STAGE_BACKGROUNDS } from './stageBackgroundCatalogue'
import type { StageBackgroundContext } from './stageBackgroundTypes'
import type {
  BackgroundElement,
  BackgroundFrame,
  BackgroundEvent,
} from './stageBackgroundSceneTypes'
import type { EventBuilder } from './stageBackgroundEventTypes'

export interface BackgroundPart {
  root: Group
  update: (frame: BackgroundFrame) => void
  dispose: () => void
}
interface ItemContext {
  stageId: FightStageId
  context: StageBackgroundContext
}
type ArtElement = Extract<BackgroundElement, { kind: 'art' }>
type ObjectElement = Extract<BackgroundElement, { kind: 'object' }>
const EVENT_BUILDERS = {
  ...ANIMAL_EVENTS,
  ...MECHANICAL_EVENTS,
  ...APPARITION_EVENTS,
} satisfies Record<BackgroundEvent, EventBuilder>

function portrait(stageId: FightStageId) {
  const person = STAGE_BACKGROUNDS[stageId].spectators[0]
  const identity = stageId === 'tserriednich-salon' ? 'prince-tserriednich' : person.identity
  const name = stageId === 'tserriednich-salon' ? 'Tserriednich' : person.name
  return {
    name,
    profile: humanProfile({
      id: identity,
      kind: 'combatant',
      spaceId: 'background',
      tierId: 'clash',
      at: [0, 0],
      y: 0,
      size: 1,
      colour: 0,
      hidden: false,
      stage: 0,
      human: { identity, role: 'witness', pose: 'idle', aura: 'none' },
    }),
  }
}
function pictureBacking(kit: SceneryKit, root: Group, element: ArtElement): void {
  const { size, medium } = element
  if (medium === 'floor-mark') return
  if (medium === 'graffiti') {
    root.add(
      sceneryBox(kit, {
        size: [size * 1.12, size * 1.12, 0.5],
        at: [0, 0, -0.27],
        colour: 0x74654b,
      }),
    )
    for (const x of [-0.4, 0.4])
      root.add(
        sceneryBox(kit, {
          size: [0.045, size * 1.15, 0.025],
          at: [x * size, 0, -0.005],
          colour: 0xb4a17a,
        }),
      )
    return
  }
  const height = medium === 'monitor' ? size * 0.6 : size * 1.25
  const colour = medium === 'portrait' ? 0xa18a5e : 0x454f52
  root.add(
    sceneryBox(kit, { size: [size + 0.08, height + 0.08, 0.05], at: [0, 0, -0.035], colour }),
  )
  // A hanging frame/notice rather than another gallery easel in every room.
  root.add(
    sceneryBox(kit, {
      size: [0.018, 0.55, 0.018],
      at: [0, height / 2 + 0.28, -0.035],
      colour: 0x8c8c7c,
    }),
  )
}
function picture(kit: SceneryKit, element: ArtElement, stageId: FightStageId): BackgroundPart {
  const definition = STAGE_BACKGROUNDS[stageId]
  const texture = backgroundArt(kit, {
    image: definition.image,
    accent: fightStage(stageId).swatch[1],
    medium: element.medium,
    portrait: portrait(stageId),
  })
  const transparent = ['graffiti', 'floor-mark'].includes(element.medium)
  const material = new kit.THREE.MeshBasicMaterial({
    map: texture,
    transparent,
    side: kit.THREE.DoubleSide,
    depthWrite: !transparent,
    opacity: element.medium === 'floor-mark' ? 0.6 : 1,
  })
  const root = new kit.THREE.Group()
  root.name = `background-art:${element.medium}`
  const aspect = element.medium === 'monitor' ? 0.6 : 1.25
  root.add(
    new kit.THREE.Mesh(
      kit.geometry(new kit.THREE.PlaneGeometry(element.size, element.size * aspect)),
      material,
    ),
  )
  pictureBacking(kit, root, element)
  root.position.set(...element.at)
  root.rotation.z = element.tilt ?? 0
  if (element.medium === 'floor-mark') root.rotation.x = -Math.PI / 2
  return {
    root,
    update: () => undefined,
    dispose: () => {
      texture.dispose()
      material.dispose()
    },
  }
}
function support(kit: SceneryKit, root: Group, element: ObjectElement): void {
  if (!element.support) return
  const top = Math.max(0.08, element.at[1] - 0.2 * (element.size ?? 1))
  const localY = top - element.at[1]
  if (element.support === 'crate') {
    root.add(
      sceneryBox(kit, {
        size: [0.8, top, 0.45],
        at: [0, top / 2 - element.at[1], -0.03],
        colour: 0x78684d,
      }),
    )
    return
  }
  const width = element.support === 'table' ? 0.95 : 0.65
  root.add(sceneryBox(kit, { size: [width, 0.04, 0.35], at: [0, localY, 0], colour: 0x6a5a42 }))
  for (const x of [-width * 0.38, width * 0.38])
    root.add(
      sceneryBox(kit, {
        size: [0.035, top, 0.15],
        at: [x, top / 2 - element.at[1], 0],
        colour: 0x6a5a42,
      }),
    )
}
function prop(kit: SceneryKit, element: ObjectElement): BackgroundPart {
  const root = new kit.THREE.Group()
  root.name = `background-object:${element.object}`
  root.position.set(...element.at)
  const model = buildBackgroundProp(kit, element.object)
  model.scale.setScalar(element.size ?? 1)
  if (!element.support && element.at[1] < 0.3 && ['card', 'feather'].includes(element.object))
    model.rotation.x = -Math.PI / 2
  root.add(model)
  support(kit, root, element)
  const restZ = model.rotation.z
  const motions = {
    still: (_frame: BackgroundFrame) => undefined,
    rock: ({ seconds }: BackgroundFrame) => {
      model.rotation.z = restZ + Math.sin(seconds * 0.9) * 0.1
    },
    spin: ({ seconds }: BackgroundFrame) => {
      model.rotation.y = seconds * 0.5
    },
    roll: ({ seconds }: BackgroundFrame) => {
      model.position.x = Math.sin(seconds * 0.5) * 0.65
      model.rotation.z = restZ - Math.sin(seconds * 0.5) * 3
    },
    drift: ({ seconds }: BackgroundFrame) => {
      model.position.x = Math.sin(seconds * 0.6) * 0.15
      model.position.y = Math.sin(seconds * 0.8) * 0.08
      model.rotation.z = restZ + Math.sin(seconds) * 0.2
    },
  }
  return { root, update: motions[element.motion ?? 'still'], dispose: () => undefined }
}
function event(
  kit: SceneryKit,
  element: Extract<BackgroundElement, { kind: 'event' }>,
): BackgroundPart {
  const p = backgroundModelKit(kit)
  const motion = EVENT_BUILDERS[element.event](p, element)
  const root = new kit.THREE.Group()
  root.name = `background-event:${element.event}`
  root.position.set(...element.at)
  root.scale.setScalar(element.size ?? 1)
  root.add(p.root)
  return { root, update: motion, dispose: () => undefined }
}

export function buildBackgroundItem(
  kit: SceneryKit,
  element: BackgroundElement,
  options: ItemContext,
): BackgroundPart {
  const builders = {
    cameo: (item: Extract<BackgroundElement, { kind: 'cameo' }>): BackgroundPart => {
      const audience = buildBackgroundAudience(kit, {
        cast: STAGE_BACKGROUNDS[options.stageId].spectators,
        placements: item.people,
        context: options.context,
      })
      return {
        root: audience.root,
        update: ({ seconds, excitement }) => audience.update(seconds, excitement),
        dispose: audience.dispose,
      }
    },
    art: (item: ArtElement) => picture(kit, item, options.stageId),
    object: (item: ObjectElement) => prop(kit, item),
    event: (item: Extract<BackgroundElement, { kind: 'event' }>) => event(kit, item),
  }
  // Keep the discriminant narrow at the dispatch boundary.
  if (element.kind === 'cameo') return builders.cameo(element)
  if (element.kind === 'art') return builders.art(element)
  if (element.kind === 'object') return builders.object(element)
  return builders.event(element)
}
