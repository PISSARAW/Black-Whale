import {
  AdditiveBlending,
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  TorusGeometry,
} from 'three'
import { fightWorldX } from '../../src/lib/fighting/fightCoordinates'
import type { FightState } from '../../src/lib/fighting/types'

export function createChrolloBlast() {
  const group = new Group()
  group.name = 'chrollo-victory-sun-moon-explosion'
  const material = (color: number, opacity: number) =>
    new MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: AdditiveBlending,
      depthWrite: false,
    })
  const core = new Mesh(new SphereGeometry(1, 24, 16), material(0xffe8aa, 0.8))
  const shell = new Mesh(new SphereGeometry(1, 24, 16), material(0xff852e, 0.5))
  const ring = new Mesh(new TorusGeometry(1, 0.035, 6, 64), material(0xffd496, 0.85))
  group.add(core, shell, ring)
  const embers = Array.from(
    { length: 30 },
    () => new Mesh(new SphereGeometry(0.018, 5, 4), material(0xffc87a, 0.8)),
  )
  group.add(...embers)
  return {
    group,
    sync(state: FightState, age: number) {
      const t = (age - 180) / 60
      group.visible = t >= 0 && t < 4
      group.position.set(fightWorldX(state.player.x), 1, -0.15)
      const bloom = Math.max(0.35, Math.min(1, Math.max(0, t) * 6))
      const fade = Math.max(0, 1 - Math.max(0, t - 0.15) / 1.8)
      core.scale.setScalar(0.35 + bloom * 1.05 + Math.max(0, t) * 0.25)
      shell.scale.setScalar(0.2 + bloom * 1.35 + Math.max(0, t) * 0.4)
      core.material.opacity = fade * 0.58
      shell.material.opacity = fade * 0.28
      ring.scale.setScalar(0.4 + Math.max(0, t) * 2.4)
      ring.material.opacity = fade * 0.8
      embers.forEach((ember, i) => {
        const a = i * 2.39996,
          speed = 0.7 + (i % 5) * 0.22
        ember.position.set(
          Math.cos(a) * t * speed,
          Math.sin(a) * t * speed + t * 0.25,
          -0.3 + Math.sin(i * 1.8) * t * 0.4,
        )
        ember.material.opacity = Math.max(0, 1 - t / 4) * 0.8
      })
    },
  }
}
