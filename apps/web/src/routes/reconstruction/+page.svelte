<script lang="ts">
  import type { PageData } from './$types'
  import { onDestroy } from 'svelte'
  import { createEmptyWorld, reduceWorld } from '@black-whale/world-engine'
  import type { StoryCursor, WorldEvent } from '@black-whale/world-engine'
  import Seo from '$lib/components/Seo.svelte'
  import TourScene from '$lib/components/tour/TourScene.svelte'
  import { floorOf, spaceForLocation, theShip } from '$lib/tour/blueprint'
  import { AVATAR, type Apparition } from '$lib/tour/apparitions'
  import { EMPTY_WORLD, centroid } from '$lib/tour/hatsu'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, locale, t } from '$lib/i18n'
  import { displayName } from '$lib/utils/displayNames'
  import type { Space, Vec2 } from '$lib/tour/types'

  let { data }: { data: PageData } = $props()
  const ship = theShip()

  const chronologicalEvents = $derived(
    data.chapters
      .flatMap((chapter) => chapter.events.map((event) => ({ event, chapter })))
      .sort(
        (a, b) =>
          (a.event.ordinal ?? Number.MAX_SAFE_INTEGER) -
            (b.event.ordinal ?? Number.MAX_SAFE_INTEGER) ||
          a.chapter.number - b.chapter.number ||
          a.event.sequence - b.event.sequence,
      ),
  )

  const engineEvents = $derived(
    data.worldEvents.map((record) => ({
      id: record.id,
      type: record.type,
      schemaVersion: record.schemaVersion,
      branchId: record.branchId,
      cursor: {
        branchId: record.branchId,
        ordinal: record.ordinal,
        chapterNumber: record.chapterNumber,
        localSequence: record.localSequence,
        eventId: record.id,
      },
      payload: record.payload,
      sourceIds: record.sourceIds,
      revealedAtChapter: record.revealedAtChapter ?? undefined,
    })) as unknown as WorldEvent[],
  )

  let currentIndex = $state(0)
  let isPlaying = $state(false)
  let playbackInterval: ReturnType<typeof setInterval> | undefined
  let extras = $state<Apparition[]>([])

  let tierId = $state(ship.tiers[0].id)
  let currentSpace = $state<Space | null>(null)
  let position = $state<Vec2>([0, 0])
  let heading = $state(0)
  let engaged = $state(false)
  let jumpTo = $state<string | null>(null)
  let jumpAt = $state<Vec2 | null>(null)

  let sceneCharacters = $derived(
    data.sceneCharacters
      .filter((character) => character.eventId === chronologicalEvents[currentIndex]?.event.id)
      .map((character) => ({
        ...character,
        name: displayName(character.canonicalName, $locale),
        shown: extras.find((extra) => extra.id === `avatar-${character.bodyId}`) ?? null,
      }))
      .sort((left, right) => left.name.localeCompare(right.name, $locale)),
  )

  type NarrativePosition = {
    id: string
    ordinal: number | null
    sequence: number
    chapter: { number: number }
  }

  function comparePosition(left: NarrativePosition, right: NarrativePosition): number {
    if (left.ordinal !== null && right.ordinal !== null) return left.ordinal - right.ordinal
    return left.chapter.number - right.chapter.number || left.sequence - right.sequence
  }

  function isLegacyPresenceActive(
    presence: PageData['presences'][number],
    event: NarrativePosition,
  ): boolean {
    return (
      comparePosition(presence.fromEvent, event) <= 0 &&
      (!presence.untilEvent || comparePosition(event, presence.untilEvent) < 0)
    )
  }

  function avatar(entityId: string, locationId: string): Apparition | null {
    const space = spaceForLocation(ship, data.locationSlugs[locationId] ?? locationId)
    if (!space) return null
    const plan = ship.plans.get(space.tierId)
    if (!plan) return null
    return {
      id: `avatar-${entityId}`,
      kind: 'avatar',
      spaceId: space.id,
      tierId: space.tierId,
      at: centroid(space),
      y: floorOf(space, plan.tier),
      colour: AVATAR,
      size: 0.9,
      stage: 0,
      hidden: false,
    }
  }

  $effect(() => {
    const currentMangaEvent = chronologicalEvents[currentIndex]
    if (!currentMangaEvent) {
      extras = []
      return
    }

    const target = currentMangaEvent.event
    const targetPosition: NarrativePosition = {
      id: target.id,
      ordinal: target.ordinal,
      sequence: target.sequence,
      chapter: { number: currentMangaEvent.chapter.number },
    }
    const eventsToApply = engineEvents.filter((event) =>
      target.ordinal !== null
        ? event.cursor.ordinal <= target.ordinal
        : event.cursor.chapterNumber < currentMangaEvent.chapter.number ||
          (event.cursor.chapterNumber === currentMangaEvent.chapter.number &&
            event.cursor.localSequence <= target.sequence),
    )

    const firstCursor = eventsToApply[0]?.cursor
    const initialCursor: StoryCursor = {
      branchId: firstCursor?.branchId ?? 'canon',
      ordinal: (firstCursor?.ordinal ?? 0) - 1,
      eventId: 'reconstruction-origin',
      chapterNumber: firstCursor?.chapterNumber ?? 0,
      localSequence: (firstCursor?.localSequence ?? 0) - 1,
    }
    let state = createEmptyWorld(initialCursor)
    for (const event of eventsToApply) {
      try {
        state = reduceWorld(state, event)
      } catch (error) {
        console.warn('Failed to reduce world event', event.id, error)
      }
    }

    // Temporal Presence rows establish the canonical baseline. A backfilled
    // world event for the same entity takes precedence over that baseline.
    const byEntity: Record<string, Apparition> = {}
    for (const presence of data.presences) {
      if (!presence.locationId || !isLegacyPresenceActive(presence, targetPosition)) continue
      const shown = avatar(presence.entityId, presence.locationId)
      if (shown) byEntity[presence.entityId] = shown
    }
    for (const [entityId, presence] of Object.entries(state.presences)) {
      if (presence.precision !== 'EXACT_ROOM' || !presence.locationId) continue
      const shown = avatar(entityId, presence.locationId)
      if (shown) byEntity[entityId] = shown
    }

    const nextExtras = Object.values(byEntity)
    extras = nextExtras

    // Stay on the visitor's chosen deck while it has a known presence. If it
    // does not, follow the timeline to a populated deck instead of showing an
    // apparently empty reconstruction.
    const focus = nextExtras.find((shown) => shown.tierId === tierId) ?? nextExtras[0]
    if (focus && focus.tierId !== tierId) {
      tierId = focus.tierId
      jumpTo = focus.spaceId
      jumpAt = focus.at
    }
  })

  function stopPlayback() {
    isPlaying = false
    if (playbackInterval) clearInterval(playbackInterval)
    playbackInterval = undefined
  }

  function togglePlay() {
    if (isPlaying) {
      stopPlayback()
      return
    }
    if (chronologicalEvents.length < 2) return
    isPlaying = true
    playbackInterval = setInterval(() => {
      if (currentIndex < chronologicalEvents.length - 1) currentIndex++
      else stopPlayback()
    }, 1000)
  }

  function chooseScene(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= chronologicalEvents.length) return
    stopPlayback()
    currentIndex = index
  }

  function watchCharacter(character: (typeof sceneCharacters)[number]) {
    if (!character.shown) return
    tierId = character.shown.tierId
    jumpTo = character.shown.spaceId
    jumpAt = character.shown.at
  }

  onDestroy(stopPlayback)
</script>

<Seo
  title={$t.reconstruction.seoTitle}
  description={$t.reconstruction.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.reconstruction.breadcrumb, path: $link('/reconstruction') },
  ])}
/>

<div class="relative h-screen w-full overflow-hidden bg-black">
  <h1 class="sr-only">{$t.reconstruction.title}</h1>
  <TourScene
    {ship}
    bind:tierId
    bind:currentSpace
    bind:position
    bind:heading
    bind:engaged
    bind:jumpTo
    bind:jumpAt
    world={EMPTY_WORLD}
    {extras}
    touchLabels={{ move: $t.tour.touch.move, cast: $t.tour.touch.cast }}
    soundLabels={{ silence: $t.tour.sound.silence, restore: $t.tour.sound.restore }}
    loadingLabel={$t.tour.loading}
    unsupportedLabel={$t.tour.unsupported}
  />

  <div
    class="pointer-events-auto absolute bottom-0 left-0 right-0 z-50 flex flex-col gap-4 bg-black/80 p-4 text-white backdrop-blur-sm"
  >
    <label class="flex min-w-0 items-center gap-3 text-sm">
      <span class="shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
        {$t.reconstruction.chooseScene}
      </span>
      <select
        aria-label={$t.reconstruction.chooseScene}
        value={currentIndex}
        disabled={chronologicalEvents.length === 0}
        onchange={(event) => chooseScene(Number(event.currentTarget.value))}
        class="min-w-0 flex-1 truncate border border-white/20 bg-black/80 px-3 py-2 text-sm text-white outline-none focus:border-white/60 disabled:opacity-30"
      >
        {#each chronologicalEvents as scene, index (scene.event.id)}
          <option value={index}>
            {$t.reconstruction.sceneLabel(scene.chapter.number, scene.event.title, index + 1)}
          </option>
        {/each}
      </select>
    </label>

    <section aria-labelledby="scene-cast" class="flex min-w-0 items-start gap-3 text-sm">
      <h2
        id="scene-cast"
        class="shrink-0 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55"
      >
        {$t.reconstruction.characters}
      </h2>
      {#if sceneCharacters.length}
        <div class="flex max-h-20 min-w-0 flex-1 flex-wrap gap-2 overflow-y-auto">
          {#each sceneCharacters as character (character.characterId)}
            <button
              type="button"
              disabled={!character.shown}
              title={character.shown
                ? $t.reconstruction.watchCharacter(character.name)
                : $t.reconstruction.unknownPosition}
              onclick={() => watchCharacter(character)}
              class="border border-white/20 bg-white/5 px-2.5 py-1.5 text-left text-xs text-white hover:border-white/60 hover:bg-white/10 disabled:cursor-default disabled:border-white/10 disabled:text-white/40"
            >
              <span>{character.name}</span>
              <span class="ml-1 text-[9px] uppercase tracking-wider text-white/40">
                {$t.reconstruction.roles[character.participationType]}
              </span>
            </button>
          {/each}
        </div>
      {:else}
        <p class="pt-1.5 text-xs text-white/40">{$t.reconstruction.noCharacters}</p>
      {/if}
    </section>

    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <button
          aria-label={$t.reconstruction.previous}
          disabled={currentIndex === 0}
          onclick={() => chooseScene(Math.max(0, currentIndex - 1))}
          class="p-2 hover:text-white/80 disabled:opacity-30">⏮</button
        >
        <button
          aria-label={isPlaying ? $t.reconstruction.pause : $t.reconstruction.play}
          disabled={chronologicalEvents.length < 2}
          onclick={togglePlay}
          class="p-2 text-xl hover:text-white/80 disabled:opacity-30"
          >{isPlaying ? '⏸' : '▶'}</button
        >
        <button
          aria-label={$t.reconstruction.next}
          disabled={currentIndex >= chronologicalEvents.length - 1}
          onclick={() => chooseScene(Math.min(chronologicalEvents.length - 1, currentIndex + 1))}
          class="p-2 hover:text-white/80 disabled:opacity-30">⏭</button
        >
      </div>

      <div class="flex-1 px-4 md:px-8">
        <input
          aria-label={$t.reconstruction.title}
          type="range"
          min="0"
          max={Math.max(0, chronologicalEvents.length - 1)}
          disabled={chronologicalEvents.length < 2}
          value={currentIndex}
          oninput={(event) => chooseScene(Number(event.currentTarget.value))}
          class="w-full accent-white disabled:opacity-30"
        />
      </div>

      <div class="max-w-sm text-right text-sm">
        {#if chronologicalEvents[currentIndex]}
          <p class="font-bold">
            {$t.common.chapterShort(chronologicalEvents[currentIndex].chapter.number)} ·
            {$t.reconstruction.visible(extras.length)}
          </p>
          <p class="truncate text-white/70">{chronologicalEvents[currentIndex].event.summary}</p>
        {:else}
          <p class="text-white/70">{$t.reconstruction.empty}</p>
        {/if}
      </div>
    </div>
  </div>
</div>
