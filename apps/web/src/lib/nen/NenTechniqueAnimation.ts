import * as THREE from 'three'
import type { NenArchiveKind } from './archive'

export type TechniqueMode =
  | 'protect'
  | 'collective'
  | 'lie'
  | 'future'
  | 'coercion'
  | 'chemical'
  | 'coin'
  | 'levy'
  | 'trap'
  | 'smoke'
  | 'parasite'
  | 'seal'
  | 'resurrection'
  | 'predator'
  | 'writing'
  | 'signal'
  | 'loan'
  | 'restore'
  | 'drain'
  | 'web'
  | 'vacuum'
  | 'chain'
  | 'music'
  | 'contract'
  | 'portal'
  | 'cloth'
  | 'heat'
  | 'planet'
  | 'fish'
  | 'surveillance'
  | 'double'
  | 'transform'

const MODE_BY_KIND: Record<NenArchiveKind, TechniqueMode> = {
  guardian: 'protect',
  'benjamin-guardian': 'protect',
  'halkenburg-guardian': 'collective',
  'tserriednich-guardian': 'lie',
  'tserriednich-second': 'future',
  'camilla-guardian': 'coercion',
  'tubeppa-guardian': 'chemical',
  'zhang-lei-guardian': 'coin',
  'tyson-guardian': 'levy',
  'luzurus-guardian': 'trap',
  'sale-sale-guardian': 'smoke',
  'momoze-guardian': 'parasite',
  'marayam-guardian': 'seal',
  'cats-name': 'resurrection',
  predator: 'predator',
  ghostwriter: 'writing',
  'skill-book': 'writing',
  'black-voice': 'signal',
  'stealth-dolphin': 'loan',
  'cookie-chan': 'restore',
  'blood-snakes': 'drain',
  'nen-spider': 'web',
  blinky: 'vacuum',
  'dowsing-chain': 'chain',
  'judgment-chain': 'chain',
  'melody-flute': 'music',
  'moonlight-contract': 'contract',
  'magical-worm': 'portal',
  'fun-fun-cloth': 'cloth',
  'pain-packer': 'heat',
  jupiter: 'planet',
  'indoor-fish': 'fish',
  'secret-window': 'surveillance',
  'without-you': 'double',
  biohazard: 'transform',
  'lsdf-guards': 'protect',
}

type AnimatedMesh = THREE.Mesh & {
  userData: {
    motion?: string
    baseOpacity?: number
    delay?: number
    angle?: number
    radius?: number
    phase?: number
    start?: THREE.Vector3
    end?: THREE.Vector3
    baseScale?: THREE.Vector3
  }
}

const easeOut = (value: number) => 1 - Math.pow(1 - value, 3)
const clamp01 = (value: number) => THREE.MathUtils.clamp(value, 0, 1)

function auraMaterial(colour: number, opacity = 0.72, wireframe = false) {
  const material = new THREE.MeshBasicMaterial({
    color: colour,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    wireframe,
  })
  material.userData.baseOpacity = opacity
  return material
}

function animated(
  geometry: THREE.BufferGeometry,
  colour: number,
  motion: string,
  options: { opacity?: number; wireframe?: boolean; delay?: number; phase?: number } = {},
) {
  const mesh = new THREE.Mesh(
    geometry,
    auraMaterial(colour, options.opacity ?? 0.72, options.wireframe),
  ) as AnimatedMesh
  mesh.userData.motion = motion
  mesh.userData.baseOpacity = options.opacity ?? 0.72
  mesh.userData.delay = options.delay ?? 0
  mesh.userData.phase = options.phase ?? 0
  return mesh
}

function ring(
  colour: number,
  motion: string,
  radius = 1,
  options: { opacity?: number; delay?: number; phase?: number } = {},
) {
  return animated(new THREE.TorusGeometry(radius, 0.025, 8, 64), colour, motion, options)
}

function orb(
  colour: number,
  motion: string,
  radius = 0.12,
  options: { opacity?: number; delay?: number; phase?: number } = {},
) {
  return animated(new THREE.SphereGeometry(radius, 16, 12), colour, motion, options)
}

function beam(
  colour: number,
  motion: string,
  length = 2,
  radius = 0.025,
  options: { opacity?: number; delay?: number; phase?: number } = {},
) {
  return animated(new THREE.CylinderGeometry(radius, radius, length, 8), colour, motion, options)
}

function addOrbit(group: THREE.Group, colour: number, count: number, radius = 1.5) {
  for (let index = 0; index < count; index += 1) {
    const node = orb(colour, 'orbit', 0.08, { phase: index / count })
    node.userData.angle = (index / count) * Math.PI * 2
    node.userData.radius = radius
    group.add(node)
  }
}

function addCloud(group: THREE.Group, colours: number[], count = 18) {
  for (let index = 0; index < count; index += 1) {
    const puff = orb(colours[index % colours.length], 'cloud', 0.12 + (index % 3) * 0.035, {
      delay: (index % 7) / 9,
      phase: index * 0.71,
      opacity: 0.5,
    })
    puff.userData.angle = (index / count) * Math.PI * 2
    puff.userData.radius = 0.45 + (index % 5) * 0.18
    group.add(puff)
  }
}

function addWriting(group: THREE.Group, colour: number) {
  for (let index = 0; index < 5; index += 1) {
    const line = animated(
      new THREE.BoxGeometry(1.8 - index * 0.16, 0.025, 0.025),
      colour,
      'write',
      {
        delay: index * 0.12,
        opacity: 0.82,
      },
    )
    line.position.set(-0.1 + index * 0.04, 0.72 - index * 0.24, 0.9)
    line.scale.x = 0.001
    group.add(line)
  }
}

function addChain(group: THREE.Group, colour: number) {
  for (let index = 0; index < 13; index += 1) {
    const link = animated(new THREE.TorusGeometry(0.11, 0.022, 6, 16), colour, 'chain', {
      delay: index * 0.035,
      opacity: 0.9,
    })
    link.rotation.y = index % 2 ? Math.PI / 2 : 0
    link.position.set(-1.6 + index * 0.27, -0.75 + Math.sin(index * 0.55) * 0.1, 0.7)
    link.scale.setScalar(0.001)
    group.add(link)
  }
}

function addHumanoid(group: THREE.Group, colour: number, x: number, motion: string) {
  const body = animated(new THREE.CapsuleGeometry(0.18, 0.65, 5, 10), colour, motion, {
    opacity: 0.35,
  })
  body.position.set(x, -0.15, 0.8)
  body.userData.phase = x
  group.add(body)
  const head = orb(colour, motion, 0.19, { opacity: 0.35, phase: x })
  head.position.set(x, 0.55, 0.8)
  group.add(head)
}

export function buildTechniqueAnimation(kind: NenArchiveKind, colour: number): THREE.Group {
  const mode = MODE_BY_KIND[kind]
  const group = new THREE.Group()
  group.name = `technique-${mode}`
  group.userData.mode = mode
  group.visible = false

  const pale = new THREE.Color(colour).lerp(new THREE.Color(0xffffff), 0.42).getHex()
  const gold = 0xf1d477
  const red = 0xd85162

  if (mode === 'protect') {
    for (let index = 0; index < 3; index += 1) {
      const halo = ring(pale, 'expand-ring', 1.1, { delay: index * 0.14, opacity: 0.48 })
      halo.rotation.x = Math.PI / 2
      halo.position.y = -0.8
      group.add(halo)
    }
    const shell = animated(new THREE.SphereGeometry(1.65, 24, 16), colour, 'shell', {
      opacity: 0.12,
      wireframe: true,
    })
    group.add(shell)
  } else if (mode === 'collective') {
    addOrbit(group, gold, 10, 1.65)
    const arrow = beam(gold, 'charge-beam', 3.4, 0.045, { opacity: 0.85 })
    arrow.rotation.z = Math.PI / 2
    group.add(arrow)
  } else if (mode === 'lie') {
    for (let index = 0; index < 3; index += 1) {
      const mark = ring(red, 'verdict', 0.45 + index * 0.28, {
        delay: index * 0.2,
        opacity: 0.8,
      })
      mark.position.set(0, 0.25, 1.2)
      group.add(mark)
    }
    const tongue = beam(red, 'strike', 2.7, 0.06, { delay: 0.55, opacity: 0.8 })
    tongue.rotation.x = Math.PI / 2
    tongue.position.z = 1.2
    group.add(tongue)
  } else if (mode === 'future') {
    for (let index = 0; index < 10; index += 1) {
      const frame = animated(new THREE.BoxGeometry(1.45, 2.3, 0.025), pale, 'afterimage', {
        delay: index * 0.055,
        phase: index / 10,
        opacity: 0.22,
        wireframe: true,
      })
      frame.position.z = 0.7 - index * 0.12
      group.add(frame)
    }
  } else if (mode === 'coercion') {
    for (let index = 0; index < 12; index += 1) {
      const tendril = beam(colour, 'tendril', 2.5, 0.025, {
        phase: index / 12,
        delay: (index % 4) * 0.08,
        opacity: 0.5,
      })
      tendril.position.set(Math.cos(index) * 1.25, 0.7, Math.sin(index) * 0.5)
      group.add(tendril)
    }
  } else if (mode === 'chemical') {
    addCloud(group, [0x9fe0a8, 0x8fd5e0, pale], 20)
  } else if (mode === 'coin') {
    const coin = animated(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 32), gold, 'coin-drop', {
      opacity: 0.95,
    })
    coin.rotation.x = Math.PI / 2
    coin.position.y = 1.8
    group.add(coin)
    for (let index = 0; index < 3; index += 1) {
      const halo = ring(gold, 'coin-halo', 0.55 + index * 0.18, {
        delay: index * 0.1,
        opacity: 0.4,
      })
      halo.position.z = 0.1
      group.add(halo)
    }
  } else if (mode === 'levy') {
    addOrbit(group, 0xff8fb2, 9, 1.4)
    group.children.forEach((child) => (child.userData.motion = 'levy-orbit'))
  } else if (mode === 'trap') {
    const bait = orb(gold, 'bait', 0.22, { opacity: 0.9 })
    bait.position.set(0, -0.65, 1.1)
    group.add(bait)
    for (const side of [-1, 1]) {
      const jaw = animated(new THREE.ConeGeometry(0.6, 1.45, 5, 1, true), colour, 'jaw', {
        phase: side,
        opacity: 0.55,
        wireframe: true,
      })
      jaw.rotation.z = (side * Math.PI) / 2
      jaw.position.x = side * 1.2
      group.add(jaw)
    }
  } else if (mode === 'smoke') {
    addCloud(group, [0xc9a0e8, 0x8fd5e0, 0xe8c48f, 0x9fe0a8, 0xe89fb8], 24)
  } else if (mode === 'parasite') {
    addOrbit(group, pale, 12, 1.65)
    group.children.forEach((child) => (child.userData.motion = 'swarm'))
  } else if (mode === 'seal') {
    const wall = animated(new THREE.PlaneGeometry(3.4, 3.4), colour, 'seal-wall', {
      opacity: 0.18,
      wireframe: true,
    })
    wall.position.z = 1
    wall.scale.x = 0.001
    group.add(wall)
    for (let index = 0; index < 3; index += 1) {
      const frame = ring(pale, 'seal-ring', 0.8 + index * 0.45, { delay: index * 0.1 })
      frame.position.z = 1.04
      group.add(frame)
    }
  } else if (mode === 'resurrection') {
    const life = orb(red, 'life-orb', 0.25, { opacity: 0.95 })
    life.position.set(1.8, -0.8, 0.8)
    group.add(life)
    for (let index = 0; index < 5; index += 1) {
      const stream = beam(red, 'life-stream', 1.1, 0.035, {
        delay: index * 0.08,
        opacity: 0.7,
      })
      stream.rotation.z = Math.PI / 2
      stream.position.set(0.8 - index * 0.25, -0.8 + index * 0.2, 0.75)
      group.add(stream)
    }
  } else if (mode === 'predator') {
    for (let index = 0; index < 4; index += 1) {
      const maw = ring(red, 'maw', 0.55 + index * 0.2, {
        delay: index * 0.06,
        opacity: 0.68,
      })
      maw.position.z = 1.1
      group.add(maw)
    }
  } else if (mode === 'writing' || mode === 'contract') {
    addWriting(group, mode === 'contract' ? 0x31558a : pale)
  } else if (mode === 'signal') {
    for (let index = 0; index < 4; index += 1) {
      const pulse = ring(0x8fe8ff, 'signal', 0.4 + index * 0.35, {
        delay: index * 0.12,
        opacity: 0.6,
      })
      pulse.rotation.y = Math.PI / 2
      pulse.position.x = 0.25
      group.add(pulse)
    }
    const command = beam(0x8fe8ff, 'command', 3.2, 0.025, { delay: 0.42, opacity: 0.9 })
    command.rotation.z = Math.PI / 2
    group.add(command)
  } else if (mode === 'loan') {
    const ability = orb(0x63d8ef, 'loan-orb', 0.28, { opacity: 0.9 })
    ability.position.set(-1.4, 0.2, 0.8)
    group.add(ability)
    addWriting(group, 0x63d8ef)
  } else if (mode === 'restore') {
    for (let index = 0; index < 5; index += 1) {
      const wave = ring(0xa9f0c0, 'restore-wave', 0.6 + index * 0.25, {
        delay: index * 0.1,
        opacity: 0.45,
      })
      wave.rotation.x = Math.PI / 2
      wave.position.y = -0.9 + index * 0.22
      group.add(wave)
    }
  } else if (mode === 'drain') {
    for (let index = 0; index < 8; index += 1) {
      const stream = beam(red, 'drain', 2.2, 0.025, {
        delay: (index % 4) * 0.08,
        phase: index / 8,
        opacity: 0.65,
      })
      stream.rotation.z = (index / 8) * Math.PI * 2
      group.add(stream)
    }
  } else if (mode === 'web') {
    for (let index = 0; index < 12; index += 1) {
      const thread = beam(pale, 'web-thread', 2.7, 0.012, {
        delay: index * 0.025,
        phase: index / 12,
        opacity: 0.4,
      })
      thread.rotation.z = (index / 12) * Math.PI * 2
      group.add(thread)
    }
  } else if (mode === 'vacuum') {
    for (let index = 0; index < 22; index += 1) {
      const dust = orb(pale, 'vacuum-dust', 0.045 + (index % 3) * 0.018, {
        delay: (index % 7) * 0.04,
        phase: index * 0.65,
        opacity: 0.68,
      })
      dust.userData.angle = (index / 22) * Math.PI * 2
      dust.userData.radius = 1 + (index % 5) * 0.3
      group.add(dust)
    }
  } else if (mode === 'chain') {
    addChain(group, pale)
  } else if (mode === 'music') {
    for (let index = 0; index < 6; index += 1) {
      const wave = ring(0xc6f1ff, 'music-wave', 0.45 + index * 0.25, {
        delay: index * 0.09,
        opacity: 0.42,
      })
      wave.rotation.y = Math.PI / 2
      group.add(wave)
    }
    addOrbit(group, 0xc6f1ff, 8, 1.5)
  } else if (mode === 'portal') {
    for (let index = 0; index < 8; index += 1) {
      const mouth = ring(colour, 'portal-ring', 0.55 + index * 0.07, {
        delay: index * 0.045,
        phase: index / 8,
        opacity: 0.46,
      })
      mouth.position.z = -0.8 + index * 0.28
      group.add(mouth)
    }
  } else if (mode === 'cloth') {
    const cloth = animated(new THREE.PlaneGeometry(3.2, 2.5, 12, 10), colour, 'cloth-fold', {
      opacity: 0.3,
      wireframe: true,
    })
    cloth.position.z = 1
    group.add(cloth)
  } else if (mode === 'heat' || mode === 'planet') {
    const sphere = animated(
      new THREE.SphereGeometry(mode === 'planet' ? 1.25 : 0.9, 24, 18),
      mode === 'planet' ? 0xd5a86d : 0xff8a38,
      mode === 'planet' ? 'planet-fall' : 'sun-rise',
      { opacity: 0.72, wireframe: mode === 'planet' },
    )
    sphere.position.y = mode === 'planet' ? 3.2 : -1.4
    group.add(sphere)
  } else if (mode === 'fish') {
    for (let index = 0; index < 9; index += 1) {
      const fish = orb(0x76b8c8, 'fish-swim', 0.11, {
        phase: index / 9,
        delay: index * 0.035,
        opacity: 0.7,
      })
      fish.scale.set(1.8, 0.65, 0.65)
      fish.userData.baseScale = fish.scale.clone()
      fish.userData.angle = (index / 9) * Math.PI * 2
      fish.userData.radius = 1.5
      group.add(fish)
    }
  } else if (mode === 'surveillance') {
    const cone = animated(new THREE.ConeGeometry(1.15, 2.8, 32, 1, true), 0xa8b7d8, 'scan-cone', {
      opacity: 0.12,
    })
    cone.rotation.x = -Math.PI / 2
    cone.position.z = 1.4
    group.add(cone)
    addOrbit(group, 0xa8b7d8, 4, 0.55)
  } else if (mode === 'double') {
    addHumanoid(group, 0xf6b8d1, -0.5, 'double-figure')
    addHumanoid(group, 0xf6b8d1, 0.5, 'double-figure')
  } else if (mode === 'transform') {
    const box = animated(new THREE.BoxGeometry(1.2, 0.8, 0.75), pale, 'transform-box', {
      opacity: 0.5,
      wireframe: true,
    })
    group.add(box)
    const animal = animated(new THREE.SphereGeometry(0.72, 20, 14), colour, 'transform-animal', {
      opacity: 0.3,
      wireframe: true,
      delay: 0.4,
    })
    animal.scale.set(1.2, 0.75, 1.5)
    group.add(animal)
  }

  return group
}

export function updateTechniqueAnimation(
  group: THREE.Group | null,
  progress: number,
  time: number,
  active: boolean,
) {
  if (!group) return
  group.visible = active
  if (!active) return

  const eased = easeOut(progress)
  const globalFade = clamp01(Math.min(progress * 7, (1 - progress) * 6))
  group.rotation.y = Math.sin(time * 0.0008) * 0.08

  group.traverse((part) => {
    const mesh = part as AnimatedMesh
    if (!mesh.isMesh || !mesh.userData.motion) return
    const delay = mesh.userData.delay ?? 0
    const local = clamp01((progress - delay) / Math.max(0.001, 1 - delay))
    const localEase = easeOut(local)
    const phase = mesh.userData.phase ?? 0
    const material = mesh.material as THREE.MeshBasicMaterial
    material.opacity = (mesh.userData.baseOpacity ?? 0.7) * globalFade

    switch (mesh.userData.motion) {
      case 'expand-ring':
      case 'restore-wave':
      case 'music-wave':
      case 'signal':
      case 'seal-ring':
      case 'coin-halo': {
        const scale = 0.2 + localEase * 1.35
        mesh.scale.setScalar(scale)
        material.opacity *= 1 - local * 0.72
        break
      }
      case 'shell':
        mesh.scale.setScalar(0.45 + eased * 0.75 + Math.sin(time * 0.006) * 0.025)
        break
      case 'orbit':
      case 'levy-orbit':
      case 'swarm': {
        const radius =
          (mesh.userData.radius ?? 1.4) *
          (mesh.userData.motion === 'levy-orbit' ? 1 - eased * 0.45 : 1)
        const angle =
          (mesh.userData.angle ?? 0) + time * (mesh.userData.motion === 'swarm' ? 0.0018 : 0.001)
        mesh.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle * 1.7 + phase * 5) * 0.6,
          Math.sin(angle) * 0.7 + 0.7,
        )
        mesh.scale.setScalar(0.35 + localEase * 0.75)
        break
      }
      case 'charge-beam':
      case 'command':
      case 'strike':
        mesh.scale.y = Math.max(0.001, localEase)
        material.opacity *= Math.sin(local * Math.PI)
        break
      case 'verdict':
        mesh.scale.setScalar(0.25 + localEase * 0.9)
        material.opacity *= local < 0.55 ? 1 : 1 - (local - 0.55) / 0.45
        break
      case 'afterimage':
        mesh.position.x = Math.sin((phase + eased) * Math.PI * 2) * 0.5
        mesh.rotation.y = (phase - 0.5) * 0.35
        material.opacity *= Math.sin(local * Math.PI)
        break
      case 'tendril':
        mesh.scale.y = 0.2 + localEase * (0.7 + Math.sin(time * 0.004 + phase * 8) * 0.15)
        mesh.rotation.z = Math.sin(time * 0.003 + phase * 9) * 0.18
        break
      case 'cloud': {
        const angle = (mesh.userData.angle ?? 0) + eased * 2.4 + Math.sin(time * 0.001 + phase)
        const radius = (mesh.userData.radius ?? 1) * (0.15 + localEase)
        mesh.position.set(
          Math.cos(angle) * radius,
          -0.7 + localEase * (0.6 + phase * 0.18),
          Math.sin(angle) * radius * 0.65 + 0.45,
        )
        mesh.scale.setScalar(0.25 + localEase * 1.3)
        break
      }
      case 'coin-drop':
        mesh.position.y = THREE.MathUtils.lerp(1.8, -0.85, Math.min(1, localEase * 1.25))
        mesh.rotation.z = time * 0.008
        break
      case 'bait':
        mesh.scale.setScalar(0.5 + Math.sin(time * 0.012) * 0.18 + localEase * 0.5)
        break
      case 'jaw':
        mesh.position.x = (phase || 1) * THREE.MathUtils.lerp(1.5, 0.4, localEase)
        mesh.rotation.z = (phase || 1) * (Math.PI / 2 - localEase * 0.85)
        break
      case 'seal-wall':
        mesh.scale.x = Math.max(0.001, localEase)
        material.opacity *= 0.55 + Math.sin(time * 0.008) * 0.25
        break
      case 'life-orb':
        mesh.position.x = THREE.MathUtils.lerp(1.8, 0, localEase)
        mesh.position.y = THREE.MathUtils.lerp(-0.8, 0.2, localEase)
        mesh.scale.setScalar(0.4 + Math.sin(time * 0.012) * 0.15 + localEase * 0.7)
        break
      case 'life-stream':
      case 'drain':
        mesh.scale.y = 0.15 + localEase * 0.9
        mesh.rotation.z += 0.006
        break
      case 'maw':
        mesh.scale.setScalar(1.4 - localEase * 0.72)
        mesh.rotation.z = time * 0.002 + phase
        break
      case 'write':
        mesh.scale.x = Math.max(0.001, Math.min(1, local * 2.6))
        material.opacity *= local < 0.85 ? 1 : (1 - local) / 0.15
        break
      case 'loan-orb':
        mesh.position.x = THREE.MathUtils.lerp(-1.4, 1.25, localEase)
        mesh.position.y = 0.2 + Math.sin(local * Math.PI) * 1.1
        mesh.scale.setScalar(0.55 + Math.sin(time * 0.012) * 0.12)
        break
      case 'web-thread':
        mesh.scale.y = Math.max(0.001, localEase)
        break
      case 'vacuum-dust': {
        const radius = (mesh.userData.radius ?? 1.4) * (1 - localEase)
        const angle = (mesh.userData.angle ?? 0) + localEase * 12 + time * 0.001
        mesh.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle * 1.3) * radius * 0.5,
          0.8 + Math.sin(angle) * 0.3,
        )
        mesh.scale.setScalar(Math.max(0.05, 1 - localEase * 0.8))
        break
      }
      case 'chain':
        mesh.scale.setScalar(Math.max(0.001, Math.min(1, local * 2.2)))
        mesh.rotation.z += 0.004
        break
      case 'portal-ring':
        mesh.scale.setScalar(0.25 + localEase * 1.15)
        mesh.rotation.z = time * (0.0008 + phase * 0.0005)
        break
      case 'cloth-fold':
        mesh.scale.set(0.25 + localEase * 0.9, 0.35 + localEase * 0.75, 1)
        mesh.rotation.y = Math.sin(local * Math.PI * 2) * 0.7 * (1 - local)
        mesh.rotation.x = Math.sin(time * 0.003) * 0.08
        break
      case 'sun-rise':
        mesh.position.y = THREE.MathUtils.lerp(-1.4, 1.45, Math.min(1, localEase * 1.3))
        mesh.scale.setScalar(0.2 + localEase * 1.15)
        mesh.rotation.y = time * 0.001
        break
      case 'planet-fall':
        mesh.position.y = THREE.MathUtils.lerp(3.2, 0.25, localEase)
        mesh.scale.setScalar(0.35 + localEase * 0.8)
        mesh.rotation.y = time * 0.0012
        break
      case 'fish-swim': {
        const angle = (mesh.userData.angle ?? 0) + time * 0.0016 + localEase * 2
        const radius = (mesh.userData.radius ?? 1.5) * (1 - localEase * 0.35)
        mesh.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle * 1.6) * 0.7,
          Math.sin(angle) * 0.75 + 0.7,
        )
        mesh.rotation.z = angle + Math.PI / 2
        if (mesh.userData.baseScale)
          mesh.scale.copy(mesh.userData.baseScale).multiplyScalar(0.4 + localEase * 0.8)
        break
      }
      case 'scan-cone':
        mesh.rotation.z = Math.sin(time * 0.0025) * 0.65
        mesh.scale.setScalar(0.35 + localEase * 0.8)
        break
      case 'double-figure':
        mesh.position.x += Math.sin(time * 0.003 + phase * 4) * 0.0015
        material.opacity *= 0.6 + Math.sin(time * 0.008 + phase) * 0.25
        break
      case 'transform-box':
        mesh.scale.setScalar(Math.max(0.05, 1 - localEase))
        mesh.rotation.y = localEase * Math.PI
        break
      case 'transform-animal':
        mesh.scale.set(1.2 * localEase, 0.75 * localEase, 1.5 * localEase)
        mesh.rotation.y = -localEase * Math.PI
        break
    }
  })
}
