import { posePreparedCorpse } from './corpseScene'
import { createDolphinPeopleScene } from './dolphinPeopleScene'
import { createLittleEyeScene } from './littleEyeScene'
import {
  buildPreparedVisitModel,
  syncPreparedVisitModel,
  disposePreparedVisitModels,
} from './preparedVisitModels'
import { fineControlReduced } from './fineControlAnchors'
import { LUINI_ROOM_HALF_WIDTH, LUINI_ROOM_HEIGHT } from './luiniSpatial'
import { buildHumanFigure, type HumanLook } from '$lib/tour/humanFigure'
import { humanProfile } from '$lib/tour/humanProfiles'
import { fighterDefinition } from './roster'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { PreparedEntity } from './preparationTypes'
import type { FightState } from './types'

export function createPreparationScene(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const littleEye = createLittleEyeScene(options)
  const people = createDolphinPeopleScene(options)
  const models = new Map<string, import('three').Group>()
  const geometries: import('three').BufferGeometry[] = []
  const materials = new Map<number, import('three').MeshBasicMaterial>()
  const material = (color: number) => {
    if (!materials.has(color)) materials.set(color, new THREE.MeshBasicMaterial({ color }))
    return materials.get(color)!
  }
  const mesh = (geometry: import('three').BufferGeometry, color: number) => {
    geometries.push(geometry)
    return new THREE.Mesh(geometry, material(color))
  }
  const sphere = (size: number, color: number) => mesh(new THREE.SphereGeometry(size, 8, 6), color)
  const box = (size: [number, number, number], color: number) =>
    mesh(new THREE.BoxGeometry(...size), color)

  function build(entry: PreparedEntity) {
    if (
      entry.person ||
      entry.kind === 'morena' ||
      entry.kind === 'supporter' ||
      entry.kind === 'puppet'
    )
      return human(entry)
    const shared = buildPreparedVisitModel(options, entry)
    if (shared) return shared
    const root = new THREE.Group()
    root.name = `prepared:${entry.id}`
    decorate(root, entry)
    return root
  }

  function decorate(root: import('three').Group, entry: PreparedEntity) {
    const builders: Partial<Record<PreparedEntity['kind'], () => void>> = {
      camera: () => {
        const body = box([0.35, 0.23, 0.2], 0x283d43)
        const lens = sphere(0.08, 0x6bc4d4)
        lens.position.z = 0.13
        root.add(body, lens)
        root.position.y = 0.18
      },
      crate: () => {
        const object = box([0.65, 0.75, 0.6], 0x8e623c)
        object.position.y = 0.38
        root.add(object)
      },
      needles: () => {
        for (let index = 0; index < (entry.detachedFaceNeedles ? 3 : 1); index++) {
          const pin = box([0.02, 0.35, 0.02], 0xd8dce1)
          pin.name = `prepared-needle:${index}`
          pin.rotation.z = 1
          pin.position.set(index * 0.08, 0.1, index * 0.04)
          const cap = sphere(0.055, 0xf0ca53)
          cap.position.set(-0.13 + index * 0.08, 0.2, index * 0.04)
          root.add(pin, cap)
        }
      },
      seed: () => seed(root),
      animal: () => animal(root),
      room: () => door(root),
      destination: () => marker(root, 0x6dced2),
      delivery: () => marker(root, 0xe3ce83),
    }
    builders[entry.kind]?.()
  }

  function marker(root: import('three').Group, color: number) {
    const shape = mesh(new THREE.RingGeometry(0.25, 0.33, 24), color)
    shape.rotation.x = -Math.PI / 2
    shape.position.y = 0.02
    root.add(shape)
  }

  function human(entry: PreparedEntity) {
    const morena = entry.kind === 'morena' || entry.copy?.originalKind === 'morena'
    const seen: HumanLook = {
      id: `prepared:${entry.id}`,
      kind: 'combatant',
      spaceId: 'fighting-preparation',
      tierId: 'fighting',
      at: [0, 0],
      y: 0,
      size: 1,
      colour: 0xb7dce3,
      stage: 0,
      hidden: false,
      human: {
        role: morena ? 'morena' : 'fighter',
        identity: preparedHumanIdentity(entry),
        pose: 'idle',
        aura: entry.person || entry.copy ? 'none' : 'ten',
      },
    }
    const figure = buildHumanFigure({
      THREE,
      glow: (color) => material(color),
      seen,
      profile: humanProfile(seen),
    })
    figure.root.scale.setScalar(0.8)
    figure.root.name = `prepared:${entry.id}`
    if (entry.kind === 'supporter') {
      const feather = sphere(0.06, 0xf0e5ac)
      feather.scale.set(1, 2, 0.4)
      feather.position.set(0.12, 0.9, 0.2)
      figure.root.add(feather)
    }
    addCorpseNeedles(figure.root, entry)
    return figure.root
  }

  function addCorpseNeedles(root: import('three').Group, entry: PreparedEntity) {
    if (entry.kind !== 'corpse') return
    const pins = new THREE.Group()
    pins.name = 'corpse-control-needles'
    for (const x of [-0.07, 0.07]) {
      const pin = box([0.015, 0.18, 0.015], 0xdce3e6)
      pin.position.set(x, 1.12, 0.08)
      pins.add(pin)
    }
    root.add(pins)
  }

  function animal(root: import('three').Group) {
    const body = sphere(0.1, 0x9b8f80)
    body.scale.set(1.5, 0.8, 1)
    body.position.y = 0.16
    const head = sphere(0.075, 0xb1a494)
    head.position.set(0.15, 0.21, 0)
    root.add(body, head)
    for (const direction of [-1, 1]) {
      const ear = sphere(0.05, 0xe4b1a1)
      ear.position.set(0.13, 0.28, direction * 0.05)
      root.add(ear)
    }
  }

  function seed(root: import('three').Group) {
    const pot = mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.25, 10), 0x9b6244)
    pot.position.y = 0.13
    const plant = new THREE.Group()
    plant.name = 'growth'
    plant.position.y = 0.25
    const stem = box([0.03, 0.65, 0.03], 0x709f4a)
    stem.position.y = 0.31
    plant.add(stem)
    for (const direction of [-1, 1]) {
      const leaf = sphere(0.14, 0x7db954)
      leaf.scale.set(1, 0.3, 0.6)
      leaf.position.set(direction * 0.11, 0.33, 0)
      plant.add(leaf)
    }
    root.add(pot, plant)
  }

  function door(root: import('three').Group) {
    const frame = box([0.85, 1.7, 0.12], 0x445461)
    frame.position.y = 0.85
    const panel = box([0.68, 1.5, 0.15], 0x916d45)
    panel.position.set(0, 0.78, 0.08)
    panel.name = 'door-panel'
    root.add(frame, panel)
    const width = options.worldX(LUINI_ROOM_HALF_WIDTH) - options.worldX(-LUINI_ROOM_HALF_WIDTH)
    const height = options.worldY(LUINI_ROOM_HEIGHT) - options.worldY(0)
    for (const x of [-width / 2, width / 2]) {
      const wall = box([0.045, height, 0.12], 0x6dced2)
      wall.position.set(x, height / 2, 0)
      root.add(wall)
    }
    const ceiling = box([width, 0.045, 0.12], 0x6dced2)
    ceiling.position.y = height
    root.add(ceiling)
  }

  function syncEntry(context: { entry: PreparedEntity; state: FightState; seconds: number }) {
    const { entry, state, seconds } = context
    let root = models.get(entry.id)
    if (!root) {
      root = build(entry)
      models.set(entry.id, root)
      scene.add(root)
    }
    root.visible = entry.present
    root.position.set(options.worldX(entry.x), options.worldY(entry.y), backgroundDepth(entry))
    posePreparedCorpse(root, entry, state.frame / 60)
    syncStaticAppearance(root, entry)
    syncAnimatedAppearance({
      root,
      entry,
      seconds: fineControlReduced(options) ? 0 : state.frame / 60,
    })
    syncPreparedVisitModel(options, { root, entry, state, seconds })
  }

  return {
    sync(state: FightState, seconds: number) {
      littleEye.sync(state)
      people.sync(state, seconds)
      const entries = (state.battlefield?.entities ?? []).filter(
        (entry) => entry.kind !== 'device' && !entry.writingKit && !entry.weakSpirit,
      )
      const active = new Set(entries.map((entry) => entry.id))
      for (const entry of entries) syncEntry({ entry, state, seconds })
      for (const [id, root] of models) {
        if (active.has(id)) continue
        disposePreparedVisitModels(root)
        scene.remove(root)
        models.delete(id)
      }
    },
    dispose() {
      littleEye.dispose()
      people.dispose()
      for (const root of models.values()) {
        disposePreparedVisitModels(root)
        scene.remove(root)
      }
      geometries.forEach((held) => held.dispose())
      materials.forEach((held) => held.dispose())
      models.clear()
    },
  }
}

function backgroundDepth(entry: PreparedEntity): number {
  return ['person', 'morena', 'supporter', 'room'].includes(entry.kind) ? -1.4 : 0.4
}

function syncStaticAppearance(root: import('three').Group, entry: PreparedEntity) {
  if (entry.copy)
    root.traverse((part) => {
      if (part.name.startsWith('manga-head:')) part.visible = entry.copy!.headAttached
    })
  const growth = root.getObjectByName('growth')
  if (growth) growth.scale.setScalar(entry.growth ? 1 : 0.05)
  const panel = root.getObjectByName('door-panel')
  if (panel) panel.rotation.y = entry.sealed ? 0 : 1.3
  if (entry.kind === 'crate') root.scale.y = entry.health > 0 ? 1 : 0.15
}

function syncAnimatedAppearance(context: {
  root: import('three').Group
  entry: PreparedEntity
  seconds: number
}) {
  const { root, entry, seconds } = context
  syncPreparedSleep(root, entry)
  if (entry.littleEye) root.rotation.y = entry.littleEye.facing === 1 ? 0 : Math.PI
  if (entry.person) root.rotation.z = entry.person.loan?.blackoutFrames ? -1.4 : 0
  if (entry.kind === 'supporter') root.rotation.z = entry.sleepingFrames ? -0.5 : 0
  if (entry.kind === 'bird' && entry.controller) root.rotation.z = Math.sin(seconds * 12) * 0.12
}

function preparedHumanIdentity(entry: PreparedEntity): string {
  if (entry.person) return entry.person.identity
  if (entry.copy?.appearanceModel) return entry.copy.appearanceModel
  if (entry.copy?.appearance) return fighterDefinition(entry.copy.appearance).modelId
  return entry.kind === 'morena' || entry.copy?.originalKind === 'morena'
    ? 'morena-prudo'
    : 'halkenburg-supporter'
}

function syncPreparedSleep(root: import('three').Group, entry: PreparedEntity) {
  if (entry.person) root.rotation.z = entry.person.loan?.blackoutFrames ? -Math.PI / 2 : 0
}
