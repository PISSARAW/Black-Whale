import * as THREE from 'three'
export type AnimatedMesh = THREE.Mesh & {
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

export const easeOut = (value: number) => 1 - Math.pow(1 - value, 3)
export const clamp01 = (value: number) => THREE.MathUtils.clamp(value, 0, 1)

export function auraMaterial(colour: number, opacity = 0.72, wireframe = false) {
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

export function animated(
  geometry: THREE.BufferGeometry,
  colour: number,
  {
    motion,
    options = {},
  }: {
    motion: string
    options?: { opacity?: number; wireframe?: boolean; delay?: number; phase?: number }
  },
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

export function ring(
  colour: number,
  motion: string,
  {
    radius = 1,
    options = {},
  }: { radius?: number; options?: { opacity?: number; delay?: number; phase?: number } } = {},
) {
  return animated(new THREE.TorusGeometry(radius, 0.025, 8, 64), colour, {
    motion: motion,
    options: options,
  })
}

export function orb(
  colour: number,
  motion: string,
  {
    radius = 0.12,
    options = {},
  }: { radius?: number; options?: { opacity?: number; delay?: number; phase?: number } } = {},
) {
  return animated(new THREE.SphereGeometry(radius, 16, 12), colour, {
    motion: motion,
    options: options,
  })
}

export function beam(
  colour: number,
  motion: string,
  {
    length = 2,
    radius = 0.025,
    options = {},
  }: {
    length?: number
    radius?: number
    options?: { opacity?: number; delay?: number; phase?: number }
  } = {},
) {
  return animated(new THREE.CylinderGeometry(radius, radius, length, 8), colour, {
    motion: motion,
    options: options,
  })
}

export function addOrbit(
  group: THREE.Group,
  colour: number,
  { count, radius = 1.5 }: { count: number; radius?: number },
) {
  for (let index = 0; index < count; index += 1) {
    const node = orb(colour, 'orbit', { radius: 0.08, options: { phase: index / count } })
    node.userData.angle = (index / count) * Math.PI * 2
    node.userData.radius = radius
    group.add(node)
  }
}

export function addCloud(group: THREE.Group, colours: number[], count = 18) {
  for (let index = 0; index < count; index += 1) {
    const puff = orb(colours[index % colours.length], 'cloud', {
      radius: 0.12 + (index % 3) * 0.035,
      options: {
        delay: (index % 7) / 9,
        phase: index * 0.71,
        opacity: 0.5,
      },
    })
    puff.userData.angle = (index / count) * Math.PI * 2
    puff.userData.radius = 0.45 + (index % 5) * 0.18
    group.add(puff)
  }
}

export function addWriting(group: THREE.Group, colour: number) {
  for (let index = 0; index < 5; index += 1) {
    const line = animated(new THREE.BoxGeometry(1.8 - index * 0.16, 0.025, 0.025), colour, {
      motion: 'write',
      options: {
        delay: index * 0.12,
        opacity: 0.82,
      },
    })
    line.position.set(-0.1 + index * 0.04, 0.72 - index * 0.24, 0.9)
    line.scale.x = 0.001
    group.add(line)
  }
}

export function addChain(group: THREE.Group, colour: number) {
  for (let index = 0; index < 13; index += 1) {
    const link = animated(new THREE.TorusGeometry(0.11, 0.022, 6, 16), colour, {
      motion: 'chain',
      options: {
        delay: index * 0.035,
        opacity: 0.9,
      },
    })
    link.rotation.y = index % 2 ? Math.PI / 2 : 0
    link.position.set(-1.6 + index * 0.27, -0.75 + Math.sin(index * 0.55) * 0.1, 0.7)
    link.scale.setScalar(0.001)
    group.add(link)
  }
}

export function addHumanoid(
  group: THREE.Group,
  colour: number,
  { x, motion }: { x: number; motion: string },
) {
  const body = animated(new THREE.CapsuleGeometry(0.18, 0.65, 5, 10), colour, {
    motion: motion,
    options: {
      opacity: 0.35,
    },
  })
  body.position.set(x, -0.15, 0.8)
  body.userData.phase = x
  group.add(body)
  const head = orb(colour, motion, { radius: 0.19, options: { opacity: 0.35, phase: x } })
  head.position.set(x, 0.55, 0.8)
  group.add(head)
}
