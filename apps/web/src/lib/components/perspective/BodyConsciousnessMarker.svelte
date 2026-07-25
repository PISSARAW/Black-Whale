<script lang="ts">
  import KnowledgeStatus from './KnowledgeStatus.svelte';
  import type { MarkerIdentityState } from './types';

  let {
    marker,
    compact = false,
    onExplain
  }: {
    marker: MarkerIdentityState;
    compact?: boolean;
    onExplain?: (marker: MarkerIdentityState) => void;
  } = $props();

  let styleString = $derived(`left: ${marker.x}px; top: ${marker.y}px;`);
  let hasAnomaly = $derived(marker.body !== marker.consciousness || marker.transferFlag);
</script>

<button
  type="button"
  class="subjective-marker"
  class:compact
  class:anomaly={hasAnomaly}
  style={styleString}
  style:transform="translate(-50%, -50%)"
  aria-label={`Corps ${marker.body}, conscience ${marker.consciousness}, identité perçue ${marker.perceivedIdentity}`}
  onclick={() => onExplain?.(marker)}
>
  <div class="head">
    <span class="name">{marker.perceivedIdentity}</span>
    {#if marker.suspicionLabel}
      <span class="suspicion">?</span>
    {/if}
  </div>

  {#if !compact}
    <div class="stack">
      <p><strong>Corps :</strong> {marker.body}</p>
      <p><strong>Conscience :</strong> {marker.consciousness}</p>
      {#if marker.appearance !== marker.body}
        <p><strong>Apparence :</strong> {marker.appearance}</p>
      {/if}
    </div>

    <KnowledgeStatus state={marker.knowledgeState} label="Statut" details={marker.sourceLabel || 'Source non précisée'} />
  {/if}

  {#if hasAnomaly}
    <span class="transfer" aria-hidden="true">Transfert</span>
  {/if}
</button>

<style>
  .subjective-marker {
    position: absolute;
    min-width: 7rem;
    max-width: 14rem;
    border: 1.8px solid color-mix(in srgb, var(--state-known) 42%, #f3efe2 22%);
    border-radius: 0.72rem;
    padding: 0.35rem 0.46rem;
    background: color-mix(in srgb, var(--panel) 80%, #132529 20%);
    color: var(--ink);
    text-align: left;
    display: grid;
    gap: 0.36rem;
    cursor: pointer;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.23);
  }

  .subjective-marker.compact {
    min-width: 3.4rem;
    max-width: 7rem;
    padding: 0.32rem;
  }

  .subjective-marker.anomaly {
    border-style: double;
    border-color: var(--state-transferred);
  }

  .subjective-marker:focus-visible {
    outline: 2px solid var(--state-known);
    outline-offset: 2px;
  }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .name {
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .suspicion {
    font-weight: 800;
    color: var(--state-suspected);
    font-size: 0.8rem;
  }

  .stack {
    display: grid;
    gap: 0.2rem;
    font-size: 0.68rem;
  }

  .stack p {
    margin: 0;
    color: color-mix(in srgb, var(--ink) 80%, #819796 20%);
  }

  .stack strong {
    color: var(--ink);
  }

  .transfer {
    justify-self: start;
    border: 1px dashed var(--state-transferred);
    border-radius: 999px;
    font-size: 0.64rem;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--state-transferred);
    padding: 0.1rem 0.4rem;
  }
</style>
