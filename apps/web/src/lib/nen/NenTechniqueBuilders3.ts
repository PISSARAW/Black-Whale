import * as THREE from 'three'
import type { TechniqueBuilder } from './NenTechniqueBuilders1'
import type { TechniqueMode } from './NenTechniqueModes'
import { addChain, addHumanoid, addOrbit, animated, orb, ring } from './NenTechniquePrimitives'
export const TECHNIQUE_BUILDERS_3: Partial<Record<TechniqueMode, TechniqueBuilder>> = {
  vacuum: (group, { pale }) => {
    for (let index = 0; index < 22; index += 1) {
      const dust = orb(pale, 'vacuum-dust', {
        radius: 0.045 + (index % 3) * 0.018,
        options: {
          delay: (index % 7) * 0.04,
          phase: index * 0.65,
          opacity: 0.68,
        },
      })
      dust.userData.angle = (index / 22) * Math.PI * 2
      dust.userData.radius = 1 + (index % 5) * 0.3
      group.add(dust)
    }
  },
  chain: (group, { pale }) => {
    addChain(group, pale)
  },
  music: (group) => {
    for (let index = 0; index < 6; index += 1) {
      const wave = ring(0xc6f1ff, 'music-wave', {
        radius: 0.45 + index * 0.25,
        options: {
          delay: index * 0.09,
          opacity: 0.42,
        },
      })
      wave.rotation.y = Math.PI / 2
      group.add(wave)
    }
    addOrbit(group, 0xc6f1ff, { count: 8, radius: 1.5 })
  },
  portal: (group, { colour }) => {
    for (let index = 0; index < 8; index += 1) {
      const mouth = ring(colour, 'portal-ring', {
        radius: 0.55 + index * 0.07,
        options: {
          delay: index * 0.045,
          phase: index / 8,
          opacity: 0.46,
        },
      })
      mouth.position.z = -0.8 + index * 0.28
      group.add(mouth)
    }
  },
  cloth: (group, { colour }) => {
    const cloth = animated(new THREE.PlaneGeometry(3.2, 2.5, 12, 10), colour, {
      motion: 'cloth-fold',
      options: {
        opacity: 0.3,
        wireframe: true,
      },
    })
    cloth.position.z = 1
    group.add(cloth)
  },
  heat: (group, { mode }) => {
    const sphere = animated(
      new THREE.SphereGeometry(mode === 'planet' ? 1.25 : 0.9, 24, 18),
      mode === 'planet' ? 0xd5a86d : 0xff8a38,
      {
        motion: mode === 'planet' ? 'planet-fall' : 'sun-rise',
        options: { opacity: 0.72, wireframe: mode === 'planet' },
      },
    )
    sphere.position.y = mode === 'planet' ? 3.2 : -1.4
    group.add(sphere)
  },
  planet: (group, { mode }) => {
    const sphere = animated(
      new THREE.SphereGeometry(mode === 'planet' ? 1.25 : 0.9, 24, 18),
      mode === 'planet' ? 0xd5a86d : 0xff8a38,
      {
        motion: mode === 'planet' ? 'planet-fall' : 'sun-rise',
        options: { opacity: 0.72, wireframe: mode === 'planet' },
      },
    )
    sphere.position.y = mode === 'planet' ? 3.2 : -1.4
    group.add(sphere)
  },
  fish: (group) => {
    for (let index = 0; index < 9; index += 1) {
      const fish = orb(0x76b8c8, 'fish-swim', {
        radius: 0.11,
        options: {
          phase: index / 9,
          delay: index * 0.035,
          opacity: 0.7,
        },
      })
      fish.scale.set(1.8, 0.65, 0.65)
      fish.userData.baseScale = fish.scale.clone()
      fish.userData.angle = (index / 9) * Math.PI * 2
      fish.userData.radius = 1.5
      group.add(fish)
    }
  },
  surveillance: (group) => {
    const cone = animated(new THREE.ConeGeometry(1.15, 2.8, 32, 1, true), 0xa8b7d8, {
      motion: 'scan-cone',
      options: {
        opacity: 0.12,
      },
    })
    cone.rotation.x = -Math.PI / 2
    cone.position.z = 1.4
    group.add(cone)
    addOrbit(group, 0xa8b7d8, { count: 4, radius: 0.55 })
  },
  double: (group) => {
    addHumanoid(group, 0xf6b8d1, { x: -0.5, motion: 'double-figure' })
    addHumanoid(group, 0xf6b8d1, { x: 0.5, motion: 'double-figure' })
  },
  transform: (group, { colour, pale }) => {
    const box = animated(new THREE.BoxGeometry(1.2, 0.8, 0.75), pale, {
      motion: 'transform-box',
      options: {
        opacity: 0.5,
        wireframe: true,
      },
    })
    group.add(box)
    const animal = animated(new THREE.SphereGeometry(0.72, 20, 14), colour, {
      motion: 'transform-animal',
      options: {
        opacity: 0.3,
        wireframe: true,
        delay: 0.4,
      },
    })
    animal.scale.set(1.2, 0.75, 1.5)
    group.add(animal)
  },
}
