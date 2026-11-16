import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure } from '$lib/tour/humanFigure'
import { beginFight, createFight, performAttack } from './engine'
import { fightBodyMotion } from './fightBodyMotion'
import { fightRigOf, footHeight } from './fightRig'
import { attackData } from './frameData'

describe('Leorio’s floor strike animation', () => {
  it.each([1, -1] as const)('reaches the floor with planted feet while facing %s', (facing) => {
    const armed = performAttack(beginFight(createFight('leorio', 'hisoka')), 'player', 'special')
    const fighter = {
      ...armed.player,
      facing,
      attack: {
        ...armed.player.attack!,
        frame: attackData('special', armed.player).startup,
      },
    }
    const model = buildHumanFigure({
      THREE,
      glow: (colour, opacity) => new THREE.MeshBasicMaterial({ color: colour, opacity }),
      seen: {
        id: 'leorio-floor-strike',
        kind: 'combatant',
        spaceId: 'black-whale-clash',
        tierId: 'arcade-stage',
        at: [0, 0],
        y: 0,
        size: 1,
        colour: 0xffffff,
        stage: 0,
        hidden: false,
        human: { role: 'hunter', identity: 'leorio-paradinight', pose: 'idle', aura: 'none' },
      },
    })
    model.root.rotation.y = (facing * Math.PI) / 2
    const motion = fightBodyMotion({ fighter, seconds: 0, progress: 0 })
    model.animate(0, 'idle', {
      motion: (human) => {
        motion(human)
        const rig = fightRigOf(human)
        model.root.updateMatrixWorld(true)
        const hand = rig.wrists[facing === 1 ? 0 : 1].getWorldPosition(new THREE.Vector3())
        expect(hand.y).toBeGreaterThan(-0.05)
        expect(hand.y).toBeLessThan(0.2)
        expect(footHeight(rig)).toBeGreaterThan(-0.05)
      },
    })
  })
})
