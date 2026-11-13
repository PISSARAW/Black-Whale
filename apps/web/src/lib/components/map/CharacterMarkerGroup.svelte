<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte'
  import { t } from '$lib/i18n'
  import type { MarkerGroup } from './markerGroups'
  import { markerInitials } from './markerGroups'

  let {
    group,
    compact = false,
    offsetBelowLabel = false,
  }: { group: MarkerGroup; compact?: boolean; offsetBelowLabel?: boolean } = $props()
  let open = $state(false)
  let label = $derived(
    group.markers.length > 1
      ? `×${group.markers.length}`
      : markerInitials(group.markers[0]?.perceivedIdentity || ''),
  )

  function show(marker: MarkerGroup['markers'][number]) {
    open = false
    mapState.openExplainPanel({
      kind: 'character',
      subject: marker.perceivedIdentity,
      location: marker.locationLabel || $t.perspectiveUi.unspecifiedLocation,
      tier: marker.tierLabel || $t.perspectiveUi.outsideTier,
      certainty: marker.certainty || 'UNKNOWN',
      temporalLabel: marker.temporalLabel || $t.perspectiveUi.unknownStatus,
      source: marker.sourceLabel || $t.mapUi.directObservation,
      observedAt: marker.temporalDetail || marker.sinceLabel || '—',
      knowledgeState: marker.knowledgeState,
      profileSlug: marker.profileSlug,
    })
  }

  function activate() {
    if (group.markers.length === 1 && group.markers[0]) show(group.markers[0])
    else open = !open
  }
</script>

<div
  class="marker-group"
  class:compact
  class:offset-below-label={offsetBelowLabel}
  style={`left:${group.x}%;top:${group.y}%;--marker-color:${group.color};`}
>
  <button
    type="button"
    class="group-badge"
    aria-expanded={group.markers.length > 1 ? open : undefined}
    aria-label={$t.mapUi.presenceGroup(group.markers.length, group.markers[0]?.locationLabel || '')}
    onclick={activate}>{label}</button
  >
  {#if open}
    <section class="group-list" aria-label={$t.mapUi.presenceList}>
      <header>
        <strong>{group.markers[0]?.locationLabel}</strong>
        <button type="button" aria-label={$t.common.close} onclick={() => (open = false)}>×</button>
      </header>
      {#each group.markers as marker (marker.id)}
        <button type="button" class="person" onclick={() => show(marker)}>
          <span>{markerInitials(marker.perceivedIdentity)}</span>
          <span
            ><strong>{marker.perceivedIdentity}</strong><small>{marker.temporalLabel}</small></span
          >
        </button>
      {/each}
    </section>
  {/if}
</div>

<style>
  .marker-group {
    position: absolute;
    z-index: 8;
    transform: translate(-50%, -50%);
    pointer-events: auto;
  }
  .marker-group.offset-below-label {
    transform: translate(
      calc(-50% + var(--marker-nudge-x, 0px)),
      calc(-50% + var(--marker-nudge-y, 0px))
    );
  }
  .group-badge {
    display: grid;
    min-width: 1.55rem;
    height: 1.55rem;
    place-items: center;
    border: 2px solid #071015;
    border-radius: 999px;
    padding-inline: 0.3rem;
    background: var(--marker-color);
    color: #071015;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--marker-color) 75%, white);
    font: 700 0.55rem/1 var(--font-mono);
    cursor: pointer;
  }
  .compact .group-badge {
    min-width: 1.35rem;
    height: 1.35rem;
    font-size: 0.5rem;
  }
  .group-badge:focus-visible {
    outline: 2px solid var(--accent-gold-bright);
    outline-offset: 3px;
  }
  .group-list {
    position: absolute;
    z-index: 30;
    bottom: calc(100% + 0.55rem);
    left: 50%;
    width: min(18rem, calc(100vw - 2rem));
    max-height: 16rem;
    overflow-y: auto;
    border: 1px solid var(--line-strong);
    border-radius: 0.55rem;
    padding: 0.45rem;
    background: var(--surface-panel);
    box-shadow: 0 14px 35px rgba(0, 0, 0, 0.45);
    transform: translateX(-50%);
  }
  .group-list header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.2rem 0.3rem 0.45rem;
    color: var(--text-primary);
  }
  .group-list header button {
    width: 2rem;
    height: 2rem;
    border: 0;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
  }
  .person {
    display: flex;
    width: 100%;
    min-height: 44px;
    align-items: center;
    gap: 0.6rem;
    border: 0;
    border-top: 1px solid var(--line);
    padding: 0.4rem;
    background: transparent;
    color: var(--text-secondary);
    text-align: left;
    cursor: pointer;
  }
  .person > span:first-child {
    display: grid;
    width: 1.6rem;
    height: 1.6rem;
    place-items: center;
    border-radius: 50%;
    background: var(--surface-raised);
    color: var(--accent-gold-bright);
    font: 700 0.55rem var(--font-mono);
  }
  .person > span:last-child {
    display: grid;
    gap: 0.1rem;
  }
  .person strong {
    color: var(--text-primary);
    font-size: 0.72rem;
  }
  .person small {
    color: var(--text-muted);
    font-size: 0.58rem;
  }
  .person:hover {
    background: var(--surface-raised);
  }
</style>
