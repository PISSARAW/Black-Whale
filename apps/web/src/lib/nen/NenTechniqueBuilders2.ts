import * as THREE from 'three'
import type { TechniqueBuilder } from './NenTechniqueBuilders1'
import type { TechniqueMode } from './NenTechniqueModes'
import { addOrbit, addWriting, animated, beam, orb, ring } from './NenTechniquePrimitives'
export const TECHNIQUE_BUILDERS_2: Partial<Record<TechniqueMode, TechniqueBuilder>> = {
  parasite: (group, { pale }) => {
    addOrbit(group, pale, { count: 12, radius: 1.65 })
    group.children.forEach((child) => (child.userData.motion = 'swarm'))
  },
  seal: (group, { colour, pale }) => {
    const wall = animated(new THREE.PlaneGeometry(3.4, 3.4), colour, {
      motion: 'seal-wall',
      options: {
        opacity: 0.18,
        wireframe: true,
      },
    })
    wall.position.z = 1
    wall.scale.x = 0.001
    group.add(wall)
    for (let index = 0; index < 3; index += 1) {
      const frame = ring(pale, 'seal-ring', {
        radius: 0.8 + index * 0.45,
        options: { delay: index * 0.1 },
      })
      frame.position.z = 1.04
      group.add(frame)
    }
  },
  resurrection: (group, { red }) => {
    const life = orb(red, 'life-orb', { radius: 0.25, options: { opacity: 0.95 } })
    life.position.set(1.8, -0.8, 0.8)
    group.add(life)
    for (let index = 0; index < 5; index += 1) {
      const stream = beam(red, 'life-stream', {
        length: 1.1,
        radius: 0.035,
        options: {
          delay: index * 0.08,
          opacity: 0.7,
        },
      })
      stream.rotation.z = Math.PI / 2
      stream.position.set(0.8 - index * 0.25, -0.8 + index * 0.2, 0.75)
      group.add(stream)
    }
  },
  predator: (group, { red }) => {
    for (let index = 0; index < 4; index += 1) {
      const maw = ring(red, 'maw', {
        radius: 0.55 + index * 0.2,
        options: {
          delay: index * 0.06,
          opacity: 0.68,
        },
      })
      maw.position.z = 1.1
      group.add(maw)
    }
  },
  writing: (group, { mode, pale }) => {
    addWriting(group, mode === 'contract' ? 0x31558a : pale)
  },
  contract: (group, { mode, pale }) => {
    addWriting(group, mode === 'contract' ? 0x31558a : pale)
  },
  signal: (group) => {
    for (let index = 0; index < 4; index += 1) {
      const pulse = ring(0x8fe8ff, 'signal', {
        radius: 0.4 + index * 0.35,
        options: {
          delay: index * 0.12,
          opacity: 0.6,
        },
      })
      pulse.rotation.y = Math.PI / 2
      pulse.position.x = 0.25
      group.add(pulse)
    }
    const command = beam(0x8fe8ff, 'command', {
      length: 3.2,
      radius: 0.025,
      options: { delay: 0.42, opacity: 0.9 },
    })
    command.rotation.z = Math.PI / 2
    group.add(command)
  },
  loan: (group) => {
    const ability = orb(0x63d8ef, 'loan-orb', { radius: 0.28, options: { opacity: 0.9 } })
    ability.position.set(-1.4, 0.2, 0.8)
    group.add(ability)
    addWriting(group, 0x63d8ef)
  },
  restore: (group) => {
    for (let index = 0; index < 5; index += 1) {
      const wave = ring(0xa9f0c0, 'restore-wave', {
        radius: 0.6 + index * 0.25,
        options: {
          delay: index * 0.1,
          opacity: 0.45,
        },
      })
      wave.rotation.x = Math.PI / 2
      wave.position.y = -0.9 + index * 0.22
      group.add(wave)
    }
  },
  drain: (group, { red }) => {
    for (let index = 0; index < 8; index += 1) {
      const stream = beam(red, 'drain', {
        length: 2.2,
        radius: 0.025,
        options: {
          delay: (index % 4) * 0.08,
          phase: index / 8,
          opacity: 0.65,
        },
      })
      stream.rotation.z = (index / 8) * Math.PI * 2
      group.add(stream)
    }
  },
  web: (group, { pale }) => {
    for (let index = 0; index < 12; index += 1) {
      const thread = beam(pale, 'web-thread', {
        length: 2.7,
        radius: 0.012,
        options: {
          delay: index * 0.025,
          phase: index / 12,
          opacity: 0.4,
        },
      })
      thread.rotation.z = (index / 12) * Math.PI * 2
      group.add(thread)
    }
  },
}
