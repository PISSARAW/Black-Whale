<script lang="ts">
  import IdentityBadge from './IdentityBadge.svelte';
  import type { PerspectiveContext } from './types';

  let {
    context,
    modeLabel
  }: {
    context: PerspectiveContext;
    modeLabel: string;
  } = $props();
</script>

<header class="context-bar" aria-label="Contexte de perspective">
  <div class="meta">
    <span>Ch. {context.chapter}</span>
    <span>Ev. {context.eventLabel}</span>
    <span>Spoilers &lt;= {context.spoilerLimit ?? 'all'}</span>
  </div>

  <div class="identities">
    <IdentityBadge label="Perspective" value={context.perspectiveName} anomaly={context.hasAnomaly} />
    <IdentityBadge label="Consciousness" value={context.followedConsciousness} anomaly={context.hasAnomaly} />
    <IdentityBadge label="Body" value={context.occupiedBody} anomaly={context.hasAnomaly} />
    <IdentityBadge label="Apparence" value={context.apparentIdentity} anomaly={context.hasAnomaly} subtle={!context.hasAnomaly} />
  </div>

  <div class="mode">
    <span>Mode :</span>
    <strong>{modeLabel}</strong>
  </div>
</header>

<style>
  .context-bar {
    display: grid;
    grid-template-columns: 1.2fr 2fr 1fr;
    gap: 0.9rem;
    align-items: center;
    padding: 0.6rem 1rem;
    border: 1px solid var(--line);
    background:
      linear-gradient(110deg, color-mix(in srgb, var(--panel) 84%, #102220 16%), color-mix(in srgb, var(--panel) 90%, #0a1115 10%));
    border-radius: 0.72rem;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    color: color-mix(in srgb, var(--ink) 68%, #8ca8a1 32%);
    font-size: 0.78rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .identities {
    display: flex;
    flex-wrap: wrap;
    gap: 0.44rem;
    justify-content: center;
  }

  .mode {
    justify-self: end;
    display: inline-flex;
    align-items: center;
    gap: 0.42rem;
    font-size: 0.8rem;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--ink) 75%, #8ba09f 25%);
  }

  .mode strong {
    color: var(--ink);
    letter-spacing: 0.03em;
  }

  @media (max-width: 1040px) {
    .context-bar {
      grid-template-columns: 1fr;
      gap: 0.56rem;
    }

    .mode {
      justify-self: start;
    }
  }
</style>
