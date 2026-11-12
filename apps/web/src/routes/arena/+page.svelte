<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte'
  import { SvelteURLSearchParams } from 'svelte/reactivity'
  import Seo from '$lib/components/Seo.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import TourModeFullscreen from '$lib/components/tour/TourModeFullscreen.svelte'
  import GameManualOverlay from '$lib/components/tour/GameManualOverlay.svelte'
  import ReplayPanel from '$lib/components/arena/ReplayPanel.svelte'
  import ArenaV3Panel from '$lib/components/arena/ArenaV3Panel.svelte'
  import ArenaHatsuFx from '$lib/components/arena/ArenaHatsuFx.svelte'
  import ArenaBriefing from '$lib/components/arena/ArenaBriefing.svelte'
  import ArenaSetupPanel from '$lib/components/arena/ArenaSetupPanel.svelte'
  import {
    advanceArena,
    OPPONENT_DOCTRINES,
    type ArenaDifficulty,
    type OpponentDoctrine,
  } from '$lib/arena/ai'
  import { arenaHatsuEffect, worksInArena } from '$lib/arena/hatsu'
  import { arenaDefinition } from '$lib/arena/hatsu/contract'
  import { zoneFromPitch } from '$lib/arena/targeting'
  import { playArenaHatsu, playArenaImpact } from '$lib/arena/audio'
  import {
    difficultyLabel,
    EMPTY_STATS,
    gradeArena,
    recordEvent,
    type ArenaStats,
  } from '$lib/arena/progression'
  import { buildCombatTerrain } from '$lib/arena/terrain'
  import { ARENA_CHALLENGES } from '$lib/arena/challenges/catalogue'
  import { evaluateChallenge, evaluateChallengeProgress } from '$lib/arena/challenges/evaluate'
  import type { ChallengeObjective } from '$lib/arena/challenges/types'
  import { ArenaRecorder } from '$lib/arena/replay/recorder'
  import type { ArenaReplay } from '$lib/arena/replay/types'
  import { serializeReplay } from '$lib/arena/replay/codec'
  import { replayFromUrl } from '$lib/arena/replay/share'
  import { eventsFromReplay, playReplay } from '$lib/arena/replay/player'
  import { forkReplayAtTick } from '$lib/arena/replay/branch'
  import { arenaRyuAction, auraPercent, strikeTarget } from '$lib/arena/controls'
  import { resolveArenaExperience, type ArenaOpponentId } from '$lib/arena/experience'
  import { formatOutcome, type ArenaFormatId } from '$lib/arena/formats'
  import { loadReplayLibrary } from '$lib/arena/replay/library'
  import { ARENA_MANUAL_CONTROLS } from '$lib/arena/manual'
  import { safeStorageGet, safeStorageSet } from '$lib/arena/storage'
  import { readAura } from '$lib/combat/perception'
  import { STRIKE_RANGE } from '$lib/combat/resolve'
  import { combatReducer, initialCombatState } from '$lib/combat/reducer'
  import {
    BODY_ZONES,
    type BodyZone,
    type CombatAction,
    type CombatEvent,
    type Impact,
  } from '$lib/combat/types'
  import { floorOf, theShip, crossingsOn } from '$lib/tour/blueprint'
  import { EMPTY_WORLD } from '$lib/tour/hatsu'
  import { localizeHatsu } from '$lib/i18n/hatsu'
  import TourMinimapPanel from '$lib/components/tour/TourMinimapPanel.svelte'
  import { activeHatsu, closeHatsuGate, hatsuPanelOpen, openHatsuGate } from '$lib/nen/hatsuState'
  import { ModeNenState } from '$lib/nen/modeState.svelte'
  import type { Apparition } from '$lib/tour/apparitions'
  import type { Space, Structure, Vec2 } from '$lib/tour/types'
  import { reconcileWalk } from '$lib/arena/walkSync'
  import { blockerAt, distance, facing, isMovement, solidCentre } from '$lib/arena/sceneGeometry'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import './arena.css'
  import type { PageData } from './$types'
  import { arenaNen } from '$lib/nen/tourAdapters'
  import { isNenControlCode } from '$lib/nen/controls'
  import type { NenTechniqueAction } from '@black-whale/nen-engine'
  import { ryuDistribution } from '$lib/combat/ryu'
  import {
    applyArenaHandoff,
    consumeArenaHandoff,
    saveArenaHandoffResult,
    type ArenaHandoff,
  } from '$lib/arena/bridge'

  let { data }: { data: PageData } = $props()

  const DT = 1 / 60
  const ship = theShip()
  const terrain = untrack(() => buildCombatTerrain(data.terrainId))
  let plan = $state(ship.plans.get(terrain.tierId)!)
  let ground = $derived(floorOf(terrain.space, plan.tier))

  let game = $state(freshGame())
  let started = $state(false)
  let briefingOpen = $state(true)
  let manualOpen = $state(false)
  let position = $state<Vec2>(terrain.spawns[0])
  let heading = $state(0)
  let lookPitch = $state(0)
  let aimedExtra = $state<string | null>(null)
  let aimedSolidAt = $state<Structure | null>(null)
  let currentSpace = $state<Space | null>(null)
  let engaged = $state(false)
  let touch = $state(false)
  let tierId = $state(terrain.tierId)

  const nameOf = (entity: Space | { name: string; nameFr: string } | undefined) => {
    if (!entity) return ''
    return $locale === 'fr' ? entity.nameFr : entity.name
  }

  function selectTier(id: string) {
    if (id !== terrain.tierId) return
    tierId = id
    const newPlan = ship.plans.get(id)
    if (newPlan) plan = newPlan
  }

  const crossings = $derived(crossingsOn(ship, tierId))
  const decks = $derived(
    ship.decks.map((tier) => ({
      id: tier.id,
      label: nameOf(tier),
      active: tier.id === tierId,
    })),
  )
  let jumpTo = $state<string | null>(terrain.id)
  let jumpAt = $state<Vec2 | null>(terrain.spawns[0])
  let jumpHeading = $state<number | null>(facing(terrain.spawns[0], terrain.spawns[1]))
  let jumpPitch = $state<number | null>(null)
  let agreed: Vec2 = terrain.spawns[0]
  let frame = 0
  let owed = 0
  let last = 0
  type CombatMotion = 'idle' | 'guard' | 'hit' | 'down' | 'attack'
  let playerMotion = $state<CombatMotion>('idle')
  let opponentMotion = $state<CombatMotion>('idle')
  let playerMotionSeq = 0
  let opponentMotionSeq = 0
  type CommandAnimation =
    | 'strike'
    | 'ko'
    | 'ryu-up'
    | 'ryu-down'
    | `zone-${BodyZone}`
    | 'ten'
    | 'ren'
    | 'zetsu'
    | 'gyo'
    | 'in'
    | 'ken'
    | 'hatsu'
  let commandAnimation = $state<CommandAnimation | null>(null)
  let commandAnimationSeq = $state(0)
  let hatsuAnimationSeq = $state(0)
  let lesson = $state(0)

  const initialDoctrine = untrack(() => data.doctrine)
  const initialDifficulty = untrack(() => data.difficulty)
  const initialChallengeId = untrack(() => data.challengeId)
  const initialFormatId = untrack(() => data.formatId)
  const initialOpponentId = untrack(() => data.opponentId)

  let opponentDoctrine = $state<OpponentDoctrine>(initialDoctrine)
  let difficulty = $state<ArenaDifficulty>(initialDifficulty)
  let formatId = $state<ArenaFormatId>(initialFormatId)
  let opponentId = $state<ArenaOpponentId>(initialOpponentId)
  let recorder = new ArenaRecorder({
    setup: combatSetup(),
    doctrine: initialDoctrine,
    difficulty: initialDifficulty,
  })
  let lastReplay = $state<ArenaReplay | null>(null)
  let stats = $state<ArenaStats>({ ...EMPTY_STATS })
  let actionCounts = $state<Partial<Record<CombatAction['type'], number>>>({})
  let bestGrade = $state<string | null>(null)
  let graded = $state(false)
  let selectedChallengeId = $state<string | null>(initialChallengeId)
  let sourceHandoff = $state<ArenaHandoff | null>(null)
  // Bookkeeping, not state: nothing renders from it, it only holds timer
  // handles so they can be cleared on teardown.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const motionTimers = new Set<number>()

  let reading = $derived(readAura(game.player, game.opponent))
  let carriedHatsu = $derived($activeHatsu ? localizeHatsu($activeHatsu, $locale) : null)
  let hatsuEffect = $derived(arenaHatsuEffect($activeHatsu))
  let hatsuDefinition = $derived(arenaDefinition($activeHatsu))
  let gap = $derived(distance(game.player.position, game.opponent.position))
  let inRange = $derived(gap <= STRIKE_RANGE)
  let threatened = $derived(reading.intentRemaining !== null)
  let aimedZone = $derived(zoneFromPitch(lookPitch))
  const extendedNen = new ModeNenState()
  let playerNen = $derived({
    ...arenaNen(game.player),
    en: extendedNen.value.en,
    shu: extendedNen.value.shu,
    on: extendedNen.value.on,
  })
  let opponentNen = $derived(arenaNen(game.opponent))
  let opponentActor = $derived<Apparition[]>([
    {
      id: 'arena-opponent',
      kind: 'combatant',
      spaceId: terrain.id,
      tierId: terrain.tierId,
      at: game.opponent.position,
      heading: game.opponent.facing,
      y: ground,
      size: 1,
      colour: 0xc36f68,
      stage: actorStage(),
      human: {
        role: 'fighter',
        identity: `arena:${opponentDoctrine}`,
        pose:
          game.opponent.condition === 'down' || game.opponent.condition === 'ko'
            ? 'fallen'
            : game.opponent.intent || opponentMotion === 'attack'
              ? 'attack'
              : opponentMotion === 'guard'
                ? 'guard'
                : opponentMotion === 'hit'
                  ? 'held'
                  : 'idle',
        aura: game.opponent.mode,
        nen: opponentNen,
      },
      hidden: false,
      pick: true,
    },
  ])
  let opponentWalls = $derived(blockerAt(game.opponent.position, terrain.id))
  let selectedChallenge = $derived(
    ARENA_CHALLENGES.find((challenge) => challenge.id === selectedChallengeId) ?? null,
  )
  let challengeResult = $derived(
    selectedChallenge && lastReplay ? evaluateChallenge(selectedChallenge, lastReplay) : null,
  )
  let challengeProgress = $derived(
    selectedChallenge
      ? evaluateChallengeProgress(selectedChallenge, { state: game, actions: actionCounts, stats })
      : null,
  )
  let hatsuCost = $derived(hatsuDefinition?.cost ?? 18)
  let detailedRyu = $derived(ryuDistribution(game.player))

  function objectiveLabel(objective: ChallengeObjective): string {
    if (objective.kind === 'win') return $t.arena.ui.objective.win
    if (objective.kind === 'accuracy')
      return `${$t.arena.ui.objective.accuracy} ≥ ${Math.round(objective.minimum * 100)}%`
    if (objective.kind === 'aura') return `${$t.arena.ui.objective.aura} ≥ ${objective.minimum}`
    if (objective.kind === 'blocks') return `${$t.arena.ui.objective.blocks} × ${objective.count}`
    return `${$t.arena.ui.objective.use} ${objective.action} × ${objective.count}`
  }

  function freshGame() {
    return initialCombatState(combatSetup())
  }

  function combatSetup() {
    return {
      playerAt: terrain.spawns[0],
      opponentAt: terrain.spawns[1],
      terrain: { id: terrain.id, footprint: terrain.footprint, walls: terrain.walls },
    }
  }

  function send(action: CombatAction): boolean {
    if (briefingOpen || manualOpen || game.outcome !== 'playing') return false
    started = true
    const previousGame = game
    const previous = game.lastEvent
    game = combatReducer(game, action)
    game = applyMatchFormat(game)
    const accepted =
      action.type === 'TICK'
        ? game !== previousGame
        : game[action.side] !== previousGame[action.side] || game.outcome !== previousGame.outcome
    if (!accepted) return false
    if (action.type !== 'TICK') {
      recorder.record(action)
      actionCounts = { ...actionCounts, [action.type]: (actionCounts[action.type] ?? 0) + 1 }
    }
    advanceLesson(action)
    if (game.lastEvent !== previous && game.lastEvent) animateExchange(game.lastEvent)
    finishRun()
    return true
  }

  function advanceLesson(action: CombatAction) {
    if (lesson === 0 && action.type === 'RYU') lesson = 1
    else if (lesson === 1 && action.type === 'GUARD') lesson = 2
    else if (lesson === 2 && action.type === 'FEINT') lesson = 3
    else if (lesson === 3 && action.type === 'STRIKE') lesson = 4
  }

  function command(action: CombatAction, animation: CommandAnimation): boolean {
    const previousPlayer = game.player
    send(action)
    const accepted = game.player !== previousPlayer
    if (accepted) animateCommand(animation)
    return accepted
  }

  function useStandardNen(action: NenTechniqueAction) {
    if (action.type === 'EN')
      return command({ type: 'EN', side: 'player', radius: action.radius }, 'gyo')
    if (action.type === 'SHU')
      return command(
        { type: 'SHU', side: 'player', objectId: action.objectId, on: action.on },
        'hatsu',
      )
    if (action.type === 'ON') return extendedNen.use(action)
    if (action.type === 'TEN' || action.type === 'REN' || action.type === 'ZETSU')
      return command(
        {
          type: 'MODE',
          side: 'player',
          mode: action.type.toLowerCase() as 'ten' | 'ren' | 'zetsu',
        },
        action.type.toLowerCase() as 'ten' | 'ren' | 'zetsu',
      )
    if (action.type === 'GYO' || action.type === 'IN' || action.type === 'KEN')
      return command(
        { type: action.type, side: 'player', on: action.on },
        action.type.toLowerCase() as 'gyo' | 'in' | 'ken',
      )
    if (action.type === 'KO' && action.zone)
      return command(
        {
          type: 'KO',
          side: 'player',
          zone:
            action.zone === 'feet'
              ? 'legs'
              : action.zone === 'hands'
                ? 'arms'
                : (action.zone as BodyZone),
        },
        'ko',
      )
    if (action.type === 'RYU') {
      const ryu = arenaRyuAction(action, game.player)
      return command(
        ryu,
        (ryu.attackShare ?? game.player.attackShare) >= game.player.attackShare
          ? 'ryu-up'
          : 'ryu-down',
      )
    }
  }

  function setZone(zone: BodyZone) {
    command({ type: 'RYU', side: 'player', guard: zone }, `zone-${zone}`)
  }

  function strike() {
    command(
      {
        type: 'STRIKE',
        side: 'player',
        zone: aimedZone,
        targetAt: strikeTarget(game.player.position, heading, STRIKE_RANGE),
      },
      'strike',
    )
  }

  function gatherKo() {
    command({ type: 'KO', side: 'player', zone: game.player.guard }, 'ko')
  }

  function guard() {
    command({ type: 'GUARD', side: 'player' }, 'ken')
  }

  function feint() {
    command({ type: 'FEINT', side: 'player', zone: game.player.guard }, 'in')
  }

  function evade(side: -1 | 1) {
    const vector: Vec2 = [Math.cos(heading) * side, -Math.sin(heading) * side]
    command({ type: 'EVADE', side: 'player', vector }, 'ken')
  }

  function castHatsu() {
    if (!hatsuEffect) {
      hatsuPanelOpen.set(true)
      return
    }
    if (
      (carriedHatsu?.id === 'parallel-future' || carriedHatsu?.id === 'rihan-predator') &&
      (game.player.hatsuPreparation?.id !== carriedHatsu.id ||
        (carriedHatsu.id === 'rihan-predator' && game.player.hatsuPreparation.observations < 3))
    ) {
      command({ type: 'PREPARE_HATSU', side: 'player', hatsuId: carriedHatsu.id }, 'hatsu')
      return
    }
    const accepted = command(
      {
        type: 'HATSU',
        side: 'player',
        effect: hatsuEffect,
        zone: aimedZone,
        hatsuId: carriedHatsu?.id,
        cost: hatsuDefinition?.cost,
        targetAt:
          carriedHatsu?.id === 'bungee-gum' && aimedSolidAt ? solidCentre(aimedSolidAt) : undefined,
      },
      'hatsu',
    )
    if (accepted) {
      hatsuAnimationSeq += 1
      playArenaHatsu(hatsuEffect, $activeHatsu)
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey) return
    if (event.key === '?') {
      manualOpen = !manualOpen
      event.preventDefault()
      return
    }
    if (manualOpen || briefingOpen) return
    if (isNenControlCode(event.code)) return
    if (isMovement(event.code)) {
      started = true
      return
    }
    if (event.repeat || game.outcome !== 'playing') return

    if (event.code === 'Space') strike()
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') guard()
    else if (event.code === 'KeyV') feint()
    else if (event.code === 'KeyJ') evade(-1)
    else if (event.code === 'KeyL') evade(1)
    else return
    event.preventDefault()
  }

  function reportWalk() {
    if (briefingOpen || manualOpen || game.outcome !== 'playing') return
    const frame = { camera: [position[0], position[1]] as Vec2, heading, state: game, agreed }
    const correction = reconcileWalk(frame, (action) => {
      send(action)
      return game
    })
    agreed = [game.player.position[0], game.player.position[1]]
    if (!correction) return
    position = [correction[0], correction[1]]
    jumpTo = terrain.id
    jumpAt = position
    jumpHeading = heading
    jumpPitch = lookPitch
  }

  function tick(now: number) {
    frame = requestAnimationFrame(tick)
    const elapsed = last === 0 ? 0 : (now - last) / 1000
    last = now
    owed = Math.min(owed + elapsed, 0.2)
    if (briefingOpen || manualOpen) {
      owed = 0
      return
    }
    reportWalk()
    if (!started) {
      owed = 0
      return
    }
    while (owed >= DT && game.outcome === 'playing') {
      owed -= DT
      const previous = game.lastEvent
      game = advanceArena(game, DT, { doctrine: opponentDoctrine, difficulty })
      game = applyMatchFormat(game)
      recorder.advance()
      if (game.lastEvent !== previous && game.lastEvent) animateExchange(game.lastEvent)
      finishRun()
    }
  }

  function restart() {
    game = freshGame()
    extendedNen.reset()
    tierId = terrain.tierId
    plan = ship.plans.get(terrain.tierId)!
    position = terrain.spawns[0]
    agreed = terrain.spawns[0]
    jumpTo = terrain.id
    jumpAt = terrain.spawns[0]
    jumpHeading = facing(terrain.spawns[0], terrain.spawns[1])
    started = false
    playerMotion = 'idle'
    opponentMotion = 'idle'
    commandAnimation = null
    lesson = 0
    stats = { ...EMPTY_STATS }
    actionCounts = {}
    graded = false
    lastReplay = null
    recorder = new ArenaRecorder({
      setup: combatSetup(),
      doctrine: opponentDoctrine,
      difficulty,
    })
    owed = 0
    last = 0
  }

  function resumeReplay(tick: number) {
    if (!lastReplay) return
    const branch = forkReplayAtTick(lastReplay, tick)
    game = branch.state
    recorder = branch.recorder
    position = game.player.position
    agreed = game.player.position
    lastReplay = null
    graded = false
    started = false
    briefingOpen = false
  }

  function actorStage(): number {
    const mode = { ten: 0, ren: 1, zetsu: 2 }[game.opponent.mode]
    const fallen = game.opponent.condition === 'down' || game.opponent.condition === 'ko'
    const pose = fallen ? 'down' : game.opponent.intent ? 'attack' : opponentMotion
    const poseIndex: Record<CombatMotion, number> = {
      idle: 0,
      guard: 1,
      hit: 2,
      down: 3,
      attack: 4,
    }
    return mode + poseIndex[pose] * 3
  }

  function animateExchange(event: CombatEvent) {
    stats = recordEvent(stats, event)
    playArenaImpact(event.impact)
    const defenderMotion = reactionFor(event.impact)
    if (event.attacker === 'player') {
      playPlayer('attack', 280)
      if (defenderMotion !== 'idle') playOpponent(defenderMotion, reactionTime(event.impact))
      return
    }
    playOpponent('attack', 320)
    if (defenderMotion !== 'idle') playPlayer(defenderMotion, reactionTime(event.impact))
  }

  function finishRun() {
    if (graded || game.outcome === 'playing') return
    graded = true
    lastReplay = recorder.finish(game)
    if (sourceHandoff) saveArenaHandoffResult(sessionStorage, sourceHandoff.id, game)
    safeStorageSet(sessionStorage, 'black-whale:arena-last-replay', serializeReplay(lastReplay))
    const grade = gradeArena(stats, game.outcome === 'won', game.player.aura)
    const order = ['C', 'B', 'A', 'S']
    if (!bestGrade || order.indexOf(grade) > order.indexOf(bestGrade)) {
      bestGrade = grade
      safeStorageSet(localStorage, 'black-whale:arena-best-grade', grade)
    }
  }

  function reactionFor(impact: Impact): CombatMotion {
    if (impact === 'blocked') return 'guard'
    if (impact === 'knockdown' || impact === 'ko') return 'down'
    if (impact === 'clean' || impact === 'critical') return 'hit'
    return 'idle'
  }

  function reactionTime(impact: Impact): number {
    if (impact === 'knockdown' || impact === 'ko') return 900
    return impact === 'critical' ? 520 : 360
  }

  function playPlayer(motion: CombatMotion, duration: number) {
    const sequence = ++playerMotionSeq
    playerMotion = motion
    later(() => {
      if (sequence === playerMotionSeq) playerMotion = 'idle'
    }, duration)
  }

  function playOpponent(motion: CombatMotion, duration: number) {
    const sequence = ++opponentMotionSeq
    opponentMotion = motion
    later(() => {
      if (sequence === opponentMotionSeq) opponentMotion = 'idle'
    }, duration)
  }

  function animateCommand(animation: CommandAnimation) {
    const sequence = ++commandAnimationSeq
    commandAnimation = animation
    later(
      () => {
        if (sequence === commandAnimationSeq) commandAnimation = null
      },
      animation === 'ko' ? 850 : 620,
    )
  }

  function commandGroup(animation: CommandAnimation | null): string | null {
    if (!animation) return null
    if (animation.startsWith('zone-') || animation.startsWith('ryu-')) return 'ryu'
    if (animation === 'ten' || animation === 'ren' || animation === 'zetsu') return 'mode'
    return animation
  }

  function commandLabel(animation: CommandAnimation): string {
    if (animation.startsWith('zone-')) {
      const zone = animation.slice(5) as BodyZone
      return `Ryu · ${$t.arena.zone[zone]}`
    }
    if (animation === 'ryu-up') return `Ryu · ${Math.round(game.player.attackShare * 100)}% ATK`
    if (animation === 'ryu-down')
      return `Ryu · ${Math.round(100 - game.player.attackShare * 100)}% DEF`
    return animation.toUpperCase()
  }

  function later(callback: () => void, delay: number) {
    const timer = window.setTimeout(() => {
      motionTimers.delete(timer)
      callback()
    }, delay)
    motionTimers.add(timer)
  }

  function arenaHref(terrainId: string): string {
    const search = new SvelteURLSearchParams({ terrain: terrainId })
    if (selectedChallengeId) search.set('challenge', selectedChallengeId)
    search.set('doctrine', opponentDoctrine)
    search.set('difficulty', difficulty)
    search.set('format', formatId)
    search.set('opponent', opponentId)
    return `?${search}`
  }

  function persistOptions() {
    window.history.replaceState(window.history.state, '', arenaHref(terrain.id))
  }

  function applyOptions() {
    const experience = resolveArenaExperience({
      formatId,
      opponentId,
      history: typeof localStorage === 'undefined' ? [] : loadReplayLibrary(localStorage),
    })
    opponentDoctrine = experience.doctrine
    difficulty = experience.difficulty
    restart()
    persistOptions()
  }

  onMount(() => {
    sourceHandoff = consumeArenaHandoff(sessionStorage)
    if (sourceHandoff) game = applyArenaHandoff(game, sourceHandoff)
    const experience = resolveArenaExperience({
      formatId,
      opponentId,
      history: loadReplayLibrary(localStorage),
    })
    opponentDoctrine = experience.doctrine
    difficulty = experience.difficulty
    const sharedReplay = replayFromUrl(window.location.href)
    if (sharedReplay) {
      if (sharedReplay.setup.terrain.id !== terrain.id) {
        const url = new URL(window.location.href)
        url.searchParams.set('terrain', sharedReplay.setup.terrain.id)
        url.searchParams.set('doctrine', sharedReplay.doctrine)
        url.searchParams.set('difficulty', sharedReplay.difficulty)
        window.location.replace(url)
        return
      }
      lastReplay = sharedReplay
      game = playReplay(sharedReplay).state
      agreed = game.player.position
      position = game.player.position
      opponentDoctrine = sharedReplay.doctrine
      difficulty = sharedReplay.difficulty
      stats = eventsFromReplay(sharedReplay).reduce(recordEvent, { ...EMPTY_STATS })
      graded = true
    }
    bestGrade = safeStorageGet(localStorage, 'black-whale:arena-best-grade')
    openHatsuGate({
      admits: worksInArena,
      reason:
        $locale === 'fr'
          ? 'Arena ne propose que les Hatsu dont les règles s’appliquent à un duel direct.'
          : 'Arena only offers Hatsu whose rules apply to a direct duel.',
    })
    window.addEventListener('keydown', onKeyDown)
    frame = requestAnimationFrame(tick)
  })

  function applyMatchFormat(state: typeof game): typeof game {
    const format = resolveArenaExperience({ formatId, opponentId }).format
    const usedRequiredAction =
      !format.requiredAction || Boolean(actionCounts[format.requiredAction])
    return { ...state, outcome: formatOutcome(format, state, usedRequiredAction) }
  }

  onDestroy(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('keydown', onKeyDown)
    cancelAnimationFrame(frame)
    for (const timer of motionTimers) window.clearTimeout(timer)
    closeHatsuGate()
  })
</script>

<Seo
  title={`${$t.arena.title} — ${nameOf(terrain.space)}`}
  description={$t.arena.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.arena.breadcrumb, path: $link('/arena') },
  ])}
/>

<div
  class="arena-world"
  class:player-empowered={game.player.empowered > 0}
  class:opponent-bound={game.opponent.bound > 0}
>
  <TourModeFullscreen />
  <TourMinimapPanel
    {plan}
    {position}
    {heading}
    currentSpaceId={currentSpace?.id ?? null}
    {decks}
    {crossings}
    {nameOf}
    onSelectDeck={selectTier}
  />
  <h1 class="sr-only">{$t.arena.title}</h1>

  {#if briefingOpen}
    <ArenaBriefing onStart={() => (briefingOpen = false)} />
  {/if}
  <TourScene
    {ship}
    bind:tierId
    bind:position
    bind:heading
    bind:lookPitch
    bind:aimedExtra
    bind:aimedSolidAt
    bind:currentSpace
    bind:engaged
    bind:touch
    bind:jumpTo
    bind:jumpAt
    bind:jumpHeading
    bind:jumpPitch
    world={EMPTY_WORLD}
    nen={playerNen}
    inputDisabled={briefingOpen || manualOpen || game.outcome !== 'playing'}
    onNenChange={useStandardNen}
    onPhysicalNenAction={strike}
    extras={opponentActor}
    collisionWalls={[...terrain.walls, ...opponentWalls]}
    aiming={true}
    castOnClick={true}
    onCast={strike}
    onHatsu={() => castHatsu()}
    touchLabels={{ move: $t.tour.touch.move, cast: $t.arena.action.strike }}
    soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
    loadingLabel={$t.tour.loading}
    unsupportedLabel={$t.tour.unsupported}
  />

  <div class="reticle" class:near={inRange} class:locked={aimedExtra === 'arena-opponent'}>
    <span>{$t.arena.zone[aimedZone]}</span>
  </div>

  {#if game.opponent.intent || game.opponent.ko}
    <div class="attack-telegraph" class:concealed={!threatened} aria-live="assertive">
      {#if reading.intentZone}
        <small>{$t.arena.ui.intentRead}</small>
        <strong>{$t.arena.zone[reading.intentZone]}</strong>
        <i
          style:--threat-progress={`${Math.max(0, 1 - (reading.intentRemaining ?? 0) / 0.62) * 100}%`}
        ></i>
      {:else if reading.koZone}
        <small>{$t.arena.ui.koRead}</small>
        <strong>{$t.arena.zone[reading.koZone]}</strong>
        <i
          style:--threat-progress={`${Math.max(0, 1 - (game.opponent.ko?.remaining ?? 0) / 0.8) * 100}%`}
        ></i>
      {:else}
        <small>{$t.arena.ui.auraDisturbance}</small>
        <strong>?</strong>
      {/if}
    </div>
  {/if}

  {#if game.tethers.length > 0}
    <div class="elastic-readout" aria-live="polite">
      BUNGEE GUM · {game.tethers[0].anchor
        ? $t.arena.ui.scenery
        : OPPONENT_DOCTRINES[opponentDoctrine].name}
      · {game.tethers[0].remaining.toFixed(1)}s
    </div>
  {/if}

  {#key commandAnimationSeq}
    {#if commandAnimation}
      <div class="command-fx {commandAnimation}" aria-hidden="true">
        <i class="command-ring"></i>
        <i class="command-core"></i>
        <b>{commandLabel(commandAnimation)}</b>
      </div>
    {/if}
  {/key}

  {#if hatsuAnimationSeq > 0 && $activeHatsu}
    <ArenaHatsuFx profile={$activeHatsu} sequence={hatsuAnimationSeq} />
  {/if}

  <div
    class="combat-hands"
    class:striking={playerMotion === 'attack'}
    class:guarding={playerMotion === 'guard'}
    class:charging={Boolean(game.player.ko)}
    class:ren={game.player.mode === 'ren'}
    class:zetsu={game.player.mode === 'zetsu'}
    aria-hidden="true"
  >
    <i class="hand left-hand"><b></b></i>
    <i class="hand right-hand"><b></b></i>
  </div>

  {#if playerMotion === 'hit' || playerMotion === 'down'}
    <div class="impact-wash hit" aria-hidden="true"></div>
  {:else if playerMotion === 'guard'}
    <div class="impact-wash blocked" aria-hidden="true"></div>
  {/if}

  <header class="arena-overlay-header">
    <div class="terrain-label">
      <p>{$t.arena.eyebrow}</p>
      <strong>{$locale === 'fr' ? terrain.space.nameFr : terrain.space.name}</strong>
      <small
        >{$t.arena.source} · {$locale === 'fr'
          ? terrain.space.sourceFr
          : terrain.space.source}</small
      >
    </div>
    <div class="match-rule">
      <span>{$t.arena.firstTo}</span>
      <strong>{game.player.score} — {game.opponent.score}</strong>
      <small>{$t.arena.distance} · {gap.toFixed(1)} m</small>
    </div>
  </header>

  <ArenaSetupPanel
    terrainId={terrain.id}
    hrefFor={arenaHref}
    bind:selectedChallengeId
    bind:difficulty
    bind:opponentDoctrine
    bind:formatId
    bind:opponentId
    progress={challengeProgress}
    {objectiveLabel}
    onChange={applyOptions}
  />

  <div class="combat-keys" aria-label={$t.arena.keys.label}>
    <span class:active={commandGroup(commandAnimation) === 'strike'}
      ><kbd>{$t.arena.keys.strike}</kbd>{$t.arena.action.strike}</span
    >
    <span class:active={commandGroup(commandAnimation) === 'ko'}
      ><kbd>{$t.arena.keys.ko}</kbd>{$t.arena.action.ko}</span
    >
    <span class:active={commandGroup(commandAnimation) === 'ryu'}
      ><kbd>{$t.arena.keys.ryu}</kbd>Ryu</span
    >
    <span class:active={commandGroup(commandAnimation) === 'mode'}
      ><kbd>{$t.arena.keys.modes}</kbd>Ten · Ren · Zetsu</span
    >
    <span class:active={commandGroup(commandAnimation) === 'gyo'}><kbd>G</kbd>Gyo</span>
    <span class:active={commandGroup(commandAnimation) === 'in'}><kbd>I</kbd>In</span>
    <span class:active={commandGroup(commandAnimation) === 'ken'}><kbd>K</kbd>Ken</span>
    <span><kbd>⇧</kbd>{$t.arena.action.guard}</span>
    <span><kbd>V</kbd>{$t.arena.action.feint}</span>
    <span class:active={commandGroup(commandAnimation) === 'hatsu'}><kbd>H</kbd>Hatsu</span>
  </div>

  {#if touch && game.outcome === 'playing'}
    <nav class="touch-combat" aria-label={$t.arena.ui.quickActions}>
      <button class="primary" onclick={strike}>{$t.arena.action.strike}</button>
      <button onclick={guard}>{$t.arena.ui.guard}</button>
      <button onclick={feint}>{$t.arena.ui.feint}</button>
      <button onclick={() => evade(-1)}>↙</button>
      <button onclick={() => evade(1)}>↘</button>
      <button onclick={castHatsu}>Hatsu</button>
    </nav>
  {/if}

  {#if lesson < 4 && game.outcome === 'playing'}
    <aside class="arena-lesson" aria-live="polite">
      <small>{$t.arena.training} · {lesson + 1}/4</small>
      <strong>{$t.arena.lesson[lesson].title}</strong>
      <p>{$t.arena.lesson[lesson].body}</p>
    </aside>
  {/if}

  {#if !engaged && game.outcome === 'playing'}
    <p class="enter-prompt">{$t.arena.enter}</p>
  {/if}

  <section class="combat-console">
    <article class="status-card">
      <header><strong>{$t.arena.you}</strong><span>{$t.arena.mode[game.player.mode]}</span></header>
      <div class="meter">
        <i style:width={`${auraPercent(game.player.aura, game.player.capacity)}%`}></i>
      </div>
      <p>{$t.arena.aura} · {Math.ceil(game.player.aura)} / {game.player.capacity}</p>
      <div class="tags">
        {#if game.player.gyo}<span>{$t.arena.state.gyo}</span>{/if}
        {#if game.player.in}<span>{$t.arena.state.in}</span>{/if}
        {#if game.player.ken}<span>{$t.arena.state.ken}</span>{/if}
        {#if game.player.ko}<span>{$t.arena.state.ko}</span>{/if}
      </div>
    </article>

    <article class="ryu-card" class:commanding={commandGroup(commandAnimation) === 'ryu'}>
      <header><strong>Ryu</strong><span>{Math.round(game.player.attackShare * 100)}%</span></header>
      <div class="flow" class:shifting={game.player.ryuShift}>
        <i style:width="{game.player.attackShare * 100}%"></i>
      </div>
      <div class="aura-body" aria-label={$t.arena.auraDistribution}>
        {#each BODY_ZONES as zone (zone)}
          <i
            class:guarded={game.player.guard === zone}
            class:incoming={game.player.ryuShift?.guard === zone}
            data-zone={$t.arena.zone[zone]}
            title={`${$t.arena.zone[zone]} · ${Math.round(detailedRyu.defence[zone] * 100)}%`}
            style:opacity={0.35 + detailedRyu.defence[zone] * 2}
          ></i>
        {/each}
      </div>
      <div class="zones">
        {#each BODY_ZONES as zone, index (zone)}
          <button
            class:active={game.player.guard === zone}
            class:pulsing={commandAnimation === `zone-${zone}`}
            aria-pressed={game.player.guard === zone}
            aria-label={`${$t.arena.ui.protect} ${$t.arena.zone[zone]}`}
            onclick={() => setZone(zone)}
          >
            <kbd>{index + 1}</kbd>{$t.arena.zone[zone]}
          </button>
        {/each}
      </div>
      <div class="actions">
        <button onclick={strike} disabled={game.outcome !== 'playing'}
          >{$t.arena.action.strike}</button
        >
        <button class="ko-action" onclick={gatherKo} disabled={game.outcome !== 'playing'}>
          {$t.arena.action.ko}
        </button>
        <button onclick={guard} disabled={game.outcome !== 'playing'}
          >{$t.arena.action.guard}</button
        >
        <button onclick={feint} disabled={game.outcome !== 'playing'}
          >{$t.arena.action.feint}</button
        >
        <button
          class="hatsu-action"
          onclick={castHatsu}
          disabled={game.outcome !== 'playing'}
          title={carriedHatsu?.rule ?? ''}
        >
          {carriedHatsu?.name ?? $t.arena.ui.chooseHatsu}
          {#if hatsuEffect}<small>H · {hatsuCost} AURA</small>{/if}
        </button>
      </div>
    </article>

    <article class="status-card opponent-card" class:bound={game.opponent.bound > 0}>
      <header>
        <strong>{OPPONENT_DOCTRINES[opponentDoctrine].name}</strong>
        <span
          >{reading.concealed ? $t.arena.state.concealed : $t.arena.mode[game.opponent.mode]}</span
        >
      </header>
      <div class="meter enemy">
        <i
          style:width={`${game.player.gyo ? auraPercent(game.opponent.aura, game.opponent.capacity) : 0}%`}
        ></i>
      </div>
      <p>
        {#if game.player.gyo}{$t.arena.aura} · {Math.ceil(game.opponent.aura)}{:else}—{/if}
      </p>
      <div class="tags">
        {#if reading.guard}<span>Gyo · {$t.arena.zone[reading.guard]}</span>{/if}
        {#if reading.ken}<span>{$t.arena.state.ken}</span>{/if}
        {#if reading.koZone}<span>{$t.arena.state.ko} · {$t.arena.zone[reading.koZone]}</span>{/if}
        {#if reading.intentZone}
          <span class="threat-tag">
            {$t.arena.ui.attack} · {$t.arena.zone[reading.intentZone]}
          </span>
        {/if}
      </div>
    </article>
  </section>

  <div class="event-line" aria-live="polite">
    {#if game.lastEvent}
      <strong>{$t.arena.impact[game.lastEvent.impact]}</strong>
      <span>· {$t.arena.zone[game.lastEvent.zone]}</span>
    {:else}
      <span>{$t.arena.controls.move}</span>
    {/if}
  </div>

  {#if game.outcome !== 'playing'}
    <div class="verdict">
      <p>{$t.arena.eyebrow}</p>
      <h2>{$t.arena.outcome[game.outcome]}</h2>
      <strong>{game.player.score} — {game.opponent.score}</strong>
      <div class="match-report">
        <b>{gradeArena(stats, game.outcome === 'won', game.player.aura)}</b>
        <span>{stats.hits}/{stats.attacks} {$t.arena.ui.hits}</span>
        <span>{stats.blocks} {$t.arena.ui.blocks}</span>
        <span>{stats.hatsu} Hatsu</span>
        {#if bestGrade}<small>BEST · {bestGrade}</small>{/if}
      </div>
      {#if selectedChallenge && challengeResult}
        <section class="challenge-result" class:complete={challengeResult.complete}>
          <b>{challengeResult.grade}</b>
          <div>
            <strong
              >{$locale === 'fr' ? selectedChallenge.titleFr : selectedChallenge.titleEn}</strong
            >
            {#each selectedChallenge.objectives as objective, index (index)}
              <span>{challengeResult.satisfied[index] ? '✓' : '○'} {objectiveLabel(objective)}</span
              >
            {/each}
          </div>
        </section>
      {/if}
      {#if lastReplay}<ReplayPanel
          replay={lastReplay}
          locale={$locale}
          onResume={resumeReplay}
        />{/if}
      <ArenaV3Panel
        replay={lastReplay}
        challengeId={selectedChallengeId}
        result={challengeResult}
        locale={$locale}
      />
      <button onclick={restart}>{$t.arena.action.restart}</button>
      <div class="difficulty-picker" aria-label={$t.arena.ui.difficulty}>
        {#each ['initiate', 'fighter', 'master'] as level (level)}
          <button
            class:active={difficulty === level}
            onclick={() => {
              difficulty = level as ArenaDifficulty
              restart()
              persistOptions()
            }}>{difficultyLabel(level as ArenaDifficulty, $locale)}</button
          >
        {/each}
      </div>
      <div class="doctrine-picker" aria-label={$t.arena.ui.opponent}>
        {#each Object.entries(OPPONENT_DOCTRINES) as [id, doctrine] (id)}
          <button
            class:active={opponentDoctrine === id}
            onclick={() => {
              opponentDoctrine = id as OpponentDoctrine
              restart()
              persistOptions()
            }}>{doctrine.name}</button
          >
        {/each}
      </div>
    </div>
  {/if}

  <GameManualOverlay
    open={manualOpen}
    title="Arena Mode"
    titleFr="Mode Arena"
    objective="Defeat your opponent in direct combat. Manage your aura, use Nen techniques like Ryu and Gyo, and strike when they drop their guard."
    objectiveFr="Battez votre adversaire en combat direct. Gérez votre aura, utilisez des techniques de Nen comme Ryu et Gyo, et frappez quand il baisse sa garde."
    controls={ARENA_MANUAL_CONTROLS}
    onClose={() => (manualOpen = false)}
  />
</div>
