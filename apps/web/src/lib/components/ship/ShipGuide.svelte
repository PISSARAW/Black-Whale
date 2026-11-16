<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte'
  import { t } from '$lib/i18n'
  import SpoilerFilter from '$lib/components/SpoilerFilter.svelte'
  import type { PageData } from '../../../routes/ship/$types'

  let { data }: { data: PageData } = $props()
  let profiles = $derived(
    $t.ship.tiers as Record<
      string,
      { report: string; signal: string; anomaly: string; title: string }
    >,
  )
  let profile = $derived(profiles[mapState.selectedTier || 'overview'])
  let unknownCount = $derived.by(() => {
    const locations = new Map(
      (data.locations || data.worldState.locations || []).map((location) => [
        location.id,
        location,
      ]),
    )
    return data.worldState.presences.filter((presence) => {
      const location = presence.locationId ? locations.get(presence.locationId) : null
      return !location || location.type === 'UNKNOWN'
    }).length
  })
  let legend = $derived([
    { label: $t.ship.legend.currentEvent, color: '#55d1e2' },
    { label: $t.ship.legend.confirmedPeriod, color: '#ad8bea' },
    { label: $t.ship.legend.currentChapter, color: '#6ac890' },
    { label: $t.ship.legend.confirmed, color: '#5bb9ad' },
    { label: $t.ship.legend.assumed, color: '#f0b75e' },
    { label: $t.ship.legend.lastKnown, color: '#e47f61' },
    { label: $t.ship.legend.unknown, color: '#8a9798' },
  ])
</script>

<p class="help">{$t.ship.workspace.mapHelp}</p>
<section>
  <h3>{$t.ship.mapLegend}</h3>
  <ul aria-label={$t.ship.legendLabel}>
    {#each legend as status (status.label)}
      <li><i style={`--status-color:${status.color}`}></i>{status.label}</li>
    {/each}
  </ul>
  <button
    aria-pressed={mapState.filters.showUnknownPositions}
    onclick={() => (mapState.filters.showUnknownPositions = !mapState.filters.showUnknownPositions)}
  >
    {$t.ship.unknownPositions(unknownCount)}
  </button>
</section>
<section>
  <SpoilerFilter compact limit={data.spoilerLimit ?? null} chapters={data.spoilerFilter.chapters} />
</section>
<details>
  <summary>{$t.ship.workspace.deckContext}</summary>
  <h3>{profile.title}</h3>
  <p>{profile.report}</p>
  <p>{profile.signal}</p>
  <p><strong>{$t.ship.unverified}</strong> · {profile.anomaly}</p>
</details>

<style>
  .help {
    margin-top: 0;
  }
  p {
    color: var(--text-muted);
    font-size: 0.75rem;
    line-height: 1.7;
  }
  h3 {
    margin: 0 0 0.8rem;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-primary);
  }
  section {
    padding-block: 1.25rem;
    border-bottom: 1px solid var(--line);
  }
  ul {
    display: grid;
    gap: 0.75rem;
    padding: 0;
    margin: 0;
    list-style: none;
  }
  li {
    display: flex;
    gap: 0.65rem;
    align-items: center;
    color: var(--text-secondary);
    font-size: 0.75rem;
  }
  i {
    width: 0.55rem;
    height: 0.55rem;
    border: 1px solid var(--status-color);
    border-radius: 50%;
    background: color-mix(in srgb, var(--status-color) 35%, transparent);
  }
  button {
    width: 100%;
    min-height: 44px;
    margin-top: 1.25rem;
    padding: 0.6rem;
    border: 1px solid var(--line);
    border-radius: 0.35rem;
    color: var(--text-secondary);
    background: transparent;
    font-size: 0.75rem;
    cursor: pointer;
  }
  button[aria-pressed='true'] {
    color: var(--accent-gold-bright);
    border-color: var(--accent-gold);
  }
  summary {
    padding-block: 1rem;
    color: var(--text-secondary);
    font-size: 0.8rem;
    cursor: pointer;
  }
  strong {
    font-weight: 500;
    color: var(--state-suspected);
  }
  button:focus-visible,
  summary:focus-visible {
    outline: 2px solid var(--accent-gold);
    outline-offset: 2px;
  }
</style>
