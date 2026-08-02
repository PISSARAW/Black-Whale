<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import Seo from '$lib/components/Seo.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import { advanceArena, OPPONENT_DOCTRINES, type OpponentDoctrine } from '$lib/arena/ai'
  import { arenaHatsuEffect, worksInArena } from '$lib/arena/hatsu'
  import { zoneFromPitch } from '$lib/arena/targeting'
  import { buildCombatTerrain } from '$lib/arena/terrain'
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
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import './arena.css'

  const DT = 1 / 60
  const ship = theShip()
  const terrain = buildCombatTerrain()
  const plan = ship.plans.get(terrain.tierId)!
  const ground = floorOf(terrain.space, plan.tier)

  let game = $state(freshGame())
  let started = $state(false)
  let position = $state<Vec2>(terrain.spawns[0])
  let heading = $state(0)
  let lookPitch = $state(0)
  let aimedExtra = $state<string | null>(null)
  let currentSpace = $state<Space | null>(null)
  let engaged = $state(false)
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
      hidden: false,
      pick: true,
    },
  ])
  let opponentWalls = $derived(blockerAt(game.opponent.position))

  function freshGame() {
    return initialCombatState({
      playerAt: terrain.spawns[0],
      opponentAt: terrain.spawns[1],
      terrain: { id: terrain.id, footprint: terrain.footprint, walls: terrain.walls },
    })
  }

  function send(action: CombatAction): boolean {
    started = true
    const previousGame = game
    const previous = game.lastEvent
    game = combatReducer(game, action)
    advanceLesson(action)
    if (game.lastEvent !== previous && game.lastEvent) animateExchange(game.lastEvent)
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

  function castHatsu() {
    if (!hatsuEffect) {
      hatsuPanelOpen.set(true)
      return
    }
    command({ type: 'HATSU', side: 'player', effect: hatsuEffect, zone: aimedZone }, 'hatsu')
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
    else if (event.code === 'Space') strike()
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') guard()
    else if (event.code === 'KeyV') feint()
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
    if (distance(position, game.player.position) < 0.001) return
    started = true
    game = { ...game, player: { ...game.player, position, movement: [0, 0] } }
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
      game = advanceArena(game, DT, opponentDoctrine)
      if (game.lastEvent !== previous && game.lastEvent) animateExchange(game.lastEvent)
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
    const defenderMotion = reactionFor(event.impact)
    if (event.attacker === 'player') {
      playPlayer('attack', 280)
      if (defenderMotion !== 'idle') playOpponent(defenderMotion, reactionTime(event.impact))
      return
    }
    playOpponent('attack', 320)
    if (defenderMotion !== 'idle') playPlayer(defenderMotion, reactionTime(event.impact))
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

<div class="arena-world">
  <h1 class="sr-only">{$t.arena.title}</h1>
  <TourScene
    {ship}
    bind:tierId
    bind:position
    bind:heading
    bind:lookPitch
    bind:aimedExtra
    bind:currentSpace
    bind:engaged
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

    <article class="status-card opponent-card">
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
      <button onclick={restart}>{$t.arena.action.restart}</button>
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
