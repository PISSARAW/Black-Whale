import * as THREE from 'three'
import type { TechniqueMode } from './NenTechniqueModes'
import { addCloud, addOrbit, animated, beam, orb, ring } from './NenTechniquePrimitives'
export type TechniqueBuildContext = {
  mode: TechniqueMode
  colour: number
  pale: number
  gold: number
  red: number
}
export type TechniqueBuilder = (group: THREE.Group, context: TechniqueBuildContext) => void
export const TECHNIQUE_BUILDERS_1: Partial<Record<TechniqueMode, TechniqueBuilder>> = {
  protect: (group, { colour, pale }) => {
    for (let index = 0; index < 3; index += 1) {
      const halo = ring(pale, 'expand-ring', {
        radius: 1.1,
        options: { delay: index * 0.14, opacity: 0.48 },
      })
      halo.rotation.x = Math.PI / 2
      halo.position.y = -0.8
      group.add(halo)
    }
    const shell = animated(new THREE.SphereGeometry(1.65, 24, 16), colour, {
      motion: 'shell',
      options: {
        opacity: 0.12,
        wireframe: true,
      },
    })
    group.add(shell)
  },
  collective: (group, { gold }) => {
    addOrbit(group, gold, { count: 10, radius: 1.65 })
    const arrow = beam(gold, 'charge-beam', {
      length: 3.4,
      radius: 0.045,
      options: { opacity: 0.85 },
    })
    arrow.rotation.z = Math.PI / 2
    group.add(arrow)
  },
  lie: (group, { red }) => {
    for (let index = 0; index < 3; index += 1) {
      const mark = ring(red, 'verdict', {
        radius: 0.45 + index * 0.28,
        options: {
          delay: index * 0.2,
          opacity: 0.8,
        },
      })
      mark.position.set(0, 0.25, 1.2)
      group.add(mark)
    }
    const tongue = beam(red, 'strike', {
      length: 2.7,
      radius: 0.06,
      options: { delay: 0.55, opacity: 0.8 },
    })
    tongue.rotation.x = Math.PI / 2
    tongue.position.z = 1.2
    group.add(tongue)
  },
  future: (group, { pale }) => {
    for (let index = 0; index < 10; index += 1) {
      const frame = animated(new THREE.BoxGeometry(1.45, 2.3, 0.025), pale, {
        motion: 'afterimage',
        options: {
          delay: index * 0.055,
          phase: index / 10,
          opacity: 0.22,
          wireframe: true,
        },
      })
      frame.position.z = 0.7 - index * 0.12
      group.add(frame)
    }
  },
  coercion: (group, { colour }) => {
    for (let index = 0; index < 12; index += 1) {
      const tendril = beam(colour, 'tendril', {
        length: 2.5,
        radius: 0.025,
        options: {
          phase: index / 12,
          delay: (index % 4) * 0.08,
          opacity: 0.5,
        },
      })
      tendril.position.set(Math.cos(index) * 1.25, 0.7, Math.sin(index) * 0.5)
      group.add(tendril)
    }
  },
  chemical: (group, { pale }) => {
    addCloud(group, [0x9fe0a8, 0x8fd5e0, pale], 20)
  },
  coin: (group, { gold }) => {
    const coin = animated(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 32), gold, {
      motion: 'coin-drop',
      options: {
        opacity: 0.95,
      },
    })
    coin.rotation.x = Math.PI / 2
    coin.position.y = 1.8
    group.add(coin)
    for (let index = 0; index < 3; index += 1) {
      const halo = ring(gold, 'coin-halo', {
        radius: 0.55 + index * 0.18,
        options: {
          delay: index * 0.1,
          opacity: 0.4,
        },
      })
      halo.position.z = 0.1
      group.add(halo)
    }
  },
  levy: (group) => {
    addOrbit(group, 0xff8fb2, { count: 9, radius: 1.4 })
    group.children.forEach((child) => (child.userData.motion = 'levy-orbit'))
  },
  trap: (group, { colour, gold }) => {
    const bait = orb(gold, 'bait', { radius: 0.22, options: { opacity: 0.9 } })
    bait.position.set(0, -0.65, 1.1)
    group.add(bait)
    for (const side of [-1, 1]) {
      const jaw = animated(new THREE.ConeGeometry(0.6, 1.45, 5, 1, true), colour, {
        motion: 'jaw',
        options: {
          phase: side,
          opacity: 0.55,
          wireframe: true,
        },
      })
      jaw.rotation.z = (side * Math.PI) / 2
      jaw.position.x = side * 1.2
      group.add(jaw)
    }
  },
  smoke: (group) => {
    addCloud(group, [0xc9a0e8, 0x8fd5e0, 0xe8c48f, 0x9fe0a8, 0xe89fb8], 24)
  },
}
