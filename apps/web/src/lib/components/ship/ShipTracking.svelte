<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte'
  import { PUBLIC_FEATURES } from '$lib/config/features'
  import { link, t } from '$lib/i18n'
  import PerspectiveSelector from '$lib/components/perspective/PerspectiveSelector.svelte'
  import type { ShipController } from '../../../routes/ship/shipController.svelte'

  let { ship }: { ship: ShipController } = $props()
</script>

<label for="ship-tracking">{$t.ship.trackAria}</label>
<select
  id="ship-tracking"
  value={ship.trackingValue}
  onchange={(event) => ship.handleTrackingSelect(event.currentTarget.value)}
>
  <option value="reader">{$t.ship.readerView}</option>
  {#if PUBLIC_FEATURES.perspectives}
    <optgroup label={$t.ship.objectTracking.characters}>
      {#each ship.perspectiveOptions.filter((option) => option.kind === 'character') as option (option.id)}
        <option value={`character:${option.id}`}>{option.label}</option>
      {/each}
    </optgroup>
  {/if}
  <optgroup label={$t.ship.objectTracking.objects}>
    {#each ship.importantObjects as object (object.id)}
      <option value={`object:${object.id}`}>{object.canonicalName}</option>
    {/each}
  </optgroup>
</select>
{#if ship.trackedObject}
  <p class="object-location" aria-live="polite">
    {ship.trackedObject.location?.name || $t.ship.objectTracking.unknownPosition}
  </p>
{/if}

{#if PUBLIC_FEATURES.perspectives}
  <section>
    <h3>{$t.ship.pointOfView}</h3>
    <PerspectiveSelector
      options={ship.perspectiveOptions}
      selectedPerspective={mapState.selectedPerspectiveId}
      followMode={mapState.followMode}
      onPerspectiveSelect={ship.handlePerspectiveSelect}
      onFollowModeSelect={ship.handleFollowModeSelect}
    />
    <button
      class:active={mapState.compareWithReader}
      aria-pressed={mapState.compareWithReader}
      onclick={() => mapState.setCompareWithReader(!mapState.compareWithReader)}
    >
      {mapState.compareWithReader ? $t.ship.canonVisible : $t.ship.compareWithCanon}
    </button>
  </section>
{/if}
{#if PUBLIC_FEATURES.compare}
  <a href={$link('/compare')}>{$t.ship.comparePerspectives} ↗</a>
{/if}

<style>
  label,
  h3 {
    display: block;
    margin: 0 0 0.65rem;
    color: var(--text-primary);
    font-size: 0.8rem;
    font-weight: 500;
    line-height: 1.5;
  }
  select {
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 0.4rem;
    padding: 0.6rem;
    background: var(--surface-raised);
    color: var(--text-primary);
    font-size: 0.8rem;
  }
  .object-location {
    color: var(--accent-gold);
    font-size: 0.75rem;
    line-height: 1.5;
  }
  section {
    margin-top: 1.5rem;
  }
  button,
  a {
    display: block;
    width: 100%;
    min-height: 44px;
    margin-top: 0.8rem;
    padding: 0.6rem;
    border: 1px solid var(--line);
    border-radius: 0.35rem;
    color: var(--text-secondary);
    background: transparent;
    font-size: 0.75rem;
    text-align: center;
    cursor: pointer;
  }
  button.active {
    border-color: var(--accent-gold);
    color: var(--accent-gold-bright);
  }
  :global(.ship-panel .selector) {
    grid-template-columns: 1fr;
  }
  select:focus-visible,
  button:focus-visible,
  a:focus-visible {
    outline: 2px solid var(--accent-gold);
    outline-offset: 2px;
  }
</style>
