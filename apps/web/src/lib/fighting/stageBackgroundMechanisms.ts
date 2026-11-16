import { buildBackgroundProp, type BackgroundModelKit } from './stageBackgroundProps'
import {
  eventDrive,
  type EventBuilder,
  type EventDefinition,
  type EventMotion,
} from './stageBackgroundEventTypes'

function table(p: BackgroundModelKit): void {
  p.box([1.05, 0.06, 0.55], [0, 0.77, 0], 0x65523c)
  for (const x of [-0.4, 0.4]) p.box([0.055, 0.74, 0.4], [x, 0.37, 0], 0x65523c)
}
function tea(p: BackgroundModelKit, definition: EventDefinition): EventMotion {
  table(p)
  const cups = [-0.25, 0.25].map((x) => {
    const cup = buildBackgroundProp(p, 'cup')
    cup.scale.setScalar(0.65)
    cup.position.set(x, 0.9, 0)
    p.root.add(cup)
    return cup
  })
  const steam = cups.map((cup) => p.ball([0.025, 0.08, 0.025], [cup.position.x, 1.14, 0], 0xb5b6a6))
  return (frame) => {
    const drive = eventDrive(frame, definition)
    cups.forEach((cup, i) => {
      cup.rotation.z = Math.sin(frame.seconds * 7 + i) * drive * 0.22
    })
    steam.forEach((puff, i) => {
      puff.position.y = 1.13 + Math.sin(frame.seconds + i) * 0.04
    })
  }
}
function chess(p: BackgroundModelKit, definition: EventDefinition): EventMotion {
  table(p)
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 6; col++) {
      p.box(
        [0.125, 0.012, 0.075],
        [col * 0.125 - 0.31, 0.81, row * 0.075 - 0.19],
        (row + col) % 2 ? 0xdbc99d : 0x2a3439,
      )
    }
  for (const x of [-0.22, 0.22]) {
    p.box([0.045, 0.11, 0.045], [x, 0.87, 0], 0xdbcb9d)
    p.ball([0.045, 0.045, 0.045], [x, 0.94, 0], 0xdbcb9d)
  }
  const king = new p.THREE.Group()
  king.add(p.box([0.07, 0.2, 0.07], [0, 0.1, 0], 0xb4a267))
  king.add(p.box([0.1, 0.025, 0.025], [0, 0.2, 0], 0xb4a267))
  king.position.set(0.1, 0.81, 0.1)
  p.root.add(king)
  return (frame) => {
    king.rotation.z =
      eventDrive(frame, definition) *
      (definition.trigger === 'finish' ? 1.3 : Math.sin(frame.seconds * 5) * 0.25)
  }
}
function clock(p: BackgroundModelKit): EventMotion {
  p.put(
    new p.THREE.Mesh(p.geometry(new p.THREE.CircleGeometry(0.34, 24)), p.glow(0xd6c9a1, 1)),
    [0, 0, 0],
  )
  p.put(
    new p.THREE.Mesh(
      p.geometry(new p.THREE.TorusGeometry(0.35, 0.025, 6, 24)),
      p.glow(0x6b5a3d, 1),
    ),
    [0, 0, 0.01],
  )
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    p.box(
      [0.015, 0.035, 0.02],
      [Math.sin(angle) * 0.28, Math.cos(angle) * 0.28, 0.02],
      0x2e3537,
    ).rotation.z = -angle
  }
  const hand = new p.THREE.Group()
  hand.add(p.box([0.015, 0.22, 0.02], [0, 0.1, 0.035], 0x2e3537))
  p.root.add(hand)
  const pendulum = new p.THREE.Group()
  pendulum.add(p.box([0.02, 0.55, 0.02], [0, -0.55, 0], 0xa48b53))
  pendulum.add(p.ball([0.09, 0.09, 0.035], [0, -0.85, 0], 0xa48b53))
  p.root.add(pendulum)
  return ({ seconds }) => {
    pendulum.rotation.z = Math.sin(seconds * 1.7) * 0.12
    hand.rotation.z = -seconds * 0.025
  }
}
function chandelier(p: BackgroundModelKit, definition: EventDefinition): EventMotion {
  p.box([0.035, 0.55, 0.035], [0, 0.25, 0], 0xc5ad70)
  const hanging = new p.THREE.Group()
  hanging.add(p.box([1.1, 0.035, 0.08], [0, -0.15, 0], 0xc5ad70))
  for (const x of [-0.5, -0.25, 0, 0.25, 0.5]) {
    hanging.add(p.box([0.04, 0.18, 0.04], [x, -0.05, 0], 0xc5ad70))
    hanging.add(p.ball([0.04, 0.065, 0.025], [x, 0.07, 0], 0xffdfa2))
  }
  p.root.add(hanging)
  return (frame) => {
    hanging.rotation.z = Math.sin(frame.seconds * 4) * eventDrive(frame, definition) * 0.11
  }
}
function cargo(p: BackgroundModelKit, definition: EventDefinition): EventMotion {
  const toy = definition.event === 'toy-box'
  const colour = toy ? 0x536b8a : 0x786447
  p.box([0.85, 0.65, 0.45], [0, 0.33, 0], colour)
  for (const x of [-0.32, 0.32]) p.box([0.055, 0.7, 0.025], [x, 0.35, 0.24], 0xc1ab7b)
  const lid = new p.THREE.Group()
  lid.position.set(0, 0.69, -0.22)
  lid.add(p.box([0.9, 0.045, 0.5], [0, 0, 0.22], colour))
  p.root.add(lid)
  const secret = buildBackgroundProp(p, toy ? 'toy' : 'spider')
  secret.scale.setScalar(0.55)
  secret.position.set(0, 0.75, 0)
  p.root.add(secret)
  return (frame) => {
    const amount = eventDrive(frame, definition)
    lid.rotation.x = -amount * 0.7
    secret.position.y = 0.64 + amount * 0.17
  }
}
function musicBox(p: BackgroundModelKit, definition: EventDefinition): EventMotion {
  p.box([0.7, 0.55, 0.45], [0, 0.3, 0], 0x77516b)
  p.box([0.78, 0.04, 0.5], [0, 0.6, 0], 0xccac79)
  const dancer = new p.THREE.Group()
  dancer.add(p.ball([0.065, 0.065, 0.05], [0, 0.32, 0], 0xe7d9bf))
  dancer.add(p.box([0.075, 0.17, 0.045], [0, 0.18, 0], 0xbba0be))
  dancer.add(p.box([0.32, 0.025, 0.03], [0, 0.23, 0], 0xe7d9bf))
  dancer.add(p.box([0.025, 0.1, 0.025], [0, 0.045, 0], 0xe7d9bf))
  dancer.position.y = 0.65
  p.root.add(dancer)
  const key = p.put(
    new p.THREE.Mesh(
      p.geometry(new p.THREE.TorusGeometry(0.06, 0.015, 5, 12)),
      p.glow(0xccac79, 1),
    ),
    [0.39, 0.37, 0],
  )
  return ({ seconds }) => {
    dancer.rotation.y = (seconds * Math.PI * 2) / (definition.period ?? 14)
    key.rotation.y = Math.sin(seconds * 0.4) * 0.2
  }
}
function springGauge(p: BackgroundModelKit, definition: EventDefinition): EventMotion {
  p.box([0.8, 0.12, 0.45], [0, 0.06, 0], 0x536875)
  const coil = buildBackgroundProp(p, 'spring')
  coil.position.y = 0.4
  p.root.add(coil)
  p.box([0.07, 1.15, 0.07], [0.36, 0.57, -0.1], 0x8b9c9d)
  for (let i = 0; i < 6; i++) p.box([0.12, 0.015, 0.025], [0.34, 0.24 + i * 0.14, -0.04], 0xd5b970)
  const needle = p.box([0.2, 0.035, 0.04], [0.25, 0.6, 0.01], 0xcb6856)
  return (frame) => {
    const amount = eventDrive(frame, definition)
    coil.scale.y = 1 - amount * 0.35
    needle.position.y = 0.6 - amount * 0.12
  }
}
function lab(p: BackgroundModelKit): EventMotion {
  table(p)
  const bubbles = [-0.3, 0, 0.3].map((x, i) => {
    p.put(
      new p.THREE.Mesh(p.geometry(new p.THREE.SphereGeometry(0.13, 12, 8)), p.glow(0x9cbdba, 0.3)),
      [x, 0.96, 0],
    )
    p.put(
      new p.THREE.Mesh(
        p.geometry(new p.THREE.CylinderGeometry(0.045, 0.045, 0.2, 10)),
        p.glow(0x9cbdba, 0.3),
      ),
      [x, 1.12, 0],
    )
    return p.ball([0.055, 0.055, 0.055], [x, 0.96, 0.02], [0x9ecf9b, 0xb7a4cf, 0xc3b36d][i])
  })
  return ({ seconds }) =>
    bubbles.forEach((bubble, i) => {
      bubble.position.y = 0.93 + (Math.sin(seconds * 1.1 + i) + 1) * 0.05
    })
}
export const MECHANICAL_EVENTS = {
  tea,
  chess,
  clock,
  chandelier,
  'cargo-lid': cargo,
  'toy-box': cargo,
  'music-box': musicBox,
  'spring-gauge': springGauge,
  'lab-bubbles': lab,
} satisfies Partial<Record<EventDefinition['event'], EventBuilder>>
