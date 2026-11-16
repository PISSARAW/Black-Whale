import { createChrolloBook } from './chrolloBook'
import { createFightEnvironment, type FightEnvironment } from './fightEnvironment'
import { FIGHT_FPS } from './fightClock'
import { DEFAULT_FIGHT_FORMAT, fightFormat, type FightFormatId } from './formats'
import { createFightingNen } from './nen'
import type { ArcadeFighter, FightMode, FightState, FighterId } from './types'

interface CreateFightOptions {
  formatId?: FightFormatId
  mode?: FightMode
  environment?: Partial<FightEnvironment>
}

export function createFightState(
  playerId: FighterId,
  opponentId: FighterId,
  options: FightFormatId | CreateFightOptions = DEFAULT_FIGHT_FORMAT,
): FightState {
  const formatId =
    typeof options === 'string' ? options : (options.formatId ?? DEFAULT_FIGHT_FORMAT)
  const mode = typeof options === 'string' ? 'versus-ai' : (options.mode ?? 'versus-ai')
  const format = fightFormat(formatId)
  return {
    environment: createFightEnvironment(typeof options === 'string' ? {} : options.environment),
    formatId,
    mode,
    player: createFighter({ id: playerId, x: 22, facing: 1, health: format.health }),
    opponent: createFighter({ id: opponentId, x: 78, facing: -1, health: format.health }),
    phase: 'ready',
    frame: 0,
    time: format.roundFrames / FIGHT_FPS,
    remainingFrames: format.roundFrames,
    frameAccumulator: 0,
    hitstop: 0,
    rng: seedFor(playerId, opponentId),
    winner: null,
    matchWinner: null,
    roundNumber: 1,
    roundsWon: { player: 0, opponent: 0 },
    finishReason: null,
    score: { player: 0, opponent: 0 },
    knockdowns: { player: 0, opponent: 0 },
    bungeeGum: null,
    projectiles: [],
    nextProjectileId: 1,
    impact: null,
  }
}

export function nextFightRound(state: FightState): FightState {
  if (state.phase !== 'finished' || state.matchWinner) return state
  const format = fightFormat(state.formatId)
  return {
    ...state,
    lsdf: undefined,
    expulsion: undefined,
    player: createFighter({ id: state.player.id, x: 22, facing: 1, health: format.health }),
    opponent: createFighter({ id: state.opponent.id, x: 78, facing: -1, health: format.health }),
    phase: 'ready',
    frame: 0,
    time: format.roundFrames / FIGHT_FPS,
    remainingFrames: format.roundFrames,
    frameAccumulator: 0,
    hitstop: 0,
    winner: null,
    finishReason: null,
    roundNumber: state.roundNumber + 1,
    score: { player: 0, opponent: 0 },
    knockdowns: { player: 0, opponent: 0 },
    bungeeGum: null,
    projectiles: [],
    nextProjectileId: 1,
    impact: null,
  }
}

function createFighter(options: {
  id: FighterId
  x: number
  facing: -1 | 1
  health: number
}): ArcadeFighter {
  return {
    ...options,
    y: 0,
    velocityY: 0,
    aura: 55,
    nen: createFightingNen(),
    pose: 'idle',
    hitStun: 0,
    blockStun: 0,
    blocking: false,
    guardFrames: 0,
    ryuWindow: 0,
    knockdownFrames: 0,
    wakeupInvulnerableFrames: 0,
    reversalWindow: 0,
    comboHits: 0,
    comboDamage: 0,
    juggleCount: 0,
    auraExhausted: false,
    hatsuChargeFrames: 0,
    chrolloBook: options.id === 'chrollo' ? createChrolloBook() : undefined,
    hatsuEffects: emptyHatsuEffects(),
    attack: null,
    bufferedAttack: null,
  }
}

function emptyHatsuEffects(): ArcadeFighter['hatsuEffects'] {
  return {
    forcedZetsuFrames: 0,
    contagionFrames: 0,
    contagionStacks: 0,
    futureSight: 0,
    batonCharges: 0,
    senseSeals: 0,
    blinkyFrames: 0,
    cohortWillFrames: 0,
    arrowNocked: 0,
    possessedFrames: 0,
    sunMark: 0,
    moonMark: 0,
    manipulatedFrames: 0,
    transformationFrames: 0,
    isolationFrames: 0,
    cyclotronTurns: 0,
    stitchedFrames: 0,
    needleFrames: 0,
    serpentMarks: 0,
    cantabileFrames: 0,
    biohazardFrames: 0,
    restrainedFrames: 0,
    predatorFrames: 0,
    bloodBoundFrames: 0,
    entrancedFrames: 0,
    haikuFrames: 0,
    venomFrames: 0,
    soulExposedFrames: 0,
    teleportDodges: 0,
    growthFrames: 0,
    wormDodges: 0,
    kachoGuards: 0,
    desireFrames: 0,
    momozeFrames: 0,
    smokeFrames: 0,
    coinCharges: 0,
    gidalCurseFrames: 0,
    contractFrames: 0,
    weaponFrames: 0,
    synthesisFrames: 0,
    eyeWogFrames: 0,
    doorDodges: 0,
    witnessedHatsu: null,
    stolenHatsu: null,
    hatsuStolen: 0,
  }
}

function seedFor(playerId: FighterId, opponentId: FighterId): number {
  let seed = 2166136261
  for (const character of `${playerId}:${opponentId}`) {
    seed = Math.imul(seed ^ character.charCodeAt(0), 16777619)
  }
  return seed >>> 0
}
