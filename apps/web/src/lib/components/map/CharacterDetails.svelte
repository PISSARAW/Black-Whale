<script lang="ts">
  import { link, t } from '$lib/i18n'
  import type { ExplainTarget } from '$lib/state/mapState.svelte'

  let {
    target,
    onClose,
  }: { target: Extract<ExplainTarget, { kind: 'character' }>; onClose: () => void } = $props()
  let certainty = $derived(
    ($t.mapUi.certainty as Record<string, string>)[target.certainty] || $t.mapUi.certainty.UNKNOWN,
  )
</script>

<aside class="character-card" aria-label={$t.mapUi.characterDetails}>
  <header>
    <div>
      <span>{$t.mapUi.presenceRecord}</span>
      <h2>{target.subject}</h2>
    </div>
    <button type="button" aria-label={$t.common.close} onclick={onClose}>×</button>
  </header>
  <dl>
    <div>
      <dt>{$t.mapUi.location}</dt>
      <dd>{target.location} · {target.tier}</dd>
    </div>
    <div>
      <dt>{$t.mapUi.certaintyLabel}</dt>
      <dd>{certainty}</dd>
    </div>
    <div>
      <dt>{$t.mapUi.temporalStatus}</dt>
      <dd>{target.temporalLabel}</dd>
    </div>
  </dl>
  {#if target.profileSlug}
    <a href={$link(`/characters/${target.profileSlug}`)}>{$t.mapUi.openCharacterProfile} →</a>
  {/if}
  <details>
    <summary>{$t.mapUi.provenance}</summary>
    <p>{target.source}</p>
    <small>{target.observedAt}</small>
  </details>
</aside>

<style>
  .character-card {
    position: absolute;
    z-index: 45;
    top: 1rem;
    right: 1rem;
    width: min(22rem, calc(100% - 2rem));
    border: 1px solid var(--line-strong);
    border-radius: 0.65rem;
    padding: 0.85rem;
    background: color-mix(in srgb, var(--surface-panel) 94%, transparent);
    color: var(--text-primary);
    box-shadow: 0 1rem 2.4rem rgba(0, 0, 0, 0.42);
    backdrop-filter: blur(12px);
  }
  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }
  header span,
  dt {
    color: var(--text-muted);
    font: 0.55rem var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  h2 {
    margin: 0.2rem 0 0;
    color: var(--accent-gold-bright);
    font-size: 1.05rem;
  }
  header button {
    width: 2.75rem;
    height: 2.75rem;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
  }
  dl {
    display: grid;
    gap: 0.5rem;
    margin: 0.9rem 0;
  }
  dl div {
    display: grid;
    grid-template-columns: 6.5rem 1fr;
    gap: 0.6rem;
  }
  dd {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.78rem;
  }
  a {
    display: block;
    border: 1px solid var(--line-strong);
    border-radius: 0.35rem;
    padding: 0.65rem;
    color: var(--accent-gold-bright);
    text-align: center;
    text-decoration: none;
    font-size: 0.72rem;
  }
  details {
    margin-top: 0.65rem;
    border-top: 1px solid var(--line);
    padding-top: 0.65rem;
  }
  summary {
    color: var(--text-muted);
    font-size: 0.68rem;
    cursor: pointer;
  }
  p,
  small {
    color: var(--text-muted);
    font-size: 0.65rem;
    line-height: 1.5;
  }
  @media (max-width: 600px) {
    .character-card {
      top: auto;
      right: 0;
      bottom: 0;
      width: 100%;
      border-radius: 0.65rem 0.65rem 0 0;
    }
  }
</style>
