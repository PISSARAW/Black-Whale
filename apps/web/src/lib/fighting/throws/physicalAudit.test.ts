import { expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performThrow } from '../engine'
import { resolveFightImpacts } from '../combatImpact'
import { attackData } from '../frameData'
import { confirmedThrow, type ThrowCinematicFrame } from '../throwCinematic'
import { throwBodyPlan, throwBodyPosition, thrownVisualFighter } from '../throwCinematicMotion'
import { fightBodyMotion } from '../fightBodyMotion'
import { buildFightFigure } from '../fighterFigure'
import { FIGHTING_ROSTER } from '../roster'
import { physicalJoints, physicalViolations, boneSnapshot } from '../physicalAuditTestKit'
import { createThrowSignatureScene } from './scene'
import { fightWorldX, fightWorldY } from '../fightCoordinates'
import { FIGHT_MODEL_POSES } from '../sceneMotion'
import { defaultFightComfort } from '../fightComfort'
import { toggleChrolloBookmark } from '../chrolloBook'
import { EMPTY_INPUT, type FightSide, type FighterId } from '../types'

const cases = FIGHTING_ROSTER.flatMap(({ id }) =>
  (['player', 'opponent'] as const).flatMap((side) =>
    [false, true].map((powered) => ({ id, side, powered })),
  ),
)
it.each(cases)(
  '$id, $side, Aura=$powered: the complete throw and prop layers preserve anatomy',
  ({ id, side, powered }) => {
    for (const target of ['franklin', 'biscuit'] as const) auditThrow({ id, side, powered, target })
  },
)

function auditThrow(input: {
  id: FighterId
  side: FightSide
  powered: boolean
  target: FighterId
}) {
  const { id, side, powered, target } = input
  let state = beginFight(
    createFight(side === 'player' ? id : target, side === 'opponent' ? id : target, {
      mode: 'versus-local',
    }),
  )
  state = {
    ...state,
    player: { ...state.player, x: 46, aura: 100 },
    opponent: { ...state.opponent, x: 51, aura: 100 },
  }
  const book = state[side].chrolloBook
  if (book?.open)
    state = { ...state, [side]: { ...state[side], chrolloBook: toggleChrolloBookmark(book) } }
  state = performThrow(state, side, { ...EMPTY_INPUT, aura: powered })
  const actor = state[side]
  expect(actor.attack?.variant).toBe('throw')
  state = resolveFightImpacts(
    {
      ...state,
      [side]: { ...actor, attack: { ...actor.attack!, frame: attackData('heavy', actor).startup } },
    },
    [],
  )
  const confirmed = confirmedThrow(state)!
  expect(confirmed).not.toBeNull()
  let frame: ThrowCinematicFrame = confirmed
  const source = JSON.stringify(state)
  const glow = (color: number) => new THREE.MeshBasicMaterial({ color })
  const models = {
    player: buildFightFigure({ THREE, glow, fighter: state.player }),
    opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }),
  }
  const scene = new THREE.Scene()
  scene.add(models.player.root, models.opponent.root)
  const joints = [...physicalJoints(models.player.root), ...physicalJoints(models.opponent.root)]
  const bones = boneSnapshot(joints)
  const signature = createThrowSignatureScene({
    THREE,
    scene,
    worldX: fightWorldX,
    worldY: fightWorldY,
    figureOf: (seat) => models[seat].turns,
    throwFrame: () => frame,
    comfort: defaultFightComfort,
  })
  const found: unknown[] = []
  try {
    for (let age = 0; age <= frame.duration; age++) {
      frame = { ...confirmed, age }
      for (const seat of ['player', 'opponent'] as const) {
        const position = throwBodyPosition({ state, side: seat, frame, fallback: state[seat] })
        const fighter = thrownVisualFighter(state[seat], position)
        const options = {
          fighter,
          seconds: age / 60,
          progress: age / frame.duration,
          side: seat,
          throwFrame: frame,
        }
        models[seat].root.position.set(
          fightWorldX(position.x),
          fightWorldY(position.y),
          position.z ?? 0,
        )
        models[seat].root.rotation.y = fighter.facing * 1.25
        models[seat].animate(age / 60, FIGHT_MODEL_POSES[fighter.pose], {
          motion: fightBodyMotion({ ...options, plan: throwBodyPlan(options) }),
        })
      }
      signature.sync(state, age / 60)
      const errors = physicalViolations(joints)
      if (errors.length && found.length < 4) found.push({ target, age, errors })
      expect(boneSnapshot(joints)).toEqual(bones)
    }
    expect(found).toEqual([])
    expect(JSON.stringify(state)).toBe(source)
  } finally {
    signature.dispose()
  }
}
