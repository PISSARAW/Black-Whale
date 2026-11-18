import { expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import { combatCameraTarget } from './combatCamera'
import { createPursuitCameraHold } from './pursuitCamera'
import { directionalComboShot } from './directionalComboCamera'
import { fightWorldX, fightWorldY } from './fightCoordinates'
import { biscuitCameraFrame } from './biscuitCamera'
import { projectionCameraSpan } from './hanzoProjectionScene'
import { pursuitReview } from '../../../ui-tests/fighting-pursuit-review/scenarios'

it.each(['centre', 'coin'] as const)(
  'conserve le plan de lancement jusqu’à la touche au %s',
  (id) => {
    const { states, launch, contact } = pursuitReview(id)
    const hold = createPursuitCameraHold()
    const expected = directionalComboShot(states[launch], hold(states[launch]))
    expect(expected).toMatchObject({ ending: 'air', weight: 1 })
    for (const state of states.slice(launch, contact + 1))
      expect(directionalComboShot(state, hold(state))).toEqual(expected)
    expect(hold(states[0])).toBe(false)
  },
)

it('cadre le double et sa cible avec le corps de Hanzo visible sur le bord en portrait', () => {
  const { states, launch, contact } = pursuitReview('hanzo')
  const aspect = 9 / 16
  for (const state of states.slice(launch, contact + 1)) {
    const actors = [state.player, state.opponent]
    const positions = actors.map((fighter) => fightWorldX(fighter.x))
    const span = projectionCameraSpan(state, positions, { worldX: fightWorldX, aspect })
    const base = biscuitCameraFrame({ state, ...span, aspect })
    const pose = combatCameraTarget({ state, base, span, aspect, intensity: 1, dt: 1 / 60 })
    const camera = new PerspectiveCamera(34, aspect, 0.1, 100)
    camera.position.set(pose.x, pose.y, pose.z)
    camera.lookAt(pose.x, pose.lookY, 0)
    camera.updateMatrixWorld(true)
    for (const fighter of actors) {
      const head = new Vector3(fightWorldX(fighter.x), fightWorldY(fighter.y) + 1.9, 0)
      expect(Math.abs(head.project(camera).x)).toBeLessThan(0.8)
    }
    const sleeper = new Vector3(fightWorldX(state.player.hanzoProjection!.bodyX), 0.21, 0)
    const bodyEdge = sleeper.project(camera)
    expect(bodyEdge.x).toBeLessThan(-0.45)
    expect(bodyEdge.x).toBeGreaterThan(-1.12)
  }
})
