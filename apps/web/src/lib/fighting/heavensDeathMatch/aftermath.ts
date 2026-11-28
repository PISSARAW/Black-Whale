import { finishFight } from '../combatVerdict'
import { FIGHT_FPS } from '../fightClock'
import { performGumProsthesisCommand } from '../gumProstheses'
import type { FightSide, FightState } from '../types'
import { frontierBeat } from './chrolloPlan/phases'
import { type DeathMatchWorld } from './chrolloPlan/world'
import { stepCrowd } from './crowd/step'
import { NO_MARKS, type Spectator } from './crowd/types'
import { executeHisoka } from './hisokaPlan/execute'
import { decideHisoka } from './hisokaPlan/tactics'
import { advanceDeathMatch } from './scenario'
import { RESCUE_DELAY_FRAMES } from './verdict'

const AFTERMATH_CUES = {
  'chrollo-declared-winner': 1,
  'rescue-arrives': 3,
  'troupe-gathers': 5,
  resuscitation: 7,
  'prosthetics-formed': 9,
  'machi-bound': 11,
} as const

function aftermathFigure(
  world: DeathMatchWorld,
  id: string,
  offset: { x: number; z: number },
): Spectator {
  const at = {
    ...world.hisoka.at,
    x: world.hisoka.at.x + offset.x,
    z: world.hisoka.at.z + offset.z,
  }
  return {
    id,
    look: { palette: 3, height: 1.6, build: 0.45, hair: 1 },
    face: 'own',
    seat: at,
    at,
    velocity: { x: 0, y: 0, z: 0 },
    posture: 'standing',
    health: 100,
    nature: 'human',
    marks: NO_MARKS,
    route: [],
    routeIndex: 0,
    fear: 0,
    gum: false,
    revealedToHisoka: false,
  }
}

function stageAftermathCrowd(world: DeathMatchWorld, cue: keyof typeof AFTERMATH_CUES) {
  const { spectators } = world.crowd
  switch (cue) {
    case 'rescue-arrives':
      return [
        ...spectators,
        aftermathFigure(world, 'rescue-left', { x: -1.6, z: -0.7 }),
        aftermathFigure(world, 'rescue-right', { x: 1.8, z: -0.8 }),
      ]
    case 'troupe-gathers':
      return [...spectators, aftermathFigure(world, 'aftermath-machi', { x: 1.4, z: 0.15 })]
    case 'machi-bound':
      return spectators.map((body) =>
        body.id === 'aftermath-machi' ? { ...body, posture: 'held' as const, gum: true } : body,
      )
    default:
      return spectators
  }
}

/** The verdict is followed by a short scene with a time cut to the rescue. */
function advanceScene(world: DeathMatchWorld, seconds: number): DeathMatchWorld {
  const beat = frontierBeat(world.scenario)
  if (!beat || !(beat in AFTERMATH_CUES)) return world
  const cue = beat as keyof typeof AFTERMATH_CUES
  if (seconds < AFTERMATH_CUES[cue]) return world
  const decision = decideHisoka(world)
  if (cue === 'resuscitation' && decision.intent.kind !== 'resuscitate') return world
  const acted = executeHisoka(world, decision).world
  const deathFrame = world.scenario.survival.deathFrame!
  const narrativeFrame =
    deathFrame +
    Math.floor(seconds * FIGHT_FPS) +
    (seconds >= AFTERMATH_CUES['rescue-arrives'] ? RESCUE_DELAY_FRAMES : 0)
  const scenario = advanceDeathMatch(acted.scenario, { beat, frame: narrativeFrame })
  if (scenario === acted.scenario) return world
  const spectators = stageAftermathCrowd(acted, cue)
  return { ...acted, scenario, crowd: { ...acted.crowd, spectators } }
}

function showHisoka(state: FightState, side: FightSide, world: DeathMatchWorld): FightState {
  const revived = world.scenario.survival.hisoka === 'revived'
  const fighter = state[side]
  const next: FightState = {
    ...state,
    [side]: {
      ...fighter,
      health: revived ? Math.max(1, fighter.health) : 0,
      pose: revived ? 'idle' : 'ko',
      hitStun: 0,
      blockStun: 0,
      knockdownFrames: 0,
      velocityY: 0,
      attack: null,
      bufferedAttack: null,
      blocking: false,
    },
  }
  return world.hisoka.prosthetics && !fighter.gumProstheses
    ? performGumProsthesisCommand(next, side, { action: 'gum-prosthesis' })
    : next
}

export function deathMatchAftermath(state: FightState): FightState | null {
  const world = state.deathMatch
  const deathFrame = world?.scenario.survival.deathFrame
  if (!world || deathFrame == null) return null
  const seconds = (world.crowd.frame - deathFrame + 1) / FIGHT_FPS
  const crowd = stepCrowd(world.crowd, {
    fighters: [],
    focus: world.hisoka.at,
    damage: world.damage,
    rescue: world.scenario.done.includes('rescue-arrives'),
  })
  const nextWorld = advanceScene({ ...world, crowd }, seconds)
  const winner = nextWorld.scenario.verdict?.winner
  const hisoka = world.scenario.options.chrolloSide === 'opponent' ? 'player' : 'opponent'
  const next = showHisoka(
    { ...state, deathMatch: nextWorld, frame: state.frame + 1 },
    hisoka,
    nextWorld,
  )
  if (winner === undefined || seconds < 13) return next
  const finished = finishFight({ ...next, deaths: undefined }, winner)
  return { ...finished, [hisoka]: next[hisoka] }
}
