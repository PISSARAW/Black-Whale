<script lang="ts">
  import { t } from '$lib/i18n'
  import { onMount } from 'svelte'
  import { crossingsOn, type Crossing, type Ship, type TierPlan } from '$lib/tour/blueprint'
  import type { Space, Tier, Vec2 } from '$lib/tour/types'
  import TourPlanViewport from './TourPlanViewport.svelte'
  import { tourWords } from '$lib/tour/workspaceWords'
  import { matchesTerms, searchTerms } from '$lib/tour/search'

  interface Props {
    dialog?: HTMLDialogElement | null
    ship: Ship
    plan: TierPlan
    position: Vec2
    heading: number
    currentSpaceId: string | null
    spoken: string | null
    crossings: Crossing[]
    crossingLabel: (crossing: Crossing) => string
    nameOf: (entity: Space | Tier | undefined) => string
    selectLabel: (room: string) => string
    aiming: boolean
    onClose: () => void
    onSelect: (space: Space) => void
  }

  let {
    dialog = $bindable(null),
    ship,
    plan,
    position,
    heading,
    currentSpaceId,
    spoken,
    crossings,
    crossingLabel,
    nameOf,
    selectLabel,
    aiming,
    onClose,
    onSelect,
  }: Props = $props()

  let roomsOpen = $state(false)
  onMount(() => {
    roomsOpen = window.matchMedia('(min-width: 761px)').matches
  })

  let displayedTier = $state<string | null>(null)
  let query = $state('')
  const displayed = $derived(ship.plans.get(displayedTier ?? plan.tier.id) ?? plan)
  const isCurrent = $derived(displayed.tier.id === plan.tier.id)
  const displayedCrossings = $derived(crossingsOn(ship, displayed.tier.id))
  const rooms = $derived(
    displayed.spaces
      .filter((space) => matchesTerms(nameOf(space), searchTerms(query)))
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b))),
  )

  function close() {
    displayedTier = null
    query = ''
    onClose()
  }

  function browse(id: string) {
    displayedTier = id
    query = ''
  }

  function closeOnBackdrop(event: MouseEvent) {
    if (event.target === dialog) close()
  }

  function select(space: Space) {
    onSelect(space)
    close()
  }
</script>

<dialog
  data-hatsu-pass
  bind:this={dialog}
  aria-label={$tourWords.plans}
  onclose={close}
  onclick={closeOnBackdrop}
  class="plan-dialog"
>
  <div class="plan-shell">
    <header class="plan-header">
      <div>
        <h2 id="tour-plan-title">{$tourWords.plans}</h2>
        <p>{$tourWords.mapHint}</p>
      </div>
      <button type="button" onclick={close} class="close-button"
        >{$t.tour.plan.close} <span aria-hidden="true">×</span></button
      >
    </header>
    <div class="plan-toolbar">
      <label>
        <span class="sr-only">{$tourWords.level}</span>
        <select value={displayed.tier.id} onchange={(event) => browse(event.currentTarget.value)}>
          <optgroup label={$tourWords.decks}>
            {#each ship.decks as tier (tier.id)}<option value={tier.id}>{nameOf(tier)}</option
              >{/each}
          </optgroup>
          <optgroup label={$tourWords.interiors}>
            {#each ship.tiers.filter((tier) => tier.kind === 'interior') as tier (tier.id)}<option
                value={tier.id}>{nameOf(tier)}</option
              >{/each}
          </optgroup>
        </select>
      </label>
      <button type="button" onclick={() => browse(plan.tier.id)}
        >{$tourWords.returnToPosition}</button
      >
      {#if isCurrent}<span class="position-key"
          ><span aria-hidden="true">●</span> {$tourWords.current}</span
        >{/if}
    </div>
    <div class="plan-body">
      <div class="map-area">
        {#key displayed.tier.id}
          <TourPlanViewport
            plan={displayed}
            {position}
            {heading}
            crossings={isCurrent ? crossings : displayedCrossings}
            {crossingLabel}
            currentSpaceId={isCurrent ? currentSpaceId : null}
            showPosition={isCurrent}
            label={$t.tour.minimap(nameOf(displayed.tier))}
            {nameOf}
            onSelect={select}
            {selectLabel}
            {aiming}
          />
        {/key}
      </div>
      <details class="room-index" bind:open={roomsOpen}>
        <summary>{$tourWords.rooms} <span>{rooms.length}</span></summary>
        <label class="room-filter">
          <span class="sr-only">{$tourWords.searchRooms}</span>
          <input type="search" bind:value={query} placeholder={$tourWords.searchRooms} />
        </label>
        <ul>
          {#each rooms as room (room.id)}
            <li>
              <button
                type="button"
                onclick={() => select(room)}
                aria-label={selectLabel(nameOf(room))}
                aria-current={room.id === currentSpaceId ? 'location' : undefined}
              >
                <span>{nameOf(room)}</span><span aria-hidden="true"
                  >{room.id === currentSpaceId ? '●' : '→'}</span
                >
              </button>
            </li>
          {:else}<li class="no-rooms">{$tourWords.noRooms}</li>{/each}
        </ul>
      </details>
    </div>
    <footer>
      <details class="legend">
        <summary>{$t.tour.plan.legend}</summary>
        <p>
          — {$t.tour.plan.doorway} · ▲ {$t.tour.plan.up} · ▼ {$t.tour.plan.down} · ◈ {$t.tour.plan
            .across}
        </p>
      </details>
      {#if spoken}<p class="sr-only" aria-live="polite">{spoken}</p>{/if}
    </footer>
  </div>
</dialog>

<style>
  .plan-dialog {
    position: fixed;
    inset: 0;
    width: min(1600px, 96vw);
    height: 94dvh;
    max-width: none;
    max-height: none;
    margin: auto;
    padding: 0;
    border: 1px solid #474237;
    border-radius: 8px;
    color: var(--text-primary);
    background: #0c0d10;
    box-shadow: 0 20px 100px #0009;
  }
  .plan-dialog::backdrop {
    background: rgb(0 0 0 / 80%);
  }
  .plan-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1.1rem;
    gap: 0.8rem;
  }
  .plan-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 1rem;
  }
  h2 {
    font-size: 1.25rem;
    font-weight: 600;
  }
  .plan-header p {
    margin-top: 0.2rem;
    color: var(--text-muted);
    font-size: 0.8rem;
  }
  button,
  select,
  input {
    min-height: 44px;
    border: 1px solid var(--line-default);
    border-radius: 4px;
    padding: 0.55rem 0.75rem;
    font-size: 0.8rem;
    background: #16171b;
    color: var(--text-primary);
  }
  button:hover {
    border-color: var(--accent-gold-bright);
    color: var(--accent-gold-bright);
  }
  .close-button {
    flex-shrink: 0;
  }
  .close-button span {
    margin-left: 0.75rem;
  }
  .plan-toolbar {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }
  .plan-toolbar label {
    flex: 0 1 320px;
    min-width: 0;
  }
  select {
    width: 100%;
  }
  .position-key {
    margin-left: auto;
    color: var(--text-secondary);
    font-size: 0.7rem;
  }
  .position-key span {
    color: #fffff0;
    margin-right: 0.3rem;
  }
  .plan-body {
    display: flex;
    flex: 1;
    gap: 0.8rem;
    min-height: 0;
  }
  .map-area {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
  .room-index {
    flex: 0 0 250px;
    overflow-y: auto;
    border: 1px solid var(--line-default);
    border-radius: 5px;
    background: #111216;
  }
  summary {
    cursor: pointer;
    min-height: 44px;
    padding: 0.8rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  .room-index summary span {
    float: right;
    color: var(--text-muted);
  }
  .room-filter {
    display: block;
    padding: 0 0.6rem 0.6rem;
  }
  input {
    width: 100%;
  }
  ul {
    margin: 0;
    padding: 0 0.4rem 0.5rem;
    list-style: none;
  }
  li button {
    display: flex;
    width: 100%;
    justify-content: space-between;
    gap: 1rem;
    border: 0;
    background: transparent;
    text-align: left;
    line-height: 1.5;
  }
  li button[aria-current] {
    color: var(--accent-gold-bright);
    background: #262216;
  }
  li button span:last-child {
    color: var(--text-muted);
  }
  .no-rooms {
    padding: 1rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  footer {
    flex-shrink: 0;
  }
  .legend {
    font-size: 0.7rem;
    color: var(--text-muted);
  }
  .legend summary {
    min-height: 24px;
    padding: 0;
  }
  .legend p {
    padding-top: 0.3rem;
  }
  @media (min-width: 761px) {
    .room-index summary {
      list-style: none;
      cursor: default;
      pointer-events: none;
    }
  }
  @media (max-width: 760px) {
    .plan-dialog {
      width: 100%;
      height: 100dvh;
      border: 0;
      border-radius: 0;
    }
    .plan-shell {
      padding: 0.75rem;
      gap: 0.6rem;
    }
    .plan-header p {
      max-width: 28ch;
      font-size: 0.7rem;
    }
    .plan-header h2 {
      font-size: 1rem;
    }
    .plan-body {
      flex-direction: column;
    }
    .room-index {
      flex: 0 0 auto;
      max-height: 35dvh;
    }
    .map-area {
      flex: 1;
    }
    .position-key {
      display: none;
    }
    .plan-toolbar label {
      flex: 1;
    }
    .plan-toolbar button {
      white-space: nowrap;
    }
  }
</style>
