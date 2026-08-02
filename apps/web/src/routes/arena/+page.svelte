<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import Seo from '$lib/components/Seo.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import ReplayPanel from '$lib/components/arena/ReplayPanel.svelte'
  import {
    advanceArena,
    OPPONENT_DOCTRINES,
    type ArenaDifficulty,
    type OpponentDoctrine,
  } from '$lib/arena/ai'
  import { arenaHatsuEffect, worksInArena } from '$lib/arena/hatsu'
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
  import { evaluateChallenge } from '$lib/arena/challenges/evaluate'
  import type { ChallengeObjective } from '$lib/arena/challenges/types'
  import { ArenaRecorder } from '$lib/arena/replay/recorder'
  import type { ArenaReplay } from '$lib/arena/replay/types'
  import { serializeReplay } from '$lib/arena/replay/codec'
  import { replayFromUrl } from '$lib/arena/replay/share'
  import { playReplay } from '$lib/arena/replay/player'
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
  import { floorOf, theShip } from '$lib/tour/blueprint'
  import { EMPTY_WORLD } from '$lib/tour/hatsu'
  import { localizeHatsu } from '$lib/i18n/hatsu'
  import { activeHatsu, closeHatsuGate, hatsuPanelOpen, openHatsuGate } from '$lib/nen/hatsuState'
  import type { Apparition } from '$lib/tour/apparitions'
  import type { Space, Vec2, WallSegment } from '$lib/tour/types'
  import type { Structure } from '$lib/tour/types'
  import { structureFootprint } from '$lib/tour/geometry'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import './arena.css'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const DT = 1 / 60
  const ship = theShip()
  const terrain = buildCombatTerrain(data.terrainId)
  const plan = ship.plans.get(terrain.tierId)!
  const ground = floorOf(terrain.space, plan.tier)

  let game = $state(freshGame())
  let started = $state(false)
  let briefingOpen = $state(true)
  let position = $state<Vec2>(terrain.spawns[0])
  let heading = $state(0)
  let lookPitch = $state(0)
  let aimedExtra = $state<string | null>(null)
  let aimedSolidAt = $state<Structure | null>(null)
  let currentSpace = $state<Space | null>(null)
  let engaged = $state(false)
  let touch = $state(false)
  let tierId = $state(terrain.tierId)
  let jumpTo = $state<string | null>(terrain.id)
  let jumpAt = $state<Vec2 | null>(terrain.spawns[0])
  let jumpHeading = $state<number | null>(facing(terrain.spawns[0], terrain.spawns[1]))
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
  let lesson = $state(0)
  let opponentDoctrine = $state<OpponentDoctrine>('counter')
  let difficulty = $state<ArenaDifficulty>('fighter')
  let recorder = new ArenaRecorder(combatSetup(), opponentDoctrine, difficulty)
  let lastReplay = $state<ArenaReplay | null>(null)
  let stats = $state<ArenaStats>({ ...EMPTY_STATS })
  let bestGrade = $state<string | null>(null)
  let graded = $state(false)
  let selectedChallengeId = $state<string | null>(null)
  const motionTimers = new Set<number>()

  let reading = $derived(readAura(game.player, game.opponent))
  let carriedHatsu = $derived($activeHatsu ? localizeHatsu($activeHatsu, $locale) : null)
  let hatsuEffect = $derived(arenaHatsuEffect($activeHatsu))
  let gap = $derived(distance(game.player.position, game.opponent.position))
  let inRange = $derived(gap <= STRIKE_RANGE)
  let threatened = $derived(reading.intentRemaining !== null)
  let aimedZone = $derived(zoneFromPitch(lookPitch))
  let opponentActor = $derived<Apparition[]>([
    {
      id: 'arena-opponent',
      kind: 'combatant',
      spaceId: terrain.id,
      tierId: terrain.tierId,
      at: game.opponent.position,
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
      },
      hidden: false,
      pick: true,
    },
  ])
  let opponentWalls = $derived(blockerAt(game.opponent.position))
  let selectedChallenge = $derived(
    ARENA_CHALLENGES.find((challenge) => challenge.id === selectedChallengeId) ?? null,
  )
  let challengeResult = $derived(
    selectedChallenge && lastReplay ? evaluateChallenge(selectedChallenge, lastReplay) : null,
  )

  function objectiveLabel(objective: ChallengeObjective): string {
    if (objective.kind === 'win') return $locale === 'fr' ? 'Remporter le duel' : 'Win the duel'
    if (objective.kind === 'accuracy')
      return `${$locale === 'fr' ? 'Précision' : 'Accuracy'} ≥ ${Math.round(objective.minimum * 100)}%`
    if (objective.kind === 'aura')
      return `${$locale === 'fr' ? 'Aura restante' : 'Aura remaining'} ≥ ${objective.minimum}`
    if (objective.kind === 'blocks')
      return `${$locale === 'fr' ? 'Blocages réussis' : 'Successful blocks'} × ${objective.count}`
    return `${$locale === 'fr' ? 'Utiliser' : 'Use'} ${objective.action} × ${objective.count}`
  }

  function polygonCentre(points: Vec2[]): Vec2 {
    const sum = points.reduce<Vec2>(
      (total, point) => [total[0] + point[0], total[1] + point[1]],
      [0, 0],
    )
    return [sum[0] / points.length, sum[1] / points.length]
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
    started = true
    const previousGame = game
    const previous = game.lastEvent
    if (action.type !== 'TICK') recorder.record(action)
    game = combatReducer(game, action)
    advanceLesson(action)
    if (game.lastEvent !== previous && game.lastEvent) animateExchange(game.lastEvent)
    finishRun()
    return game !== previousGame
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

  function setZone(zone: BodyZone) {
    command({ type: 'RYU', side: 'player', guard: zone }, `zone-${zone}`)
  }

  function strike() {
    command({ type: 'STRIKE', side: 'player', zone: aimedZone }, 'strike')
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
    const accepted = command(
      {
        type: 'HATSU',
        side: 'player',
        effect: hatsuEffect,
        zone: aimedZone,
        hatsuId: carriedHatsu?.id,
        targetAt:
          carriedHatsu?.id === 'bungee-gum' && aimedSolidAt
            ? polygonCentre(structureFootprint(aimedSolidAt))
            : undefined,
      },
      'hatsu',
    )
    if (accepted) playArenaHatsu(hatsuEffect)
  }

  function shiftRyu(by: number) {
    command(
      {
        type: 'RYU',
        side: 'player',
        attackShare: game.player.attackShare + by,
      },
      by > 0 ? 'ryu-up' : 'ryu-down',
    )
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey) return
    if (isMovement(event.code)) {
      started = true
      return
    }
    if (event.repeat || game.outcome !== 'playing') return

    const zone = zoneFor(event.code)
    if (zone) setZone(zone)
    else if (event.code === 'KeyT') command({ type: 'MODE', side: 'player', mode: 'ten' }, 'ten')
    else if (event.code === 'KeyR') command({ type: 'MODE', side: 'player', mode: 'ren' }, 'ren')
    else if (event.code === 'KeyX')
      command({ type: 'MODE', side: 'player', mode: 'zetsu' }, 'zetsu')
    else if (event.code === 'KeyG')
      command({ type: 'GYO', side: 'player', on: !game.player.gyo }, 'gyo')
    else if (event.code === 'KeyI')
      command({ type: 'IN', side: 'player', on: !game.player.in }, 'in')
    else if (event.code === 'KeyK')
      command({ type: 'KEN', side: 'player', on: !game.player.ken }, 'ken')
    else if (event.code === 'Minus') shiftRyu(-0.1)
    else if (event.code === 'Equal') shiftRyu(0.1)
    else if (event.code === 'Space' || event.code === 'KeyF') strike()
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') guard()
    else if (event.code === 'KeyV') feint()
    else if (event.code === 'KeyJ') evade(-1)
    else if (event.code === 'KeyL') evade(1)
    else if (event.code === 'KeyH') castHatsu()
    else if (event.code === 'KeyC') gatherKo()
    else return
    event.preventDefault()
  }

  function isMovement(code: string): boolean {
    return [
      'KeyW',
      'KeyZ',
      'KeyS',
      'KeyA',
      'KeyQ',
      'KeyD',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
    ].includes(code)
  }

  function zoneFor(code: string): BodyZone | null {
    const index = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(code)
    return index === -1 ? null : BODY_ZONES[index]
  }

  function reportWalk() {
    if (Math.abs(heading - game.player.facing) > 0.001) {
      send({ type: 'FACE', side: 'player', heading })
    }
    if (distance(position, game.player.position) >= 0.001) {
      started = true
      send({ type: 'SYNC_POSITION', side: 'player', position })
    }
  }

  function tick(now: number) {
    frame = requestAnimationFrame(tick)
    const elapsed = last === 0 ? 0 : (now - last) / 1000
    last = now
    owed = Math.min(owed + elapsed, 0.2)
    reportWalk()
    if (!started) {
      owed = 0
      return
    }
    while (owed >= DT && game.outcome === 'playing') {
      owed -= DT
      const previous = game.lastEvent
      game = advanceArena(game, DT, opponentDoctrine, difficulty)
      recorder.advance()
      if (game.lastEvent !== previous && game.lastEvent) animateExchange(game.lastEvent)
      finishRun()
    }
  }

  function restart() {
    game = freshGame()
    position = terrain.spawns[0]
    jumpTo = terrain.id
    jumpAt = terrain.spawns[0]
    jumpHeading = facing(terrain.spawns[0], terrain.spawns[1])
    started = false
    playerMotion = 'idle'
    opponentMotion = 'idle'
    commandAnimation = null
    lesson = 0
    stats = { ...EMPTY_STATS }
    graded = false
    lastReplay = null
    recorder = new ArenaRecorder(combatSetup(), opponentDoctrine, difficulty)
    owed = 0
    last = 0
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
    sessionStorage.setItem('black-whale:arena-last-replay', serializeReplay(lastReplay))
    const grade = gradeArena(stats, game.outcome === 'won', game.player.aura)
    const order = ['C', 'B', 'A', 'S']
    if (!bestGrade || order.indexOf(grade) > order.indexOf(bestGrade)) {
      bestGrade = grade
      localStorage.setItem('black-whale:arena-best-grade', grade)
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

  function blockerAt(at: Vec2): WallSegment[] {
    const radius = 0.55
    const corners: Vec2[] = [
      [at[0] - radius, at[1] - radius],
      [at[0] + radius, at[1] - radius],
      [at[0] + radius, at[1] + radius],
      [at[0] - radius, at[1] + radius],
    ]
    return corners.map((start, index) => ({
      spaceId: terrain.id,
      start,
      end: corners[(index + 1) % corners.length],
    }))
  }

  function facing(from: Vec2, to: Vec2): number {
    return Math.atan2(from[0] - to[0], from[1] - to[1])
  }

  function distance(a: Vec2, b: Vec2): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1])
  }

  onMount(() => {
    const sharedReplay = replayFromUrl(window.location.href)
    if (sharedReplay) {
      lastReplay = sharedReplay
      game = playReplay(sharedReplay).state
      graded = true
    }
    bestGrade = localStorage.getItem('black-whale:arena-best-grade')
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

  onDestroy(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('keydown', onKeyDown)
    cancelAnimationFrame(frame)
    for (const timer of motionTimers) window.clearTimeout(timer)
    closeHatsuGate()
  })
</script>

<Seo
  title={$t.arena.seoTitle}
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
  <h1 class="sr-only">{$t.arena.title}</h1>

  {#if briefingOpen}
    <div class="combat-briefing" role="dialog" aria-modal="true" aria-labelledby="combat-briefing-title">
      <div class="briefing-card">
        <p class="briefing-kicker">{$locale === 'fr' ? 'AVANT LE COMBAT' : 'BEFORE THE FIGHT'}</p>
        <h2 id="combat-briefing-title">
          {$locale === 'fr' ? 'Touchez votre adversaire avant qu’il ne vous touche' : 'Hit your opponent before they hit you'}
        </h2>
        <p class="briefing-goal">
          {$locale === 'fr'
            ? 'Le premier à 10 points gagne. Une attaque ne touche que si vous êtes assez près : surveillez la distance en haut de l’écran.'
            : 'First to 10 points wins. An attack only connects at close range: watch the distance at the top of the screen.'}
        </p>
        <ol class="briefing-steps">
          <li>
            <kbd>{$locale === 'fr' ? 'ZQSD' : 'WASD'}</kbd>
            <span><strong>{$locale === 'fr' ? 'Approchez' : 'Close in'}</strong>{$locale === 'fr' ? ' jusqu’à ce que le viseur devienne doré.' : ' until the reticle turns gold.'}</span>
          </li>
          <li>
            <kbd>CLIC · F</kbd>
            <span><strong>{$locale === 'fr' ? 'Frappez' : 'Strike'}</strong>{$locale === 'fr' ? ' en visant l’adversaire. Une touche rapporte au moins 1 point.' : ' while aiming at the opponent. A hit scores at least 1 point.'}</span>
          </li>
          <li>
            <kbd>MAJ</kbd>
            <span><strong>{$locale === 'fr' ? 'Bloquez' : 'Block'}</strong>{$locale === 'fr' ? ' quand l’alerte d’attaque apparaît. Les techniques Nen sont optionnelles pour commencer.' : ' when the attack warning appears. Nen techniques are optional at first.'}</span>
          </li>
        </ol>
        <button class="briefing-start" onclick={() => (briefingOpen = false)}>
          {$locale === 'fr' ? 'Entrer dans l’arène' : 'Enter the arena'}
        </button>
      </div>
    </div>
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
    world={EMPTY_WORLD}
    extras={opponentActor}
    collisionWalls={opponentWalls}
    aiming={true}
    castOnClick={true}
    onCast={strike}
    touchLabels={{ move: $t.tour.touch.move, cast: $t.arena.action.strike }}
    soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
    loadingLabel={$t.tour.loading}
    unsupportedLabel={$t.tour.unsupported}
  />

  <div class="reticle" class:near={inRange} class:locked={aimedExtra === 'arena-opponent'}>
    <span>{$t.arena.zone[aimedZone]}</span>
  </div>

  {#if game.opponent.intent}
    <div class="attack-telegraph" class:concealed={!threatened} aria-live="assertive">
      {#if reading.intentZone}
        <small>{$locale === 'fr' ? 'INTENTION LUE' : 'INTENT READ'}</small>
        <strong>{$t.arena.zone[reading.intentZone]}</strong>
        <i
          style:--threat-progress={`${Math.max(0, 1 - (reading.intentRemaining ?? 0) / 0.62) * 100}%`}
        ></i>
      {:else}
        <small>{$locale === 'fr' ? 'AURA TROUBLÉE' : 'AURA DISTURBANCE'}</small>
        <strong>?</strong>
      {/if}
    </div>
  {/if}

  {#if game.tethers.length > 0}
    <div class="elastic-readout" aria-live="polite">
      BUNGEE GUM · {game.tethers[0].anchor
        ? $locale === 'fr'
          ? 'DÉCOR'
          : 'TERRAIN'
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

  <nav class="terrain-picker" aria-label={$locale === 'fr' ? 'Terrain' : 'Arena'}>
    <a class:active={terrain.id === 'tier-1-banquet-hall'} href="?terrain=tier-1-banquet-hall">
      {$locale === 'fr' ? 'Salle du banquet' : 'Banquet Hall'}
    </a>
    <a class:active={terrain.id === 'tier-2-screening-room'} href="?terrain=tier-2-screening-room">
      {$locale === 'fr' ? 'Salle de projection' : 'Screening Room'}
    </a>
  </nav>

  <aside class="challenge-panel" aria-label={$locale === 'fr' ? 'Épreuves' : 'Challenges'}>
    <header>
      <small>{$locale === 'fr' ? 'ÉPREUVES' : 'CHALLENGES'}</small>
      <strong
        >{selectedChallenge
          ? $locale === 'fr'
            ? selectedChallenge.titleFr
            : selectedChallenge.titleEn
          : $locale === 'fr'
            ? 'Combat libre'
            : 'Free combat'}</strong
      >
    </header>
    <select
      value={selectedChallengeId ?? ''}
      onchange={(event) => {
        selectedChallengeId = event.currentTarget.value || null
        restart()
      }}
    >
      <option value="">{$locale === 'fr' ? 'Combat libre' : 'Free combat'}</option>
      {#each ARENA_CHALLENGES as challenge}
        <option value={challenge.id}
          >{$locale === 'fr' ? challenge.titleFr : challenge.titleEn}</option
        >
      {/each}
    </select>
    {#if selectedChallenge}
      <ol>
        {#each selectedChallenge.objectives as objective}
          <li>{objectiveLabel(objective)}</li>
        {/each}
      </ol>
    {/if}
  </aside>

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
    <nav class="touch-combat" aria-label={$locale === 'fr' ? 'Actions rapides' : 'Quick actions'}>
      <button onclick={guard}>{$locale === 'fr' ? 'Garde' : 'Guard'}</button>
      <button onclick={feint}>{$locale === 'fr' ? 'Feinte' : 'Feint'}</button>
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
      <div class="meter"><i style:width="{game.player.aura}%"></i></div>
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
        {#each BODY_ZONES as zone}
          <i
            class:guarded={game.player.guard === zone}
            class:incoming={game.player.ryuShift?.guard === zone}
            data-zone={$t.arena.zone[zone]}
          ></i>
        {/each}
      </div>
      <div class="zones">
        {#each BODY_ZONES as zone, index (zone)}
          <button
            class:active={game.player.guard === zone}
            class:pulsing={commandAnimation === `zone-${zone}`}
            aria-pressed={game.player.guard === zone}
            aria-label={`${$locale === 'fr' ? 'Protéger' : 'Guard'} ${$t.arena.zone[zone]}`}
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
          {carriedHatsu?.name ?? ($locale === 'fr' ? 'Choisir un Hatsu' : 'Choose a Hatsu')}
          {#if hatsuEffect}<small>H · 18 AURA</small>{/if}
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
      <div class="meter enemy"><i style:width="{game.opponent.aura}%"></i></div>
      <p>
        {#if game.player.gyo}{$t.arena.aura} · {Math.ceil(game.opponent.aura)}{:else}—{/if}
      </p>
      <div class="tags">
        {#if reading.guard}<span>Gyo · {$t.arena.zone[reading.guard]}</span>{/if}
        {#if reading.ken}<span>{$t.arena.state.ken}</span>{/if}
        {#if reading.koZone}<span>{$t.arena.state.ko} · {$t.arena.zone[reading.koZone]}</span>{/if}
        {#if reading.intentZone}
          <span class="threat-tag">
            {$locale === 'fr' ? 'Attaque' : 'Attack'} · {$t.arena.zone[reading.intentZone]}
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
      <h1>{$t.arena.outcome[game.outcome]}</h1>
      <strong>{game.player.score} — {game.opponent.score}</strong>
      <div class="match-report">
        <b>{gradeArena(stats, game.outcome === 'won', game.player.aura)}</b>
        <span>{stats.hits}/{stats.attacks} {$locale === 'fr' ? 'touches' : 'hits'}</span>
        <span>{stats.blocks} {$locale === 'fr' ? 'blocages' : 'blocks'}</span>
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
            {#each selectedChallenge.objectives as objective, index}
              <span>{challengeResult.satisfied[index] ? '✓' : '○'} {objectiveLabel(objective)}</span
              >
            {/each}
          </div>
        </section>
      {/if}
      {#if lastReplay}<ReplayPanel replay={lastReplay} locale={$locale} />{/if}
      <button onclick={restart}>{$t.arena.action.restart}</button>
      <div class="difficulty-picker" aria-label="Difficulty">
        {#each ['initiate', 'fighter', 'master'] as level}
          <button
            class:active={difficulty === level}
            onclick={() => {
              difficulty = level as ArenaDifficulty
              restart()
            }}>{difficultyLabel(level as ArenaDifficulty, $locale)}</button
          >
        {/each}
      </div>
      <div class="doctrine-picker" aria-label="Adversaire">
        {#each Object.entries(OPPONENT_DOCTRINES) as [id, doctrine]}
          <button
            class:active={opponentDoctrine === id}
            onclick={() => {
              opponentDoctrine = id as OpponentDoctrine
              restart()
            }}>{doctrine.name}</button
          >
        {/each}
      </div>
    </div>
  {/if}
</div>
