import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { buildFightFigure } from './fighterFigure'
import { createFightState } from './fightState'
import { fightBodyMotion } from './fightBodyMotion'
import { FIGHTING_ROSTER } from './roster'
import { disposeBanquetDetails } from '../tour/banquetDetailBuilder'
import { FIGHT_BODY_HALF_WIDTH, roomCutDepth } from './stageRoomCut'

/** The full rigs must fit between the retained scenery and the foreground cut. */
describe('stage body depth', () => {
  it.each(FIGHTING_ROSTER)('$id fits the reserved depth in standing guard', ({ id }) => {
    const base = createFightState(id, 'hisoka').player
    const fighter = { ...base, biscuitTrueForm: id === 'biscuit' }
    const model = buildFightFigure({
      THREE,
      fighter,
      glow: (colour, opacity) => new THREE.MeshBasicMaterial({ color: colour, opacity }),
    })
    model.root.rotation.y = Math.PI / 2
    model.animate(1, 'idle', { motion: fightBodyMotion({ fighter, seconds: 1, progress: 0 }) })
    model.root.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(model.lod.near)
    try {
      expect(bounds.min.z, id).toBeGreaterThan(-FIGHT_BODY_HALF_WIDTH)
      expect(bounds.max.z, id).toBeLessThan(FIGHT_BODY_HALF_WIDTH)
      expect(bounds.min.z, id).toBeGreaterThan(
        roomCutDepth('tier-1-princes-burial-chamber-rotunda'),
      )
    } finally {
      disposeBanquetDetails(model.root)
    }
  })
})
