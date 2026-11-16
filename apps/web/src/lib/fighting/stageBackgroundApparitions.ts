import { buildBackgroundProp, type BackgroundModelKit } from './stageBackgroundProps'
import {
  eventDrive,
  type EventBuilder,
  type EventDefinition,
  type EventMotion,
} from './stageBackgroundEventTypes'

function projector(p: BackgroundModelKit, definition: EventDefinition): EventMotion {
  p.box([1.8, 1.05, 0.045], [0, 0, -0.08], 0x18202b)
  const film = new p.THREE.Group()
  for (const side of [-1, 1])
    for (let i = 0; i < 7; i++) {
      film.add(p.box([0.055, 0.055, 0.015], [side * 0.77, i * 0.14 - 0.42, -0.02], 0x9b9785))
    }
  const card = buildBackgroundProp(p, 'card')
  card.scale.setScalar(1.15)
  card.position.z = -0.015
  film.add(card)
  const reel = buildBackgroundProp(p, 'reel')
  reel.position.set(0.4, 0, -0.015)
  film.add(reel)
  p.root.add(film)
  return ({ seconds }) => {
    // A brief second image, rather than a strobing projector effect.
    const cycle = seconds % (definition.period ?? 23)
    card.visible = cycle < 4
    reel.visible = cycle >= 4
    reel.rotation.z = seconds * 0.3
    card.rotation.z = Math.sin(seconds * 0.5) * 0.12
  }
}
function door(p: BackgroundModelKit, definition: EventDefinition): EventMotion {
  const flower = definition.event === 'flower-door'
  p.box([0.92, 1.88, 0.06], [0, 0.94, -0.08], flower ? 0x354e59 : 0x11151f)
  for (const x of [-0.49, 0.49]) p.box([0.055, 1.94, 0.08], [x, 0.97, 0], 0x92826a)
  p.box([1.04, 0.055, 0.08], [0, 1.95, 0], 0x92826a)
  const hinge = new p.THREE.Group()
  hinge.position.set(-0.45, 0, 0)
  hinge.add(p.box([0.9, 1.87, 0.04], [0.45, 0.94, 0], flower ? 0x5a7b75 : 0x3c3639))
  hinge.add(p.ball([0.025, 0.025, 0.025], [0.8, 0.9, 0.04], 0xcbb684))
  p.root.add(hinge)
  const eyes = [-0.07, 0.07].map((x) => p.ball([0.035, 0.012, 0.008], [x, 1.45, -0.03], 0xd9c88d))
  if (flower)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      p.ball(
        [0.055, 0.07, 0.025],
        [Math.sin(angle) * 0.13, 1.94 + Math.cos(angle) * 0.13, 0.05],
        0xd4abc4,
      )
    }
  return (frame) => {
    const drive = eventDrive(frame, definition)
    hinge.rotation.y = -Math.pow(drive, 5) * 1.3
    eyes.forEach((eye) => {
      eye.visible = !flower && drive > 0.8
    })
  }
}
function paper(p: BackgroundModelKit, definition: EventDefinition): EventMotion {
  const papers = Array.from({ length: 4 }, (_, i) => {
    const card = buildBackgroundProp(p, i === 3 ? 'feather' : 'card')
    card.scale.setScalar(0.35)
    card.position.set((i - 1.5) * 0.25, -i * 0.08, -0.04)
    p.root.add(card)
    return card
  })
  return (frame) => {
    const drive = eventDrive(frame, definition)
    p.root.visible = drive > 0.01
    papers.forEach((card, i) => {
      card.position.y = -(1 - drive) * 0.8 - i * 0.1
      card.position.x = (i - 1.5) * 0.25 + Math.sin(frame.seconds + i) * 0.12
      card.rotation.z = Math.sin(frame.seconds * 1.2 + i) * 0.4
    })
  }
}
function memorial(p: BackgroundModelKit): EventMotion {
  const lights = Array.from({ length: 14 }, (_, i) => {
    const x = (i - 6.5) * 0.24
    p.box([0.09, 0.12, 0.1], [x, 0.06, -Math.abs(x) * 0.08], 0x786342)
    return p.ball([0.025, 0.045, 0.025], [x, 0.15, -Math.abs(x) * 0.08], 0xe0c27f)
  })
  return ({ seconds }) =>
    lights.forEach((light, i) => {
      light.scale.y = 0.045 * (0.9 + Math.sin(seconds * 0.5 + i * 0.3) * 0.08)
    })
}
function mobile(p: BackgroundModelKit): EventMotion {
  p.box([0.025, 0.35, 0.025], [0, 0.2, 0], 0xb9b3a2)
  const swing = new p.THREE.Group()
  swing.add(p.box([1, 0.02, 0.02], [0, 0, 0], 0xb9b3a2))
  for (const [index, kind] of (['toy', 'boat', 'coin'] as const).entries()) {
    const x = (index - 1) * 0.4
    swing.add(p.box([0.008, 0.26, 0.008], [x, -0.13, 0], 0xb9b3a2))
    const toy = buildBackgroundProp(p, kind)
    toy.scale.setScalar(0.35)
    toy.position.set(x, -0.36, 0)
    swing.add(toy)
  }
  p.root.add(swing)
  return ({ seconds }) => {
    swing.rotation.y = Math.sin(seconds * 0.3) * 0.3
    swing.rotation.z = Math.sin(seconds * 0.7) * 0.025
  }
}
function windBell(p: BackgroundModelKit): EventMotion {
  p.box([0.02, 0.4, 0.02], [0, 0.2, 0], 0xb7b19a)
  const bell = new p.THREE.Group()
  const dome = p.put(
    new p.THREE.Mesh(
      p.geometry(new p.THREE.ConeGeometry(0.15, 0.22, 12, 1, true)),
      p.glow(0x8eafaa, 1),
    ),
    [0, -0.08, 0],
  )
  bell.add(dome)
  bell.add(p.box([0.01, 0.5, 0.01], [0, -0.32, 0], 0xb7b19a))
  const ribbon = p.box([0.12, 0.26, 0.015], [0, -0.61, 0], 0xdacba8)
  bell.add(ribbon)
  p.root.add(bell)
  return ({ seconds }) => {
    bell.rotation.z = Math.sin(seconds * 0.9) * 0.15
    ribbon.rotation.y = Math.sin(seconds * 1.1) * 0.25
  }
}
export const APPARITION_EVENTS = {
  projector,
  'door-eyes': door,
  'flower-door': door,
  'paper-drift': paper,
  'memorial-lights': memorial,
  mobile,
  'wind-bell': windBell,
} satisfies Partial<Record<EventDefinition['event'], EventBuilder>>
