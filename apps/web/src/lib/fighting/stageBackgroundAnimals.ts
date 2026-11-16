import { buildBackgroundProp, type BackgroundModelKit } from './stageBackgroundProps'
import type { EventBuilder, EventDefinition, EventMotion } from './stageBackgroundEventTypes'

function porthole(p: BackgroundModelKit, definition: EventDefinition): EventMotion {
  p.put(
    new p.THREE.Mesh(p.geometry(new p.THREE.CircleGeometry(0.64, 32)), p.glow(0x285b70, 1)),
    [0, 0, 0],
  )
  p.put(
    new p.THREE.Mesh(
      p.geometry(new p.THREE.TorusGeometry(0.66, 0.035, 6, 32)),
      p.glow(0x82979a, 1),
    ),
    [0, 0, 0.01],
  )
  const shadow = new p.THREE.Group()
  const body = p.ball([0.23, 0.1, 0.025], [0, 0, 0.04], 0x102b3a)
  shadow.add(body)
  const tail = p.box([0.15, 0.13, 0.02], [-0.24, 0.03, 0.04], 0x102b3a)
  tail.rotation.z = Math.PI / 4
  shadow.add(tail)
  p.root.add(shadow)
  return ({ seconds }) => {
    const cycle = seconds % (definition.period ?? 17)
    shadow.visible = cycle < 5
    shadow.position.set(Math.sin((cycle / 5) * Math.PI * 2) * 0.27, Math.cos(cycle) * 0.06, 0)
  }
}

function distantBoat(p: BackgroundModelKit, definition: EventDefinition): EventMotion {
  p.box([2.5, 0.74, 0.035], [0, 0, -0.08], 0x1f4657)
  for (let i = 0; i < 4; i++) p.box([2.3, 0.012, 0.02], [0, i * 0.13 - 0.29, -0.04], 0x749ba3)
  const boat = new p.THREE.Group()
  boat.add(p.box([0.55, 0.08, 0.06], [0, 0, 0.02], 0xced5cc))
  boat.add(p.box([0.35, 0.1, 0.05], [0, 0.08, 0.02], 0xbac5c3))
  for (let i = 0; i < 3; i++)
    boat.add(p.box([0.04, 0.1, 0.04], [i * 0.1 - 0.1, 0.16, 0.02], 0x293641))
  p.root.add(boat)
  return ({ seconds }) => {
    boat.position.x = (((seconds / (definition.period ?? 29)) % 1) - 0.5) * 1.7
    boat.position.y = Math.sin(seconds * 0.7) * 0.018
  }
}

function cat(p: BackgroundModelKit, definition: EventDefinition): EventMotion {
  p.ball([0.26, 0.14, 0.12], [0, 0.23, 0], 0x252332)
  const head = buildBackgroundProp(p, 'cat')
  head.scale.setScalar(0.65)
  head.position.set(0.23, 0.37, 0)
  p.root.add(head)
  const legs = [-0.13, 0.13].flatMap((x) =>
    [-0.07, 0.07].map((z) => p.box([0.045, 0.17, 0.045], [x, 0.1, z], 0x252332)),
  )
  const tail = p.put(
    new p.THREE.Mesh(
      p.geometry(new p.THREE.TorusGeometry(0.16, 0.025, 6, 14, Math.PI)),
      p.glow(0x252332, 1),
    ),
    [-0.28, 0.35, 0],
  )
  return ({ seconds }) => {
    const cycle = seconds % (definition.period ?? 19)
    const walking = cycle < 7
    p.root.position.x = Math.sin((Math.min(cycle, 7) / 7) * Math.PI * 2) * 0.7
    legs.forEach((leg, index) => {
      leg.rotation.z = walking ? Math.sin(seconds * 7 + index * Math.PI) * 0.35 : 0
    })
    tail.rotation.y = Math.sin(seconds * 0.8) * 0.2
    head.rotation.y = walking ? -0.2 : Math.sin(seconds * 0.35) * 0.45
  }
}

function bird(p: BackgroundModelKit, definition: EventDefinition): EventMotion {
  p.box([0.9, 0.04, 0.1], [0, -0.14, 0], 0x81725c)
  p.box([0.04, 1.3, 0.04], [0, -0.79, 0], 0x81725c)
  p.ball([0.14, 0.17, 0.1], [0, 0.05, 0], 0xc7c9b7)
  p.ball([0.1, 0.1, 0.085], [0.07, 0.24, 0], 0xc7c9b7)
  p.ball([0.018, 0.018, 0.015], [0.1, 0.26, 0.08], 0x172b33)
  p.box([0.11, 0.035, 0.035], [0.17, 0.22, 0], 0xd8b26c)
  const wings = [-1, 1].map((side) => p.ball([0.13, 0.05, 0.06], [side * 0.13, 0.07, 0], 0x6c8c98))
  return ({ seconds }) => {
    const flutter = seconds % (definition.period ?? 16) < 2
    wings.forEach((wing, index) => {
      wing.rotation.z = flutter ? Math.sin(seconds * 8) * (index === 0 ? -0.7 : 0.7) : 0
    })
  }
}

function aquarium(p: BackgroundModelKit): EventMotion {
  p.box([1.2, 0.07, 0.5], [0, 0.8, 0], 0x574c3b)
  for (const x of [-0.48, 0.48]) p.box([0.06, 0.78, 0.35], [x, 0.39, 0], 0x574c3b)
  p.box([1.2, 0.05, 0.5], [0, 1.32, 0], 0x7b8d8a)
  p.put(
    new p.THREE.Mesh(p.geometry(new p.THREE.BoxGeometry(1.1, 0.45, 0.38)), p.glow(0x6ea8b3, 0.2)),
    [0, 1.06, 0],
  )
  const fish = [-1, 1].map((side) =>
    p.ball([0.12, 0.055, 0.03], [side * 0.25, 1.02, 0.03], side === 1 ? 0xd0a55b : 0xb7dbcf),
  )
  const bubbles = Array.from({ length: 3 }, (_, i) =>
    p.ball([0.018, 0.018, 0.018], [-0.4, 0.9 + i * 0.1, 0.07], 0xc2e4e2),
  )
  return ({ seconds }) => {
    fish.forEach((shape, i) => {
      shape.position.x = Math.sin(seconds * 0.45 + i * Math.PI) * 0.32
      shape.position.y = 1.04 + Math.cos(seconds * 0.6 + i) * 0.08
    })
    bubbles.forEach((bubble, i) => {
      bubble.position.y = 0.87 + ((seconds * 0.1 + i * 0.1) % 0.4)
    })
  }
}

export const ANIMAL_EVENTS = {
  'porthole-shadow': porthole,
  'distant-boat': distantBoat,
  'cat-prowl': cat,
  bird,
  aquarium,
} satisfies Partial<Record<EventDefinition['event'], EventBuilder>>
