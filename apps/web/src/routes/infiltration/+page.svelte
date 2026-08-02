<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import Seo from '$lib/components/Seo.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import TourModeFullscreen from '$lib/components/tour/TourModeFullscreen.svelte'
  import { buildArena } from '$lib/hunt/arena'
  import { explorationNen } from '$lib/nen/tourAdapters'
  import type { NenTechniqueAction } from '@black-whale/nen-engine'
  import { isNenControlCode } from '$lib/nen/controls'
  import { buildNavGraph } from '$lib/hunt/navmesh'
  import { floorOf, theShip } from '$lib/tour/blueprint'
  import { centroid, EMPTY_WORLD } from '$lib/tour/hatsu'
  import { interiorPoint } from '$lib/tour/geometry'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import type { Apparition } from '$lib/tour/apparitions'
  import type { Space, Vec2 } from '$lib/tour/types'
  import {
    infiltrationReducer,
    initialInfiltrationState,
    type InfiltrationAction,
    type WitnessId,
  } from '$lib/infiltration/state'
  import { INFILTRATION_DT, reconstruction, updateInfiltration } from '$lib/infiltration/loop'
  import { INFILTRATION_HATSU, planHatsu, type ForgerySurface } from '$lib/infiltration/hatsu'
  import type { CoverRole } from '$lib/infiltration/social/cover'
  import { evaluateRun } from '$lib/infiltration/balance'
  import { MISSIONS, selectMission } from '$lib/infiltration/missions/definitions'
  import { seedFromText } from '$lib/infiltration/missions/random'
  import type { MissionId } from '$lib/infiltration/missions/types'
  import { decodeSave, encodeSave } from '$lib/infiltration/persistence'
  import { causalTimeline, debriefAxes } from '$lib/infiltration/debrief'
  import { applyConsequences, initialCampaign, type CampaignState } from '$lib/infiltration/campaign'

  const ship = theShip()
  const arena = buildArena()
  const graph = buildNavGraph(arena)
  const plan = ship.plans.get(arena.tierId)!
  const extraction = arena.spaces[0]
  const defaultSeed = seedFromText('black-whale-v2')
  const forgerySurfaces: ForgerySurface[] = ['work-order', 'door-sign', 'register-copy']
  const disguiseIdentities: CoverRole[] = ['maintenance', 'security', 'service', 'messenger']
  let selectedMission = $state<MissionId>('missing-report')
  let campaign = $state<CampaignState>(initialCampaign())

  const roomName = (space: Space | undefined | null) =>
    space ? ($locale === 'fr' ? space.nameFr : space.name) : '—'

  function freshGame() {
    const selection = selectMission(selectedMission, defaultSeed)
    const objective = arena.spaces[selection.variant.objectiveIndex]
    return initialInfiltrationState({
      playerAt: { position: interiorPoint(extraction.footprint), spaceId: extraction.id },
      objectiveSpaceId: objective.id,
      extractionSpaceId: extraction.id,
      selection,
      witnesses: selection.definition.witnesses.map((definition, index) => {
        const space = arena.spaces[definition.spaceIndex]
        const neighbours = graph.edges.get(space.id) ?? []
        const rotated = neighbours.map((_, routeIndex) =>
          neighbours[(routeIndex + selection.variant.routeOffset) % neighbours.length],
        )
        return {
        id: definition.id,
        position: centroid(space),
        heading: index % 2 === 0 ? 0 : Math.PI,
        spaceId: space.id,
        sight: definition.sight,
        social: definition.social,
        usesEn: definition.usesEn,
        route: [space.id, ...rotated],
      }}),
    })
  }

  const spawn = interiorPoint(extraction.footprint)
  let game = $state(freshGame())
  let position = $state<Vec2>(spawn)
  let heading = $state(0)
  let currentSpace = $state<Space | null>(extraction)
  let tierId = $state(arena.tierId)
  let engaged = $state(false)
  let briefing = $state(true)
  let frame = 0
  let owed = 0
  let last = 0
  let autosave: ReturnType<typeof setInterval> | undefined

  let finished = $derived(game.outcome !== 'playing')
  let objective = $derived(arena.spaces.find((space) => space.id === game.objectiveSpaceId)!)
  let canCopy = $derived(currentSpace?.id === objective.id && !game.documentCopied)
  let canVerify = $derived(
    currentSpace?.id === objective.id && game.documentCopied && !game.authorConfirmed,
  )
  let canExtract = $derived(currentSpace?.id === extraction.id && game.documentCopied)
  let report = $derived(reconstruction(game))
  let hatsuPlan = $derived(planHatsu(game))
  let balance = $derived(evaluateRun(game))
  let verdict = $derived(debriefAxes(game))
  let timeline = $derived(causalTimeline(game))
  let scoutDestinations = $derived(
    game.hatsu.scout?.active
      ? (graph.edges.get(game.hatsu.scout.spaceId) ?? [])
          .map((id) => arena.spaces.find((space) => space.id === id))
          .filter((space): space is Space => !!space)
      : [],
  )

  const colours: Record<WitnessId, number> = {
    steward: 0x58a6ff,
    guard: 0xffb347,
    nenGuard: 0xff4f64,
  }

  let figures = $derived(
    game.witnesses.map((witness): Apparition => ({
      id: witness.id,
      kind: 'avatar',
      colour: colours[witness.id],
      size: 0.42,
      y: floorOf(
        arena.spaces.find((space) => space.id === witness.spaceId)!,
        plan.tier,
      ),
      at: witness.position,
      heading: witness.heading,
      tierId: arena.tierId,
      spaceId: witness.spaceId,
      stage: 0,
      human: {
        role: witness.id === 'steward' ? 'steward' : witness.id === 'nenGuard' ? 'nen-guard' : 'guard',
        identity: `infiltration:${witness.id}`,
        alert: witness.challenged || witness.investigating !== null,
        pose: witness.investigating ? 'search' : 'walk',
        aura: witness.usesEn ? 'ten' : 'none',
      },
      hidden: false,
    })),
  )
  let scoutFigure = $derived<Apparition[]>(
    game.hatsu.scout?.active
      ? [{
          id: 'little-eye-scout', kind: 'insect', colour: 0xd86cff, size: 0.22,
          y: floorOf(arena.spaces.find((space) => space.id === game.hatsu.scout?.spaceId)!, plan.tier) + 1.3,
          at: game.hatsu.scout.position, heading: game.hatsu.scout.heading, tierId: arena.tierId,
          spaceId: game.hatsu.scout.spaceId, stage: 0, hidden: false,
        }]
      : [],
  )

  function moveScoutTo(space: Space) {
    send({
      type: 'SCOUT_MOVE', position: centroid(space), spaceId: space.id,
      visibleToGuard: game.witnesses.some((witness) => witness.spaceId === space.id),
    })
  }

  function send(action: InfiltrationAction) {
    const wasPlaying = game.outcome === 'playing'
    game = infiltrationReducer(game, action)
    if (wasPlaying && game.outcome === 'escaped') {
      campaign = applyConsequences(campaign, {
        missionId: game.mission.id,
        discoveredSpaces: [...new Set(game.witnesses.map((witness) => witness.spaceId))],
        compromisedRole: game.coverIntegrity < 50 ? game.cover.role : undefined,
        learnedProcedure: game.security.level !== 'normal' ? game.security.level : undefined,
      })
      localStorage.setItem('black-whale:infiltration:campaign:v1', JSON.stringify(campaign))
    }
  }

  function useStandardNen(action: NenTechniqueAction) {
    if (action.type === 'TEN' && game.player.nen === 'zetsu') send({ type: 'ZETSU' })
    if (action.type === 'ZETSU' && game.player.nen !== 'zetsu') send({ type: 'ZETSU' })
  }

  function act() {
    if (canCopy) send({ type: 'COPY' })
    else if (canVerify) send({ type: 'VERIFY' })
    else if (canExtract) send({ type: 'EXTRACT' })
  }

  function onKeyDown(event: KeyboardEvent) {
    if (finished || event.repeat) return
    if (game.challenge && event.code === 'Digit1') {
      send({ type: 'ANSWER', answer: 'workOrder' })
      event.preventDefault()
      return
    } else if (game.challenge && event.code === 'Digit2') {
      send({ type: 'ANSWER', answer: 'bluff' })
      event.preventDefault()
      return
    } else if (briefing && ['Digit1', 'Digit2', 'Digit3'].includes(event.code)) {
      const ability = INFILTRATION_HATSU[Number(event.code.at(-1)) - 1]
      if (ability) send({ type: 'SELECT_HATSU', id: ability.id })
      event.preventDefault()
      return
    } else if (briefing && event.code === 'Enter') {
      briefing = false
      event.preventDefault()
      return
    } else if (briefing) return
    if (isNenControlCode(event.code)) return
    if (event.code === 'KeyV') send({ type: 'DIVERT' })
    else return
    event.preventDefault()
  }

  function tick(now: number) {
    frame = requestAnimationFrame(tick)
    const elapsed = last === 0 ? 0 : (now - last) / 1000
    last = now
    if (briefing || finished) return
    owed = Math.min(0.25, owed + elapsed)
    const moved = Math.hypot(
      position[0] - game.player.position[0],
      position[1] - game.player.position[1],
    )
    send({
      type: 'WALKED',
      position,
      spaceId: currentSpace?.id ?? null,
      moving: moved > 0.001,
      speed: elapsed > 0 ? moved / elapsed : 0,
    })
    while (owed >= INFILTRATION_DT && game.outcome === 'playing') {
      game = updateInfiltration(game, { dt: INFILTRATION_DT, graph, arena })
      owed -= INFILTRATION_DT
    }
  }

  function again() {
    game = freshGame()
    position = game.player.position
    briefing = true
    owed = 0
    last = 0
  }

  function chooseMission(id: MissionId) {
    selectedMission = id
    game = freshGame()
    position = game.player.position
    currentSpace = extraction
    resetClock()
  }

  onMount(() => {
    try {
      const storedCampaign = JSON.parse(localStorage.getItem('black-whale:infiltration:campaign:v1') ?? 'null')
      if (storedCampaign?.version === 1) campaign = storedCampaign
    } catch { /* A corrupt campaign never blocks a mission. */ }
    const saved = decodeSave(localStorage.getItem('black-whale:infiltration:v3') ?? localStorage.getItem('black-whale:infiltration:v2') ?? '')
    if (saved?.state.outcome === 'playing') {
      game = saved.state
      selectedMission = saved.state.mission.id
      position = saved.state.player.position
      currentSpace = arena.spaces.find((space) => space.id === saved.state.player.spaceId) ?? extraction
    }
    autosave = setInterval(() => {
      if (game.outcome === 'playing' && !briefing)
        localStorage.setItem('black-whale:infiltration:v3', encodeSave(game))
    }, 3000)
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('visibilitychange', resetClock)
    frame = requestAnimationFrame(tick)
  })
  onDestroy(() => {
    if (autosave) clearInterval(autosave)
    if (typeof window === 'undefined') return
    window.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('visibilitychange', resetClock)
    cancelAnimationFrame(frame)
  })

  function resetClock() {
    last = 0
    owed = 0
  }
</script>

<Seo
  title={$t.infiltration.seoTitle}
  description={$t.infiltration.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.infiltration.title, path: $link('/infiltration') },
  ])}
/>

<div class="relative h-screen w-full overflow-hidden bg-black text-white">
  <TourModeFullscreen />
  <p class="sr-only" aria-live="polite">
    {$t.infiltration.alert}
    {Math.round(game.alert)}%. {$t.infiltration.integrity}
    {Math.round(game.coverIntegrity)}%.
  </p>
  <TourScene
    {ship}
    bind:tierId
    bind:position
    bind:heading
    bind:currentSpace
    bind:engaged
    world={EMPTY_WORLD}
    nen={explorationNen(game.player.nen)}
    showNenControls={true}
    nenAvailability={{ ren: false, gyo: false, in: false, en: false, shu: false, ken: false, ko: false, ryu: false, on: false }}
    onNenChange={useStandardNen}
    onPhysicalNenAction={act}
    onHatsu={() => send({ type: 'CAST_HATSU' })}
    extras={[...figures, ...scoutFigure]}
    touchLabels={{ move: $t.tour.touch.move, cast: $t.tour.touch.cast }}
    soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
    loadingLabel={$t.tour.loading}
    unsupportedLabel={$t.tour.unsupported}
  />

  {#if !briefing && !finished}
    <section
      class="pointer-events-none absolute left-4 top-16 w-[min(24rem,calc(100%-2rem))] rounded border border-white/15 bg-black/85 p-4 backdrop-blur"
    >
      <p class="text-[10px] uppercase tracking-[.25em] text-amber-300">{$t.infiltration.cover}</p>
      <h1 class="mt-1 text-lg font-bold">{$t.infiltration.title}</h1>
      <p class="mt-2 text-sm text-white/65">{roomName(currentSpace)}</p>
      <div class="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <span class="text-white/45">{$t.infiltration.integrity}</span><strong
            class="block text-lg">{Math.round(game.coverIntegrity)}%</strong
          >
        </div>
        <div>
          <span class="text-white/45">{$t.infiltration.alert}</span><strong class="block text-lg"
            >{Math.round(game.alert)}%</strong
          >
        </div>
      </div>
      <div class="mt-3 h-1 overflow-hidden rounded bg-white/10">
        <div class="h-full bg-amber-300" style:width={`${game.coverIntegrity}%`}></div>
      </div>
      <p class="mt-4 text-xs text-white/65">
        {$t.infiltration.objective}:
        <strong class={game.documentCopied ? 'text-emerald-300' : 'text-white'}
          >{game.documentCopied ? $t.infiltration.copied : roomName(objective)}</strong
        >
      </p>
      <p class="mt-1 text-xs text-white/45">
        {game.alertLevel.toUpperCase()} · {game.mission.variantId} · seed {game.mission.seed}
      </p>
      {#if game.security.verifyDocuments}
        <p class="mt-1 text-xs text-red-300">{$t.infiltration.v3.documentChecks}</p>
      {/if}
      <p class="mt-1 text-xs text-white/65">
        Nen: <strong>{game.player.nen === 'zetsu' ? 'Zetsu' : 'Ten'}</strong>
      </p>
      <p class="mt-1 text-xs text-white/65">
        Hatsu: <strong
          >{INFILTRATION_HATSU.find((entry) => entry.id === game.hatsu.id)?.name}</strong
        >
        · {game.hatsu.aura} aura · {game.hatsu.uses}
        {$t.infiltration.uses}
      </p>
    </section>

    <div class="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
      {#if game.hatsu.scout?.active}
        {#each scoutDestinations as destination (destination.id)}
          <button onclick={() => moveScoutTo(destination)} class="rounded border border-fuchsia-300/50 bg-black/90 px-3 py-2 text-xs text-fuchsia-200">
            Eye → {roomName(destination)}
          </button>
        {/each}
        <button onclick={() => send({ type: 'SCOUT_RECALL' })} class="rounded border border-white/25 bg-black/90 px-3 py-2 text-xs">{$t.infiltration.hatsuInteractive.recall}</button>
      {/if}
      {#if canCopy || canVerify || canExtract}<button
          onclick={act}
          class="rounded border border-amber-300/60 bg-black/90 px-4 py-2 text-xs text-amber-200"
          >F · {canCopy
            ? $t.infiltration.copy
            : canVerify
              ? $t.infiltration.verify
              : $t.infiltration.extract}</button
        >{/if}
      <button
        onclick={() => send({ type: 'ZETSU' })}
        aria-keyshortcuts="X"
        class="rounded border border-white/25 bg-black/90 px-3 py-2 text-xs">X · Ten/Zetsu</button
      >
      <button
        onclick={() => send({ type: 'DIVERT' })}
        aria-keyshortcuts="V"
        disabled={!!game.diversion}
        class="rounded border border-white/25 bg-black/90 px-3 py-2 text-xs disabled:opacity-30"
        >V · {$t.infiltration.divert}</button
      >
      <button
        onclick={() => send({ type: 'CAST_HATSU' })}
        aria-keyshortcuts="H"
        disabled={!hatsuPlan.available}
        title={hatsuPlan.conditions
          .filter((condition) => !condition.met)
          .map((condition) => $t.infiltration.hatsuConditions[condition.id])
          .join(' · ')}
        class="rounded border border-fuchsia-300/40 bg-black/90 px-3 py-2 text-xs text-fuchsia-200 disabled:opacity-30"
        >H · {$t.infiltration.castHatsu}</button
      >
    </div>

    {#if game.challenge}
      <div
        class="absolute inset-0 grid place-items-center bg-black/55 p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cover-check-title"
      >
        <section class="w-full max-w-md border border-amber-300/40 bg-black/95 p-6 shadow-2xl">
          <p class="text-xs uppercase tracking-[.25em] text-amber-300">
            {$t.infiltration.challenge}
          </p>
          <h2 id="cover-check-title" class="mt-2 text-2xl font-bold">
            {$t.infiltration.witnesses[game.challenge.witnessId]}
          </h2>
          <p class="mt-3 text-sm leading-relaxed text-white/65">
            {$t.infiltration.challengePrompt}
          </p>
          <p class="mt-2 text-xs text-white/40">{Math.ceil(game.challenge.left)} s</p>
          <div class="mt-6 grid gap-2">
            <button
              aria-keyshortcuts="1"
              onclick={() => send({ type: 'ANSWER', answer: 'workOrder' })}
              class="border border-white/25 px-4 py-3 text-left text-sm hover:border-amber-300"
              >{$t.infiltration.workOrder}</button
            >
            <button
              aria-keyshortcuts="2"
              onclick={() => send({ type: 'ANSWER', answer: 'bluff' })}
              class="border border-white/25 px-4 py-3 text-left text-sm hover:border-amber-300"
              >{$t.infiltration.bluff}</button
            >
          </div>
        </section>
      </div>
    {/if}
  {/if}

  {#if briefing}
    <div
      class="absolute inset-0 grid place-items-center bg-black/90 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-title"
    >
      <article class="max-w-xl border border-amber-300/30 bg-[#0b0b0b] p-8">
        <p class="text-xs uppercase tracking-[.3em] text-amber-300">{$t.infiltration.briefing}</p>
        <h1 id="mission-title" class="mt-3 text-4xl font-black">{$t.infiltration.title}</h1>
        <p class="mt-5 leading-relaxed text-white/70">{$t.infiltration.intro}</p>
        <p class="mt-2 text-xs text-white/40">
          {$t.infiltration.v3.campaign} · {campaign.completed.length} {$t.infiltration.v3
            .operations} · {campaign.knownSpaces.length} {$t.infiltration.v3.knownAreas}
        </p>
        <p class="mt-6 text-xs uppercase tracking-[.2em] text-amber-300">
          {$t.infiltration.chooseMission}
        </p>
        <div class="mt-3 grid gap-2 sm:grid-cols-3">
          {#each Object.values(MISSIONS) as mission (mission.id)}
            <button
              onclick={() => chooseMission(mission.id)}
              aria-pressed={selectedMission === mission.id}
              class="border p-3 text-left text-xs {selectedMission === mission.id
                ? 'border-amber-300 bg-amber-300/10'
                : 'border-white/15'}"
            >
              <strong class="block text-white">{$t.infiltration.missions[mission.id].name}</strong>
              <span class="mt-1 block leading-snug text-white/45"
                >{$t.infiltration.missions[mission.id].goal}</span
              >
            </button>
          {/each}
        </div>
        {#if game.hatsu.id === 'texture-surprise'}
          <div class="mt-3 flex flex-wrap gap-2">
            {#each forgerySurfaces as surface}
              <button onclick={() => send({ type: 'CONFIGURE_HATSU', forgerySurface: surface })} aria-pressed={game.hatsu.forgerySurface === surface} class="border border-white/20 px-3 py-2 text-xs aria-pressed:border-fuchsia-300">{$t.infiltration.hatsuInteractive.surfaces[surface]}</button>
            {/each}
          </div>
        {:else if game.hatsu.id === 'illumi-needle-people'}
          <div class="mt-3 flex flex-wrap gap-2">
            {#each disguiseIdentities as identity}
              <button onclick={() => send({ type: 'CONFIGURE_HATSU', disguiseIdentity: identity })} aria-pressed={game.hatsu.disguiseIdentity === identity} class="border border-white/20 px-3 py-2 text-xs aria-pressed:border-fuchsia-300">{$t.infiltration.hatsuInteractive.identities[identity]}</button>
            {/each}
          </div>
        {/if}
        <ul class="mt-5 space-y-2 text-sm text-white/75">
          {#each game.objectives as missionObjective (missionObjective.id)}
            <li>• {$t.infiltration.objectiveLabels[missionObjective.kind]}</li>
          {/each}
        </ul>
        <p class="mt-6 text-xs uppercase tracking-[.2em] text-fuchsia-300">
          {$t.infiltration.chooseHatsu}
        </p>
        <div class="mt-3 grid gap-2 sm:grid-cols-3">
          {#each INFILTRATION_HATSU as ability (ability.id)}
            <button
              onclick={() => send({ type: 'SELECT_HATSU', id: ability.id })}
              aria-pressed={game.hatsu.id === ability.id}
              class="border p-3 text-left text-xs {game.hatsu.id === ability.id
                ? 'border-fuchsia-300 bg-fuchsia-300/10'
                : 'border-white/15'}"
            >
              <strong class="block text-white">{ability.name}</strong>
              <span class="mt-1 block text-white/45"
                >{$t.infiltration.hatsuRoles[ability.role]}</span
              >
              <span class="mt-2 block text-[10px] leading-snug text-white/35">{ability.rule}</span>
            </button>
          {/each}
        </div>
        <button
          onclick={() => (briefing = false)}
          aria-keyshortcuts="Enter"
          class="mt-8 bg-amber-300 px-6 py-3 text-sm font-bold text-black"
          >{$t.infiltration.begin}</button
        >
      </article>
    </div>
  {/if}

  {#if finished}
    <div class="absolute inset-0 overflow-y-auto bg-black/95 p-6">
      <article class="mx-auto max-w-3xl py-10">
        <p class="text-xs uppercase tracking-[.3em] text-amber-300">{$t.infiltration.debrief}</p>
        <h1 class="mt-3 text-4xl font-black">{$t.infiltration.outcomes[game.outcome]}</h1>
        <p class="mt-3 text-white/60">
          {$t.infiltration.score}: {report.score}/100 · {$t.infiltration.traces}: {report.traces
            .length}
        </p>
        <p class="mt-2 text-sm text-white/45">
          {game.mission.id} · {game.mission.variantId} · seed {game.mission.seed} · {game.alertLevel}
        </p>
        <div class="mt-6 grid grid-cols-3 gap-2 text-xs">
          <p class="border border-white/15 p-3">{$t.infiltration.v3.objectiveAxis}<br /><strong>{verdict.material}</strong></p>
          <p class="border border-white/15 p-3">{$t.infiltration.v3.informationAxis}<br /><strong>{verdict.information}</strong></p>
          <p class="border border-white/15 p-3">{$t.infiltration.v3.coverAxis}<br /><strong>{verdict.cover}</strong></p>
        </div>
        {#if timeline.length > 0}
          <ol class="mt-6 max-h-40 space-y-1 overflow-y-auto text-xs text-white/55">
            {#each timeline as event}
              <li>{event.at.toFixed(1)}s · {event.actor} · {event.detail}</li>
            {/each}
          </ol>
        {/if}
        <p class="mt-2 text-sm text-white/45">
          {$t.infiltration.reports}: {report.reports.length}
        </p>
        <p class="mt-2 text-sm text-white/45">
          {$t.infiltration.discoveredTraces}: {report.discoveredTraces} · {$t.infiltration
            .runStyle}:
          {$t.infiltration.styles[balance.style]}
        </p>
        <div class="mt-8 grid gap-3 sm:grid-cols-3">
          {#each report.witnesses as witness (witness.id)}<section
              class="border border-white/15 p-4"
            >
              <h2 class="font-bold">{$t.infiltration.witnesses[witness.id]}</h2>
              <p class="mt-2 text-sm text-white/60">
                {$t.infiltration.beliefs[witness.belief.identity]} · {Math.round(
                  witness.belief.certainty,
                )}%
              </p>
              <p class="mt-1 text-xs text-white/40">
                {witness.belief.reported ? $t.infiltration.reported : $t.infiltration.unreported}
              </p>
            </section>{/each}
        </div>
        <p class="mt-8 text-sm text-white/60">
          {$t.infiltration.truth}:
          <strong class="text-white"
            >{game.authorConfirmed ? $t.infiltration.confirmed : $t.infiltration.uncertain}</strong
          >
        </p>
        <button onclick={again} class="mt-8 border border-white/30 px-6 py-3 text-sm"
          >{$t.infiltration.again}</button
        >
      </article>
    </div>
  {/if}
</div>
