import { hasMarkedTerrain } from './sunMoonMaterial'
import { prepareHisokaAsphyxia } from './gumResuscitationScenario'
import { prepareFortuneScenario } from './ghostwriterScenario'
import { carryDolphinPeople } from './dolphinPeopleWorld'
import { prepareBodyDamage, carryBodyDamage } from './bodyDamage'
import { carryDocumentState } from './paperDocumentRound'
import { carryIllumiFace } from './illumiDisguiseClock'
import { carryNeedleFace } from './illumiNeedleMatter'
import { carryKallutoPaper } from './kallutoSurveillance'
import { personalPaperKit } from './kallutoMaterials'
import { carryPaperWorld } from './kallutoMaterialWorld'
import { carryHalkenburgSoul } from './halkenburgSoulCarry'
import { prepareMusseHistory } from './benjaminMusseScenario'
import { carryMusseHistory } from './benjaminMusseRound'
import { carryDolphinState } from './dolphinRound'
import { carryVoiceAutopilot } from './blackVoiceAutopilot'
import { createBlackVoiceGear, restingBlackVoiceGear } from './blackVoiceTypes'
import { createWritingKit } from './bashoMaterials'
import { setupIllumiNeedles, preserveIllumiNeedles } from './illumiEquipment'
import { applyControlSchemes, keepControlScheme, type ControlSchemes } from './controlScheme'
import { createTrainingState } from './trainingTypes'
import { createArenaState } from './arenaTypes'
import { createBattlefield, personalEquipment } from './preparationWorld'
import { preservePredatorKnowledge } from './predatorSeal'
import { createBiohazardDevices } from './legacyBiohazardDevices'
import { createBiohazardInventory } from './biohazard'
import { prepareHinrighKits } from './hinrighKitFighters'
import { createBenjaminBaton } from './benjaminBaton'
import { carryMoonlightRound } from './moonlightContract'
import { createChrolloBook } from './chrolloBook'
import { prepareDeathMatchLoadout } from './heavensDeathMatch/loadout'
import { prepareDeathMatchWorld } from './heavensDeathMatch/prepare'
import { createKurapika } from './kurapika'
import { createFightEnvironment, type FightEnvironment } from './fightEnvironment'
import { createPainPacker } from './feitanPain'
import { FIGHT_FPS } from './fightClock'
import { DEFAULT_FIGHT_FORMAT, fightFormat, type FightFormatId } from './formats'
import { createFightingNen } from './nen'
import { KAMEO_SPAWN, nextRoundKameos } from './kameos/rounds'
import { carryTskPoison } from './tsk17'
import type { ArcadeFighter, FightMode, FightState, FighterId } from './types'
import { initialNenPsychology, restedNenPsychology } from './nenPsychologyProfiles'
import { carryBodyMemory } from './bodyMemory'
import { applyBiscuitInterRoundCare } from './illumiBiscuitUpgrades'
import { carryOpponentIntel, createFightIntel } from './perception/opponentIntel'

interface CreateFightOptions {
  formatId?: FightFormatId
  mode?: FightMode
  environment?: Partial<FightEnvironment>
  /** Per-side command scheme (controlScheme.ts); omitted sides stay simplified. */
  controls?: ControlSchemes
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
  const environment = createFightEnvironment(typeof options === 'string' ? {} : options.environment)
  const created = setupIllumiNeedles({
    training: mode === 'training' ? createTrainingState(format.health) : undefined,
    arena: environment.arenaInteractions ? createArenaState() : undefined,
    battlefield: createBattlefield(environment),
    environment,
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
    burstAvailable: { player: true, opponent: true },
    opponentIntel: createFightIntel(),
  })
  return applyControlSchemes(
    prepareHinrighKits(
      prepareHisokaAsphyxia(
        prepareFortuneScenario(
          prepareBodyDamage(
            prepareMusseHistory(prepareDeathMatchWorld(prepareDeathMatchLoadout(created))),
          ),
        ),
      ),
      createBiohazardInventory,
    ),
    typeof options === 'string' ? undefined : options.controls,
  )
}

export function nextFightRound(state: FightState): FightState {
  if (state.phase !== 'finished' || state.matchWinner) return state
  const format = fightFormat(state.formatId)
  const next = carryMoonlightRound(
    {
      ...state,
      battlefield: carryPaperWorld(
        carryDolphinPeople(createBattlefield(state.environment), state.battlefield),
        state,
      ),
      arena:
        state.environment.arenaInteractions || hasMarkedTerrain(state)
          ? createArenaState()
          : undefined,
      rosterGuests: undefined,
      halkSoulLinks: undefined,
      halkSoulMinds: undefined,
      halkSoulOrigins: undefined,
      throwTech: undefined,
      voconteDoors: undefined,
      parallelFuture: undefined,
      futurePerception: undefined,
      forecastSimulation: undefined,
      lsdf: undefined,
      expulsion: undefined,
      deaths: undefined,
      attackClash: undefined,
      catsName: undefined,
      catsNameConsumed: undefined,
      tsk17: undefined,
      burst: undefined,
      burstAvailable: { player: true, opponent: true },
      opponentIntel: carryOpponentIntel(state.opponentIntel),
      player: carryTskPoison(
        applyBiscuitInterRoundCare(
          carryBodyMemory(
            preserveLifespan(
              createFighter({
                id:
                  state.halkSoulOrigins?.player ??
                  state.player.halkenburgOrigin ??
                  state.player.id,
                x: 22,
                facing: 1,
                health: format.health,
              }),
              state.player,
              state.frame,
            ),
            state.player,
          ),
        ),
        state.player,
      ),
      opponent: carryTskPoison(
        applyBiscuitInterRoundCare(
          carryBodyMemory(
            preserveLifespan(
              createFighter({
                id:
                  state.halkSoulOrigins?.opponent ??
                  state.opponent.halkenburgOrigin ??
                  state.opponent.id,
                x: 78,
                facing: -1,
                health: format.health,
              }),
              state.opponent,
              state.frame,
            ),
            state.opponent,
          ),
        ),
        state.opponent,
      ),
      ...(state.kameos && {
        kameos: nextRoundKameos(state.kameos, (fighter, side) =>
          preserveLifespan(
            createFighter({ id: fighter.id, ...KAMEO_SPAWN[side], health: format.health }),
            fighter,
            state.frame,
          ),
        ),
      }),
      phase: 'ready',
      frame: 0,
      time: format.roundFrames / FIGHT_FPS,
      remainingFrames: format.roundFrames,
      frameAccumulator: 0,
      hitstop: 0,
      directMoveBuffer: undefined,
      winner: null,
      finishReason: null,
      roundNumber: state.roundNumber + 1,
      score: { player: 0, opponent: 0 },
      knockdowns: { player: 0, opponent: 0 },
      bungeeGum: null,
      gumNetwork: undefined,
      projectiles: [],
      nextProjectileId: 1,
      impact: null,
      audioContacts: undefined,
      audioInterceptions: undefined,
    },
    state,
  )
  return prepareHinrighKits(next, createBiohazardInventory)
}

export function preserveLifespan(
  fighter: ArcadeFighter,
  previous: ArcadeFighter,
  elapsedFrames: number,
): ArcadeFighter {
  fighter = {
    ...fighter,
    // A round break recovers one quarter; the remaining residue lasts for the match.
    nenMentalFatigue: Math.round((previous.nenMentalFatigue ?? 0) * 0.75),
    // The break halves emotional residue and recentres composure/resolve toward neutral.
    nenPsychology: restedNenPsychology(fighter.id, previous.nenPsychology),
  }
  fighter = carryHalkenburgSoul(fighter, previous)
  fighter = carryIllumiFace(fighter, previous, elapsedFrames)
  fighter = carryNeedleFace(fighter, previous)
  fighter = carryBodyDamage(fighter, previous)
  fighter = carryDocumentState(fighter, previous)
  fighter = carryDolphinState(fighter, previous)
  fighter = carryKallutoPaper(fighter, previous)
  fighter = carryMusseHistory(fighter, previous)
  fighter = carryVoiceAutopilot(
    {
      ...fighter,
      personalEncounters: previous.personalEncounters,
      gumResuscitationProgram: previous.gumResuscitationProgram,
      gumResuscitationCompleted: previous.gumResuscitationCompleted,
      blackVoiceGear: restingBlackVoiceGear(previous.blackVoiceGear),
    },
    previous,
  )
  fighter = keepControlScheme(
    preserveIllumiNeedles(preservePredatorKnowledge(fighter, previous), previous),
    previous,
  )
  return fighter.kurapika
    ? {
        ...fighter,
        kurapika: {
          ...fighter.kurapika,
          lifespanFrames: previous.kurapika?.lifespanFrames ?? 0,
        },
      }
    : fighter
}

export function createFighter(options: {
  id: FighterId
  x: number
  facing: -1 | 1
  health: number
}): ArcadeFighter {
  return {
    ...options,
    equipment: personalEquipment(options.id),
    writingKit:
      options.id === 'basho'
        ? createWritingKit(`${options.facing === 1 ? 'player' : 'opponent'}:basho:kit`)
        : undefined,
    blackVoiceGear:
      options.id === 'chrollo'
        ? createBlackVoiceGear(options.facing === 1 ? 'player' : 'opponent')
        : undefined,
    maxHealth: options.health,
    paperKit: personalPaperKit(options.id, options.facing),
    biohazard: options.id === 'hinrigh' ? createBiohazardInventory() : undefined,
    biohazardDevices: initialDeviceKit(options.id),
    kurapika: options.id === 'kurapika' ? createKurapika() : undefined,
    y: 0,
    velocityY: 0,
    burstZetsuFrames: 0,
    aura: 55,
    nenMentalFatigue: 0,
    nenPsychology: initialNenPsychology(options.id),
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
    hatsuEffects: {
      ...emptyHatsuEffects(),
      baton: options.id === 'benjamin' ? createBenjaminBaton() : null,
      painPacker: options.id === 'feitan' ? createPainPacker() : null,
    },
    attack: null,
    bufferedAttack: null,
  }
}

function emptyHatsuEffects(): ArcadeFighter['hatsuEffects'] {
  return {
    painPacker: null,
    forcedZetsuFrames: 0,
    contagionFrames: 0,
    contagionStacks: 0,
    baton: null,
    senseSeals: 0,
    blinkyFrames: 0,
    cohortWillFrames: 0,
    arrowNocked: 0,
    possessedFrames: 0,
    sunMark: 0,
    moonMark: 0,
    manipulatedFrames: 0,
    isolationFrames: 0,
    cyclotronTurns: 0,
    stitchedFrames: 0,
    restrainedFrames: 0,
    entrancedFrames: 0,
    teleportDodges: 0,
    wormDodges: 0,
    kachoGuards: 0,
    desireFrames: 0,
    momozeFrames: 0,
    smokeFrames: 0,
    coinCharges: 0,
    gidalCurseFrames: 0,
    synthesisFrames: 0,
    eyeWogFrames: 0,
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

function initialDeviceKit(id: FighterId) {
  return id === 'hinrigh' ? createBiohazardDevices() : undefined
}
