import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { attackData } from './frameData'
import { prepareCombatRoute, type CombatRouteSetup } from './combatRouteSetup'
import { relocatePreparedPaper } from './combatRouteFight'
import { selectedGumLink } from './bungeeNetwork'
import { EMPTY_INPUT, type FighterId, type FightInput, type FightState } from './types'
import { directionalComboShot } from './directionalComboCamera'
import { fighterKeyedMove } from './fighterKeyedMove'
import { sampleTimeline } from './keyPoseTimeline'
import { moveById } from './movesets'
import { followUpLaunchVelocity } from './moveFollowUpPhysics'
import { WAKEUP_LESSONS } from './wakeupLessons'
import { FIGHTING_ROSTER } from './roster'
import { directionalTechnique } from './directionalTechniques'
import type { DirectionalEnding } from './directionalChain'
import { createCinematicDirector } from './cinematicDirector'
import { createCombatCamera } from './combatCamera'
import { fightWorldX } from './fightCoordinates'

const ENDINGS = ['ground', 'air', 'close', 'carry'] as const
const PAIRS = WAKEUP_LESSONS.filter(({ id }) => id.endsWith(':wakeup-sweep'))
const SETUP: Partial<Record<FighterId, CombatRouteSetup>> = {
  hisoka: 'bungee',
  biscuit: 'true-form',
  kalluto: 'paper',
}

function openingState(
  fighter: FighterId,
  options: { facing: 1 | -1; corner: boolean; technique?: boolean },
) {
  const opponent = PAIRS.find((entry) => entry.fighter === fighter)!.wakeup!
  let state = beginFight(
    createFight(fighter, opponent, { mode: 'versus-local', formatId: 'knockout' }),
  )
  state = {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 50 },
  }
  if (options.technique) state = prepareCombatRoute(state, SETUP[fighter])
  const { facing, corner } = options
  const wall = facing === 1 ? 93 : 7
  const x = corner ? wall : 50
  return {
    ...state,
    ...relocatePreparedPaper(state, { x, facing }),
    player: {
      ...state.player,
      x: x - 6 * facing,
      facing,
      ...(options.technique ? {} : { aura: 0, weaponsConfiscated: fighter === 'theta' }),
    },
    opponent: { ...state.opponent, x, facing: facing === 1 ? (-1 as const) : (1 as const) },
  }
}

function pressLight(state: FightState, input?: Partial<FightInput>) {
  return performMove({
    state,
    side: 'player',
    action: 'light',
    input: { ...EMPTY_INPUT, ...input },
  })
}

function waitForHits(state: FightState, count: number, down = false) {
  for (let i = 0; i < 105 && (state.impact?.comboHits ?? 0) < count; i++) {
    state = tickFight(state, EMPTY_INPUT, {
      dt: 1 / 60,
      ai: false,
      opponentInput: { ...EMPTY_INPUT, guard: count > 1, down },
    })
  }
  expect(state.impact).toMatchObject({ attacker: 'player', comboHits: count, blocked: false })
  return state
}

function readyForFinish(state: FightState, down = false) {
  return waitForHits(pressLight(waitForHits(pressLight(state), 1, down)), 2, down)
}

function finishInput(ending: DirectionalEnding, facing: 1 | -1): Partial<FightInput> {
  return {
    down: ending === 'ground',
    jump: ending === 'air',
    left: facing === -1 && ending === 'carry',
    right: facing === 1 && ending === 'carry',
  }
}

function expectedPosition(state: FightState, ending: DirectionalEnding) {
  if (ending === 'air') {
    const calibrated = followUpLaunchVelocity(state.player)
    if (calibrated === undefined) expect(state.opponent.velocityY).toBeGreaterThan(40)
    else expect(state.opponent.velocityY).toBe(calibrated)
  }
  if (ending === 'close') expect(state.opponent.knockdownFrames).toBe(0)
  if (ending === 'ground') expect(state.opponent.knockdownFrames).toBeGreaterThan(0)
}

describe.each(FIGHTING_ROSTER.map(({ id }) => id))('%s four directional chains', (fighter) => {
  for (const facing of [1, -1] as const)
    for (const corner of [false, true])
      it(`hits against guard at ${corner ? 'the corner' : 'centre'} facing ${facing}`, () => {
        const middle = readyForFinish(openingState(fighter, { facing, corner }))
        expect(middle.player.attack?.directionalChain).toBe('bridge')
        const silhouettes = ENDINGS.map((ending) => {
          const end = waitForHits(pressLight(middle, finishInput(ending, facing)), 3)
          expect(end.player.attack?.directionalChain).toBe(ending)
          expect(directionalComboShot(end)).toMatchObject({ ending })
          expectedPosition(end, ending)
          const { player } = end
          const frames = attackData(player.attack!.kind, player)
          const { timeline } = fighterKeyedMove(player, moveById(player.attack!.moveId)!.slot)
          const pose = sampleTimeline(timeline, { frame: frames.startup, frames, continuous: true })
          return JSON.stringify(pose)
        })
        expect(new Set(silhouettes)).toHaveLength(4)
      })

  for (const ending of ['close', 'carry'] as const) {
    const signature = directionalTechnique(fighter, ending)
    if (!signature) continue
    it.each([false, true])(`uses ${signature} with legal resources, corner=%s`, (corner) => {
      const middle = readyForFinish(openingState(fighter, { facing: 1, corner, technique: true }))
      const started = pressLight(middle, finishInput(ending, 1))
      expect(started.player.attack?.moveId).toBe(`${fighter}:${signature}`)
      const hits = { franklin: 12, kalluto: 5 } as const
      const finished = waitForHits(started, hits[fighter as keyof typeof hits] ?? 3)
      expect(finished.player.attack?.directionalChain).toBe(ending)
      if (fighter === 'hisoka') expect(selectedGumLink(finished, 'player')).toBeUndefined()
    })
  }
})

it.each([true, false])(
  'Franklin’s tenth shot pushes through at standing/crouch posture %s',
  (down) => {
    const middle = readyForFinish(
      openingState('franklin', { facing: 1, corner: false, technique: true }),
      down,
    )
    const finish = pressLight(middle, { right: true })
    const beforeLast = waitForHits(finish, 11, down)
    const afterLast = waitForHits(beforeLast, 12, down)
    expect(afterLast.opponent.x - beforeLast.opponent.x).toBeGreaterThan(3)
  },
)

it('keeps Theta’s gun detail from reappearing after the full-screen finish', () => {
  const camera = createCinematicDirector()
  const middle = readyForFinish(
    openingState('theta', { facing: 1, corner: false, technique: true }),
  )
  camera.update(middle)
  let state = pressLight(middle)
  expect(state.player.attack?.moveId).toBe('theta:downSpecial')
  for (let i = 0; i < 70; i++) {
    expect(camera.update(state, 1, 1 / 60).detail).toBeNull()
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
  }
})

it('limits the first push-in on a slow portrait render at the corner', () => {
  const camera = createCombatCamera()
  const opening = readyForFinish(openingState('phinks', { facing: -1, corner: true }))
  const options = {
    state: opening,
    base: { x: -4.5, y: 2.2, z: 13, lookY: 1.18 },
    span: { centre: fightWorldX((opening.player.x + opening.opponent.x) / 2), gap: 0.7 },
    aspect: 420 / 780,
    intensity: 1,
    dt: 0.1,
  }
  const before = camera.update(options)
  const next = pressLight(opening, { jump: true })
  const after = camera.update({
    ...options,
    state: next,
    base: { ...options.base, z: 8.2 },
  })
  expect(before.z - after.z).toBeGreaterThan(0)
  expect(before.z - after.z).toBeLessThanOrEqual(0.80001)
})
