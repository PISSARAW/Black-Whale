<script lang="ts">
  import KnowledgeStatus from './KnowledgeStatus.svelte'
  import type { KnowledgeVisualState } from './types'
  import { t } from '$lib/i18n'

  let {
    open,
    subject,
    displayedValue,
    source,
    observedAt,
    freshness,
    state,
    revealReality = false,
    canonicalValue = null,
    onClose,
  }: {
    open: boolean
    subject: string
    displayedValue: string
    source: string
    observedAt: string
    freshness: string
    state: KnowledgeVisualState
    revealReality?: boolean
    canonicalValue?: string | null
    onClose: () => void
  } = $props()
</script>

{#if open}
  <div class="why" role="dialog" aria-label={$t.perspectiveUi.whyLabel} aria-modal="false">
    <header>
      <h3>{$t.perspectiveUi.whyTitle}</h3>
      <button type="button" onclick={onClose} aria-label={$t.common.close}>✕</button>
    </header>

    <dl>
      <div>
        <dt>{$t.perspectiveUi.character}</dt>
        <dd>{subject}</dd>
      </div>
      <div>
        <dt>{$t.perspectiveUi.displayedValue}</dt>
        <dd>{displayedValue}</dd>
      </div>
      <div>
        <dt>{$t.perspectiveUi.source}</dt>
        <dd>{source}</dd>
      </div>
      <div>
        <dt>{$t.perspectiveUi.observation}</dt>
        <dd>{observedAt}</dd>
      </div>
      <div>
        <dt>{$t.perspectiveUi.freshness}</dt>
        <dd>{freshness}</dd>
      </div>
    </dl>

    <KnowledgeStatus {state} label={$t.perspectiveUi.knowledgeStatus} details={source} />

    {#if revealReality}
      <div class="canon">
        <strong>{$t.perspectiveUi.canonicalReality}</strong>
        <span>{canonicalValue ?? $t.map.unknownPosition}</span>
      </div>
    {/if}
  </div>
{/if}

<style>
  .why {
    position: absolute;
    right: 1rem;
    top: 1rem;
    width: min(26rem, calc(100vw - 2rem));
    border: 1px solid var(--line);
    border-radius: 0.72rem;
    padding: 0.72rem;
    background: color-mix(in srgb, var(--panel) 88%, #09171b 12%);
    box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.3);
    z-index: 45;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 0.64rem;
  }

  h3 {
    margin: 0;
    font-size: 0.92rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  button {
    border: 1px solid var(--line);
    background: transparent;
    color: var(--ink);
    border-radius: 0.4rem;
    width: 1.9rem;
    height: 1.9rem;
    cursor: pointer;
  }

  dl {
    margin: 0 0 0.6rem 0;
    display: grid;
    gap: 0.36rem;
  }

  dt {
    color: color-mix(in srgb, var(--ink) 72%, #849793 28%);
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  dd {
    margin: 0.12rem 0 0;
    font-size: 0.85rem;
  }

  .canon {
    margin-top: 0.64rem;
    padding-top: 0.64rem;
    border-top: 1px dashed color-mix(in srgb, var(--line) 60%, #f6f3e6 30%);
    display: grid;
    gap: 0.2rem;
  }

  .canon strong {
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--ink) 68%, #8ca09f 32%);
  }
</style>
