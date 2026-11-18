import { expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { createFightState } from './fightState'
import type { ArcadeFighter } from './types'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

function draw(model: ReturnType<typeof buildFightFigure>, fighter: ArcadeFighter, seconds: number) {
  model.animate(seconds, 'idle', {
    transitionSeconds: 0,
    motion: fightBodyMotion({ fighter, seconds, progress: 0 }),
  })
}

it.each(['phinks', 'franklin', 'halkenburg', 'padaille'] as const)(
  '%s lowers both arms between techniques in either facing',
  (id) => {
    for (const facing of [1, -1] as const) {
      const fighter = { ...createFightState(id, 'hisoka').player, facing }
      const model = buildFightFigure({ THREE, glow, fighter })
      draw(model, fighter, 0)
      for (const side of ['left', 'right']) {
        const hand = model.root.getObjectByName(`hand-${side}`)!
        const shoulder = model.root.getObjectByName(`shoulder-${side}`)!
        const height = (node: THREE.Object3D) => node.getWorldPosition(new THREE.Vector3()).y
        // The old idles permanently held a windup, two aimed hands or a bow draw.
        expect(height(shoulder) - height(hand), `${id}, ${facing}, ${side}`).toBeGreaterThan(0.18)
      }
    }
  },
)

it.each([1, -1] as const)(
  'Melody raises her hands for a real performance and lowers them when it stops (facing %s)',
  (facing) => {
    const idle = { ...createFightState('melody', 'hisoka').player, facing }
    const model = buildFightFigure({ THREE, glow, fighter: idle })
    const hands = () =>
      ['hand-left', 'hand-right'].map(
        (name) => model.root.getObjectByName(name)!.getWorldPosition(new THREE.Vector3()).y,
      )
    draw(model, idle, 0)
    const resting = hands()
    const playing: ArcadeFighter = {
      ...idle,
      melodyPerformance: {
        originX: idle.x,
        startupFrames: 0,
        playingFrames: 60,
        moveId: 'melody:neutralSpecial',
      },
    }
    draw(model, playing, 1)
    draw(model, playing, 1.2)
    hands().forEach((height, i) => expect(height).toBeGreaterThan(resting[i] + 0.08))
    draw(model, idle, 2)
    draw(model, idle, 2.2)
    hands().forEach((height, i) => expect(Math.abs(height - resting[i])).toBeLessThan(0.02))
  },
)
