<script lang="ts">
  /**
   * The hunt: a game played inside the reconstruction, on its own route.
   *
   * It reads `lib/tour` and changes nothing in it (I7). `TourScene` walks the
   * body, collides it against the apartment's own bulkheads and reports where it
   * ended up; everything this page adds — the reservoir, the hunter, what either
   * of them can perceive — is simulated in `lib/hunt` at a fixed step and drawn
   * on top. Nothing here extends `blueprint.json` (I6): the arena is a selection
   * of eight rooms that are already in it.
   *
   * The loop is an accumulator on the frame callback rather than an interval:
   * the simulation must advance in fixed ticks whatever the display is doing,
   * and a tab left in the background must not come back owing four thousand of
   * them.
   */
  import { onDestroy, onMount } from 'svelte'
  import Seo from '$lib/components/Seo.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import TourModeFullscreen from '$lib/components/tour/TourModeFullscreen.svelte'
  import { theShip, crossingsOn, type Crossing } from '$lib/tour/blueprint'
  import type { TourFlash } from '$lib/tour/apparitions'
  import { interiorPoint } from '$lib/tour/geometry'
  import TourMinimapPanel from '$lib/components/tour/TourMinimapPanel.svelte'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import type { Space, Vec2 } from '$lib/tour/types'

  import {
    DEFAULT_HUNT_TERRAIN,
    HUNT_TERRAINS,
    buildArena,
    type HuntTerrainId,
  } from '$lib/hunt/arena'
  import { buildNavGraph, shortestPath } from '$lib/hunt/navmesh'
  import { HUNT_DT, huntIsOver, updateHunt, type HuntWorld } from '$lib/hunt/loop'
  import { huntReducer, initialHuntState, type HuntAction } from '$lib/hunt/state'
  import { BODY_ZONES, type BodyZone } from '$lib/hunt/duel/state'
  import { STRIKE_THRESHOLD } from '$lib/hunt/duel/ryu'
  import { liveOf } from '$lib/hunt/nen/placed'
  import { cuesFor } from '$lib/hunt/veil'
  import { explorationNen, huntDuelNen } from '$lib/nen/tourAdapters'
  import { isNenControlCode, NEN_KEYS, nenZoneIndex } from '$lib/nen/controls'
  import type { NenTechniqueAction } from '@black-whale/nen-engine'
  import { sightings } from '$lib/hunt/sighting'
  import { floorOf } from '$lib/tour/blueprint'
  import { prefersReducedMotion } from '$lib/tour/comfort'
  import NenVeil from '$lib/components/hunt/NenVeil.svelte'
  import HuntHud from '$lib/components/hunt/HuntHud.svelte'
  import DuelPanel from '$lib/components/hunt/DuelPanel.svelte'
  import Debrief from '$lib/components/hunt/Debrief.svelte'
  import HuntActions from '$lib/components/hunt/HuntActions.svelte'
  import HuntBriefing from '$lib/components/hunt/HuntBriefing.svelte'
  import HuntTutorial from '$lib/components/hunt/HuntTutorial.svelte'
  import HuntAudioControl from '$lib/components/hunt/HuntAudioControl.svelte'
  import { closeHuntAudio, playHuntCue } from '$lib/hunt/audio'
  import { tutorialStep } from '$lib/hunt/tutorial'
  import { tutorialMessages } from '$lib/hunt/tutorialMessages'
  import { terrainMessages } from '$lib/hunt/terrainMessages'
  import { debriefMessages } from '$lib/hunt/debriefMessages'
  import { safeFrameDebt } from '$lib/hunt/lifecycle'
  import { huntContractById, listHuntContracts } from '$lib/hunt/contracts/registry'
  import { contractMessages } from '$lib/hunt/contracts/messages'
  import { carryIntoStage, nextStage } from '$lib/hunt/contracts/transition'
  import { capabilitiesOf, type HuntVow } from '$lib/hunt/nen/advanced'
  import { completeCampaignRun, initialCampaign, loadCampaign, saveCampaign } from '$lib/hunt/campaign'
  import { appendReplayAction, createReplay, decodeReplay, encodeReplay, type HuntReplayV3 } from '$lib/hunt/replay'
  import { ghostAt, ghostFigure } from '$lib/hunt/ghost'
  import { hatsuFlash, presentHatsu } from '$lib/hunt/hatsuPresentation'
  import { decodeContract } from '$lib/hunt/contracts/share'
  import type { HuntContractV3 } from '$lib/hunt/contracts/types'
  import {
    DEFAULT_HUNTER_PROFILE,
    HUNTER_PROFILES,
    type HunterProfileId,
  } from '$lib/hunt/hunter/profiles'
  import { hunterProfileMessages } from '$lib/hunt/hunter/profileMessages'
  import {
    BUNGEE_GUM_HUNT,
    DEFAULT_HUNT_HATSU,
    DOWSING_CHAIN_HUNT,
    huntHatsu,
    PARALLEL_FUTURE_HUNT,
    type HuntHatsuId,
  } from '$lib/hunt/hatsu'

  const ship = theShip()
  let selectedTerrain = $state<HuntTerrainId>(DEFAULT_HUNT_TERRAIN)
  const initialArena = buildArena()
  const initialGraph = buildNavGraph(initialArena)
  let arena = $state.raw(initialArena)
  let plan = $state.raw(ship.plans.get(initialArena.tierId)!)
  let graph = $state.raw(initialGraph)
  let world = $state.raw<HuntWorld>({ dt: HUNT_DT, arena: initialArena, graph: initialGraph })

  /**
   * Player and hunter start as far apart as the apartment allows, and the room
   * to reach is the far one — measured on the doorway graph rather than in
   * metres, because what matters is how many rooms have to be crossed.
   */
  const initialOpening = farthestApart()
  let opening = $state.raw(initialOpening)

  function farthestApart(): { from: Space; to: Space } {
    let best = { from: arena.spaces[0], to: arena.spaces[1], rooms: 0 }
    for (const from of arena.spaces) {
      for (const to of arena.spaces) {
        const rooms = shortestPath(graph, from.id, to.id)?.length ?? 0
        if (rooms > best.rooms) best = { from, to, rooms }
      }
    }
    return best
  }

  const nameForDeck = (entity: Space | { name: string; nameFr: string } | undefined) =>
    entity ? ($locale === 'fr' ? entity.nameFr : entity.name) : ''
  const spaceById = (id: string | null) => arena.spaces.find((space) => space.id === id)
  const roomName = (id: string | null) => nameForDeck(spaceById(id))

  const hatsuProfiles = [BUNGEE_GUM_HUNT, PARALLEL_FUTURE_HUNT, DOWSING_CHAIN_HUNT]
  const builtInContracts = listHuntContracts()
  let customContract = $state.raw<HuntContractV3 | null>(null)
  let contracts = $derived(customContract ? [...builtInContracts, customContract] : builtInContracts)
  let selectedContract = $state('royal-apartments')
  let contractStage = $state(0)
  let selectedHatsu = $state<HuntHatsuId>(DEFAULT_HUNT_HATSU)
  let hatsuFlashSeq = $state(0)
  let activeHatsuFlash = $state.raw<(TourFlash & { seq: number }) | null>(null)
  let selectedHunter = $state<HunterProfileId>(DEFAULT_HUNTER_PROFILE)
  let selectedVow = $state<HuntVow | null>(null)
  let campaign = $state.raw(initialCampaign())
  let campaignRecorded = false
  const replayKey = 'black-whale:hunt-v3-last-replay'
  let replay = $state.raw<HuntReplayV3 | null>(null)
  let lastReplay = $state.raw<HuntReplayV3 | null>(null)
  let lastReplayMovementAt = -Infinity
  let activeContract = $derived(
    (customContract?.id === selectedContract ? customContract : huntContractById(selectedContract)) ??
      builtInContracts[0],
  )
  let availableHatsuProfiles = $derived(
    hatsuProfiles.filter((profile) => activeContract.allowedHatsu.includes(profile.id)),
  )
  let availableHunterProfiles = $derived(
    HUNTER_PROFILES.filter((profile) => activeContract.hunterProfiles.includes(profile.id)),
  )
  let availableTerrains = $derived(
    HUNT_TERRAINS.filter((terrain) => activeContract.terrainSequence.includes(terrain.id)),
  )

  function freshGame() {
    const fresh = initialHuntState({
      playerAt: { position: interiorPoint(opening.from.footprint), spaceId: opening.from.id },
      hunterAt: { position: interiorPoint(opening.to.footprint), spaceId: opening.to.id },
      targetSpaceId: opening.to.id,
      seed: 0x5eed,
      hatsu: selectedHatsu,
      hunterProfile: selectedHunter,
    })
    return selectedVow ? huntReducer(fresh, { type: 'VOW', vow: selectedVow }) : fresh
  }

  let game = $state(freshGame())
  let equippedHatsu = $derived(huntHatsu(game.hatsu.id))
  let hatsuReading = $derived.by(() => {
    if (game.hatsu.id === 'parallel-future' && game.hatsu.window > 0) {
      return {
        label: equippedHatsu.name,
        detail: $t.hunt.hatsu.future(
          roomName(game.hatsu.forecastSpaceId),
          Math.ceil(game.hatsu.window),
        ),
      }
    }
    if (game.hatsu.id === 'dowsing-chain' && game.hatsu.probableBearing) {
      return {
        label: equippedHatsu.name,
        detail: $t.hunt.hatsu.probable,
        bearing: game.hatsu.probableBearing,
      }
    }
    return null
  })

  // Bound out of TourScene: the walk is its job, not this page's. Seeded from
  // the spawn rather than from `game`, which is where it came from anyway — the
  // binding takes over on the first frame.
  let position = $state<Vec2>(interiorPoint(initialOpening.from.footprint))
  let heading = $state(0)
  let currentSpace = $state<Space | null>(null)
  let engaged = $state(false)
  let tierId = $state(initialArena.tierId)

  const nameOf = (entity: Space | { name: string; nameFr: string } | undefined) => {
    if (!entity) return ''
    return $locale === 'fr' ? entity.nameFr : entity.name
  }

  function selectTier(id: string) {
    tierId = id
    const newPlan = ship.plans.get(id)
    if (newPlan) {
      plan = newPlan
    }
  }

  const crossings = $derived(crossingsOn(ship, tierId))
  const decks = $derived(
    ship.decks.map((tier) => ({
      id: tier.id,
      label: nameForDeck(tier),
      active: tier.id === tierId,
    })),
  )

  function selectTerrain(id: HuntTerrainId) {
    const declaredIndex = activeContract.terrainSequence.indexOf(id)
    if (declaredIndex >= 0) contractStage = declaredIndex
    selectedTerrain = id
    arena = buildArena(id)
    plan = ship.plans.get(arena.tierId)!
    graph = buildNavGraph(arena)
    world = { dt: HUNT_DT, arena, graph, environment: activeContract.environment }
    opening = farthestApart()
    position = interiorPoint(opening.from.footprint)
    heading = 0
    currentSpace = null
    tierId = arena.tierId
    game = freshGame()
  }

  function selectContract(id: string) {
    const contract = customContract?.id === id ? customContract : huntContractById(id)
    if (!contract) return
    selectedContract = contract.id
    campaignRecorded = false
    contractStage = 0
    if (!contract.allowedHatsu.includes(selectedHatsu)) selectedHatsu = contract.allowedHatsu[0]
    if (!contract.hunterProfiles.includes(selectedHunter)) {
      selectedHunter = contract.hunterProfiles[0]
    }
    selectTerrain(contract.terrainSequence[0])
    game = freshGame()
  }

  function advanceContractZone(): boolean {
    const upcoming = nextStage(activeContract, contractStage)
    if (!upcoming) return false
    const previous = game
    contractStage = upcoming.index
    selectTerrain(upcoming.terrain)
    game = carryIntoStage(previous, game)
    return true
  }

  let inDuel = $derived(game.duel !== null)
  let finished = $derived(huntIsOver(game.outcome))

  // Read once, on mount: this drives whether the veil moves, and a visitor who
  // has asked for less movement should not have it re-decided mid-game.
  let calm = $state(false)
  let briefed = $state(false)
  let tutorialDismissed = $state(false)
  let lesson = $derived(tutorialStep(game))
  let duelSeat = $state<{ at: Vec2; heading: number; eye: number } | null>(null)

  // `TourScene` already owns the one trustworthy way to immobilise a body
  // while leaving the head free. Capture the contact point once: rebuilding
  // this object every tick would also reset the player's gaze every tick.
  $effect(() => {
    if (game.duel && !duelSeat) {
      duelSeat = { at: [...game.player.position], heading: game.player.heading, eye: 1.7 }
    } else if (!game.duel && duelSeat) {
      duelSeat = null
    }
  })

  /**
   * What the principles currently look like. Derived from the same state the
   * HUD reads, and from nothing else — see the note at the top of `veil.ts` for
   * why that constraint matters more than the effect does.
   */
  /**
   * The hunter's body. Handed to the scene as an ordinary apparition so the
   * walk's own depth test decides when he is visible: down the line of a
   * doorway, yes; through a bulkhead, no. Nothing here works that out.
   */
  let figures = $derived.by(() => {
    const visible = sightings({
      hunter: game.hunter,
      tierId: arena.tierId,
      floor: floorOf(spaceById(game.hunter.spaceId) ?? arena.spaces[0], plan.tier),
      duel: game.duel,
    })
    const frame = lastReplay?.terrain === selectedTerrain ? ghostAt(lastReplay, game.clock) : null
    const ghost = ghostFigure(frame, {
      tierId: arena.tierId,
      floor: floorOf(spaceById(frame?.spaceId ?? null) ?? arena.spaces[0], plan.tier),
    })
    return ghost ? [...visible, ghost] : visible
  })

  let cues = $derived(
    cuesFor({
      echoes: game.echoes,
      nen: game.player.nen,
      at: game.player.position,
      heading: game.player.heading,
      duel: game.duel,
    }),
  )
  let playerNen = $derived(
    game.duel ? huntDuelNen(game.duel.player) : explorationNen(game.player.nen, game.advancedNen),
  )
  let hatsuPresentation = $derived(presentHatsu(game))

  function send(action: HuntAction) {
    const before = game
    game = huntReducer(game, action)
    if (game === before) return
    const flash = hatsuFlash(before, game)
    if (flash) activeHatsuFlash = { ...flash, seq: ++hatsuFlashSeq }
    if (replay) {
      const recordMovement = action.type !== 'WALKED' || game.clock - lastReplayMovementAt >= 0.25
      if (recordMovement) {
        replay = appendReplayAction(replay, game.clock, action)
        if (action.type === 'WALKED') lastReplayMovementAt = game.clock
      }
    }
    if (action.type === 'HATSU') playHuntCue(game.hatsu.id)
    if (action.type === 'LAY') playHuntCue('bungee-gum')
    if (action.type === 'TAKE') playHuntCue('trap')
  }

  let canSweep = $derived(
    game.player.nen === 'ten' &&
      game.ledger.pool.available >= 15 &&
      capabilitiesOf(game.advancedNen).canSweepEn,
  )
  let canLay = $derived(
    game.hatsu.id === 'bungee-gum' &&
      game.player.spaceId !== null &&
      game.ledger.pool.available >= 25 &&
      game.player.nen === 'ten',
  )
  let canTake = $derived(
    game.ledger.placements.some(
      (placement) => placement.state === 'set' && placement.spaceId === game.player.spaceId,
    ),
  )
  let canHatsu = $derived(
    game.hatsu.id === 'parallel-future'
      ? game.player.nen === 'zetsu'
      : game.hatsu.id === 'dowsing-chain' && game.player.nen === 'ten' && game.player.atRest,
  )

  // ── Input ────────────────────────────────────────────────────────────────
  //
  // Every key here is one `TourScene` does not already spend on walking: it owns
  // WASD and ZQSD both, the arrows, Shift, Tab and E. Taking one of those back
  // would mean editing the tour, and the tour is not to be edited (I7).

  const HUNT_KEYS: Record<string, HuntAction> = {
    KeyF: { type: 'SWEEP' },
    KeyX: { type: 'ZETSU' },
    KeyV: { type: 'LAY' },
    KeyR: { type: 'TAKE' },
    KeyN: { type: 'REN' },
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!briefed || finished || event.repeat || event.metaKey || event.ctrlKey) return
    if (isNenControlCode(event.code)) return
    const handled = game.duel ? duelKey(event.code) : huntKey(event.code)
    if (handled) event.preventDefault()
  }

  function huntKey(code: string): boolean {
    if (code === 'KeyU' && game.player.spaceId) {
      send({ type: 'SHU', itemId: `room:${game.player.spaceId}` })
      return true
    }
    const action = HUNT_KEYS[code]
    if (!action) return false
    send(action)
    return true
  }

  function duelKey(code: string): boolean {
    const zone = zoneFor(code)
    if (zone) return duel({ type: 'RYU', side: 'player', setting: { guard: zone } })

    switch (code) {
      case NEN_KEYS.ryuDown:
        return shiftRyu(-0.15)
      case NEN_KEYS.ryuUp:
        return shiftRyu(0.15)
      case NEN_KEYS.gyo:
        return duel({ type: 'GYO', side: 'player', on: !game.duel!.player.gyo })
      case NEN_KEYS.in:
        return duel({ type: 'IN', side: 'player', on: !game.duel!.player.in })
      case NEN_KEYS.ken:
        return duel({ type: 'KEN', side: 'player', on: !game.duel!.player.ken })
      case NEN_KEYS.zetsu:
        return duel({ type: 'ZETSU', on: !game.duel!.player.zetsu })
      case 'KeyR':
        send({ type: 'TAKE_IN_DUEL' })
        return true
      case 'Space':
        return strike()
      case NEN_KEYS.ko:
        return strike()
      default:
        return false
    }
  }

  function zoneFor(code: string): BodyZone | null {
    const index = nenZoneIndex(code)
    return index === null ? null : BODY_ZONES[index]
  }

  function duel(action: Extract<HuntAction, { type: 'DUEL' }>['action']): boolean {
    send({ type: 'DUEL', action })
    return true
  }

  function shiftRyu(by: number): boolean {
    return duel({
      type: 'RYU',
      side: 'player',
      setting: { attack: game.duel!.player.attack + by },
    })
  }

  /**
   * Space gathers; the blow lands by itself when the wind-up is done. There is
   * no second key for throwing, because there is no decision left to make: from
   * the moment it is gathered, three of your zones are open and the other one
   * has under a second to notice.
   */
  function strike(): boolean {
    const player = game.duel!.player
    if (player.attack < STRIKE_THRESHOLD) return true
    return duel({ type: 'KO', side: 'player', zone: player.guard })
  }

  // ── The fixed step ───────────────────────────────────────────────────────

  let frame = 0
  let owed = 0
  let last = 0

  function tick(now: number) {
    frame = requestAnimationFrame(tick)
    const elapsed = last === 0 ? 0 : (now - last) / 1000
    last = now

    // A backgrounded tab comes back owing a quarter of a second at most: the
    // hunter does not get to cross the apartment while nobody was looking.
    owed = safeFrameDebt(owed, elapsed)

    if (!briefed) {
      owed = 0
      return
    }

    reportWalk()
    while (owed >= HUNT_DT && !huntIsOver(game.outcome)) {
      owed -= HUNT_DT
      const beforeTick = game
      game = updateHunt(game, world)
      if (game.outcome === 'reached' && advanceContractZone()) {
        playHuntCue('hatsu')
        continue
      }
      if (!beforeTick.duel && game.duel) playHuntCue('contact')
      if (!huntIsOver(beforeTick.outcome) && huntIsOver(game.outcome)) playHuntCue('outcome')
      if (huntIsOver(game.outcome) && !campaignRecorded) recordCampaignRun()
      for (const event of game.log.slice(beforeTick.log.length)) {
        if (event.kind === 'feltEn') playHuntCue('en')
        if (event.kind === 'sprungEntrave') playHuntCue('trap')
      }
    }
  }

  /** Standing still is what regeneration is paid for, so it has to be observed. */
  function reportWalk() {
    const moved = Math.hypot(
      position[0] - game.player.position[0],
      position[1] - game.player.position[1],
    )
    if (moved === 0 && game.player.atRest && heading === game.player.heading) return
    send({
      type: 'WALKED',
      player: {
        position: position,
        heading,
        spaceId: currentSpace?.id ?? null,
        atRest: moved === 0,
      },
    })
  }

  onMount(() => {
    calm = prefersReducedMotion()
    campaign = loadCampaign(localStorage)
    const sharedValue = new URLSearchParams(window.location.search).get('contract')
    const sharedContract = sharedValue ? decodeContract(sharedValue) : null
    if (sharedContract) {
      customContract = sharedContract
      selectContract(sharedContract.id)
    }
    const storedReplay = localStorage.getItem(replayKey)
    lastReplay = storedReplay ? decodeReplay(storedReplay) : null
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('visibilitychange', resetFrameClock)
    window.addEventListener('pagehide', closeHuntAudio)
    frame = requestAnimationFrame(tick)
  })

  onDestroy(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('visibilitychange', resetFrameClock)
    window.removeEventListener('pagehide', closeHuntAudio)
    closeHuntAudio()
    cancelAnimationFrame(frame)
  })

  function resetFrameClock() {
    last = 0
    owed = 0
  }

  function recordCampaignRun() {
    campaignRecorded = true
    campaign = completeCampaignRun(campaign, {
      contractId: selectedContract,
      hatsu: game.hatsu.id,
      outcome: game.outcome,
      seconds: game.clock,
      wounds: game.advancedNen.wounds,
    })
    saveCampaign(localStorage, campaign)
    if (replay) localStorage.setItem(replayKey, encodeReplay(replay))
  }

  function useStandardNen(action: NenTechniqueAction) {
    if (!game.duel) {
      if ((action.type === 'TEN' && game.player.nen === 'zetsu') || (action.type === 'ZETSU' && game.player.nen !== 'zetsu')) send({ type: 'ZETSU' })
      if (action.type === 'REN') send({ type: 'REN' })
      if (action.type === 'EN' && action.radius !== null) send({ type: 'SWEEP' })
      if (action.type === 'SHU' && action.objectId) send({ type: 'SHU', itemId: action.objectId })
      return
    }
    if (action.type === 'TEN' && game.duel.player.zetsu) return duel({ type: 'ZETSU', on: false })
    if (action.type === 'ZETSU' && !game.duel.player.zetsu) return duel({ type: 'ZETSU', on: true })
    if (action.type === 'GYO' || action.type === 'IN' || action.type === 'KEN')
      return duel({ type: action.type, side: 'player', on: action.on })
    if (action.type === 'KO' && action.zone) return strike()
    if (action.type === 'RYU')
      return duel({ type: 'RYU', side: 'player', setting: { attack: Number(action.distribution.hands ?? game.duel.player.attack) } })
  }

  function again() {
    campaignRecorded = false
    if (replay) lastReplay = replay
    replay = null
    game = freshGame()
    position = game.player.position
    owed = 0
    last = 0
  }

  function begin() {
    replay = createReplay({
      schemaVersion: 3,
      contractId: selectedContract,
      seed: activeContract.seed,
      terrain: selectedTerrain,
      hatsu: selectedHatsu,
      hunter: selectedHunter,
      actions: [],
    })
    lastReplayMovementAt = -Infinity
    briefed = true
  }
</script>

<Seo
  title={$t.hunt.seoTitle}
  description={$t.hunt.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.hunt.breadcrumb, path: $link('/hunt') },
  ])}
/>

<div class="relative h-screen w-full overflow-hidden bg-black text-white">
  <TourModeFullscreen />
  <TourMinimapPanel
    ship={ship}
    tierId={tierId}
    plan={plan}
    position={position}
    heading={heading}
    currentSpaceId={currentSpace?.id ?? null}
    decks={decks}
    crossings={crossings}
    nameOf={nameOf}
    onSelectDeck={selectTier}
    onSelectPlan={(space) => {
      position = interiorPoint(space.footprint)
      currentSpace = space
    }}
  />
  <HuntAudioControl locale={$locale} />
  <div class="sr-only" aria-live="polite" aria-atomic="true">
    {#if finished}
      {$t.hunt.outcome[
        game.outcome === 'playing' || game.outcome === 'contact' ? 'timeUp' : game.outcome
      ]}
    {:else if inDuel}
      {$t.hunt.duel.title}
    {:else}
      {roomName(game.player.spaceId)} — {game.player.nen === 'zetsu'
        ? $t.hunt.hud.zetsu
        : $t.hunt.hud.ten}
    {/if}
  </div>
  <TourScene
    {ship}
    bind:tierId
    bind:position
    bind:heading
    bind:currentSpace
    bind:engaged
    seated={duelSeat}
    world={hatsuPresentation.world}
    tint={hatsuPresentation.tint}
    flash={activeHatsuFlash}
    nen={playerNen}
    showNenControls={true}
    nenAvailability={game.duel
      ? { ren: 'Le duel contrôle Ren via Ken.', en: 'En est interrompu au contact.', shu: 'Aucun objet libre pendant le duel.', on: 'On n’est pas maîtrisé dans ce contrat.', action: 'F frappe pendant le duel.' }
      : { gyo: 'Gyo exige un adversaire engagé.', in: 'In exige un duel dans ce mode.', ken: 'Ken exige un adversaire engagé.', ko: 'Ko exige une cible de duel.', ryu: 'Ryu exige une cible de duel.', on: 'On n’est pas maîtrisé dans ce contrat.', action: 'Visez un objet imprégnable.' }}
    onNenChange={useStandardNen}
    onPhysicalNenAction={() => game.duel && strike()}
    onHatsu={() => send({ type: 'HATSU' })}
    hatsuAllowedInZetsu={game.hatsu.id === 'parallel-future'}
    extras={figures}
    touchLabels={{ move: $t.tour.touch.move, cast: $t.tour.touch.cast }}
    soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
    loadingLabel={$t.tour.loading}
    unsupportedLabel={$t.tour.unsupported}
  />

  {#if !finished}
    <NenVeil {cues} {calm} />
  {/if}

  {#if !finished && !inDuel}
    <HuntHud
      pool={game.duel ? game.duel.player.pool : game.ledger.pool}
      feedback={game.feedback}
      reading={{
        nen: game.player.nen,
        roomName: roomName(game.player.spaceId),
        targetName: roomName(game.targetSpaceId),
        entraves: liveOf(game.ledger.placements).length,
        heading: game.player.heading,
        hatsu: hatsuReading,
      }}
      labels={{ hud: $t.hunt.hud, feel: $t.hunt.feel }}
    />
  {/if}

  {#if briefed && !inDuel && !finished}
    <HuntActions
      {canLay}
      {canTake}
      hatsuId={game.hatsu.id}
      labels={$t.hunt.actions}
      onLay={() => send({ type: 'LAY' })}
      onTake={() => send({ type: 'TAKE' })}
    />
  {/if}

  {#if briefed && !tutorialDismissed && lesson !== 'done' && !finished}
    <HuntTutorial
      step={lesson}
      labels={tutorialMessages($locale)}
      onDismiss={() => (tutorialDismissed = true)}
    />
  {/if}

  {#if inDuel && !finished}
    <DuelPanel
      duel={game.duel!}
      labels={$t.hunt.duel}
      canRecover={canTake}
      onGuard={(zone) => duel({ type: 'RYU', side: 'player', setting: { guard: zone } })}
      onRyu={(attack) => duel({ type: 'RYU', side: 'player', setting: { attack } })}
      onGyo={() => duel({ type: 'GYO', side: 'player', on: !game.duel!.player.gyo })}
      onIn={() => duel({ type: 'IN', side: 'player', on: !game.duel!.player.in })}
      onKen={() => duel({ type: 'KEN', side: 'player', on: !game.duel!.player.ken })}
      onKo={() => strike()}
      onBreakAway={() => duel({ type: 'ZETSU', on: !game.duel!.player.zetsu })}
      onRecover={() => send({ type: 'TAKE_IN_DUEL' })}
    />
  {/if}

  {#if !engaged && !inDuel && !finished}
    <p class="pointer-events-none absolute inset-x-0 top-8 text-center text-sm text-white/70">
      {$t.hunt.enter}
    </p>
  {/if}

  {#if finished}
    <div class="absolute inset-0 overflow-y-auto bg-black/95">
      <Debrief
        report={{
          outcome: game.outcome,
          clock: game.clock,
          log: game.log,
          playerPool: game.ledger.pool,
          hunterPool: game.hunter.pool,
          laid: game.ledger.placements.length,
          sprung: game.ledger.placements.filter((placement) => placement.state === 'sprung').length,
          recovered: game.ledger.placements.filter((placement) => placement.state === 'recovered')
            .length,
          roomName,
          arena,
        }}
        labels={$t.hunt.debrief}
        trajectoryLabels={debriefMessages($locale)}
        outcomeLabel={$t.hunt.outcome[
          game.outcome === 'playing' || game.outcome === 'contact' ? 'timeUp' : game.outcome
        ]}
      />
      <div class="pb-16 text-center">
        <button
          class="rounded border border-white/25 px-6 py-2 text-sm uppercase tracking-widest text-white/80 transition hover:border-white/60 hover:text-white"
          onclick={again}
        >
          {$t.hunt.debrief.again}
        </button>
      </div>
    </div>
  {/if}

  {#if !briefed}
    <HuntBriefing
      labels={$t.hunt.briefing}
      profiles={availableHatsuProfiles}
      selected={selectedHatsu}
      hunterProfiles={availableHunterProfiles}
      selectedHunter={selectedHunter}
      hunterLabels={hunterProfileMessages($locale)}
      terrains={availableTerrains}
      selectedTerrain={selectedTerrain}
      terrainLabel={terrainMessages($locale).choose}
      {contracts}
      {selectedContract}
      contractLabel={contractMessages($locale).choose}
      {selectedVow}
      locale={$locale}
      onSelect={(id) => {
        selectedHatsu = id
        game = freshGame()
      }}
      onSelectHunter={(id) => {
        selectedHunter = id
        game = freshGame()
      }}
      onSelectTerrain={selectTerrain}
      onSelectContract={selectContract}
      onSelectVow={(vow) => {
        selectedVow = vow
        game = freshGame()
      }}
      onBegin={begin}
    />
  {/if}
</div>
