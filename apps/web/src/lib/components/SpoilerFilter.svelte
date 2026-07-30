<script lang="ts">
  import { page } from '$app/stores'
  import { t } from '$lib/i18n'

  let {
    limit,
    chapters,
    compact = false,
  }: {
    limit: number | null
    chapters: { first: number; last: number } | null
    compact?: boolean
  } = $props()

  // A plain form posting to /spoiler-limit: the cap is a cookie every loader
  // reads on the server, so it has to be set by a request, and doing it this way
  // keeps the control working with JavaScript off. The action is deliberately
  // unprefixed — it is an endpoint, not a localized page — and the locale rides
  // back on `redirectTo`.
  let redirectTo = $derived(`${$page.url.pathname}${$page.url.search}`)

  let summary = $derived(
    limit === null ? $t.layout.spoiler.summaryFull : $t.layout.spoiler.summaryLimited(limit),
  )
</script>

<details class="spoiler-filter" class:compact>
  <summary aria-label={$t.layout.spoiler.label} title={$t.layout.spoiler.intro}>
    <i class="dot" class:capped={limit !== null} aria-hidden="true"></i>
    <span>{summary}</span>
  </summary>

  <form class="panel" method="POST" action="/spoiler-limit">
    <input type="hidden" name="redirectTo" value={redirectTo} />

    <p class="intro">{$t.layout.spoiler.intro}</p>

    <label>
      <span>{$t.layout.spoiler.chapterField}</span>
      <input
        type="number"
        name="chapter"
        inputmode="numeric"
        step="1"
        min={chapters?.first ?? 0}
        max={chapters?.last}
        value={limit ?? ''}
        placeholder={String(chapters?.last ?? '')}
      />
    </label>

    {#if chapters}
      <small>{$t.layout.spoiler.rangeHint(chapters.first, chapters.last)}</small>
    {/if}

    <div class="actions">
      <button type="submit">{$t.layout.spoiler.apply}</button>
      <button type="submit" name="intent" value="clear" class="ghost" disabled={limit === null}>
        {$t.layout.spoiler.clear}
      </button>
    </div>
  </form>
</details>

<style>
  .spoiler-filter {
    position: relative;
  }

  summary {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.45rem;
    border-radius: 0.3rem;
    color: var(--text-faint);
    cursor: pointer;
    font: inherit;
    letter-spacing: inherit;
    list-style: none;
    text-transform: uppercase;
    white-space: nowrap;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary:hover,
  details[open] summary {
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-primary);
  }

  .dot {
    width: 0.35rem;
    height: 0.35rem;
    flex: none;
    border: 1px solid currentColor;
    border-radius: 50%;
  }

  .dot.capped {
    border-color: var(--accent-gold);
    background: var(--accent-gold);
    box-shadow: 0 0 8px var(--accent-gold-glow);
  }

  .panel {
    position: absolute;
    z-index: 90;
    top: calc(100% + 0.45rem);
    right: 0;
    display: grid;
    width: 17rem;
    gap: 0.6rem;
    border: 1px solid var(--line-default);
    border-radius: var(--radius-sm);
    background: linear-gradient(150deg, rgba(19, 30, 40, 0.98), rgba(7, 10, 12, 0.99));
    box-shadow: 0 22px 50px rgba(0, 0, 0, 0.45);
    padding: 0.85rem 0.9rem;
    text-transform: none;
  }

  .intro {
    margin: 0;
    color: var(--text-muted);
    font-family: var(--font-body, inherit);
    font-size: 0.72rem;
    letter-spacing: 0;
    line-height: 1.45;
  }

  label {
    display: grid;
    gap: 0.3rem;
  }

  label span {
    color: var(--accent-gold);
    font-size: 0.52rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  input[type='number'] {
    min-height: 2.25rem;
    padding: 0 0.55rem;
    border: 1px solid var(--line-default);
    border-radius: var(--radius-sm);
    background: rgba(0, 0, 0, 0.35);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 0.85rem;
    letter-spacing: 0.04em;
  }

  small {
    color: var(--text-faint);
    font-size: 0.52rem;
    letter-spacing: 0.12em;
  }

  .actions {
    display: flex;
    gap: 0.4rem;
  }

  .actions button {
    flex: 1;
    min-height: 2.25rem;
    border: 1px solid var(--line-default);
    border-radius: var(--radius-sm);
    background: var(--accent-gold-glow);
    color: var(--accent-gold-bright);
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.56rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .actions button:hover {
    border-color: var(--line-strong);
    color: var(--text-primary);
  }

  .actions .ghost {
    background: transparent;
    color: var(--text-muted);
  }

  .actions .ghost:disabled {
    color: var(--text-faint);
    cursor: default;
    opacity: 0.5;
  }

  /* In the mobile drawer and on the map toolbar the panel has no header row to
     hang from, so it opens inline instead of over the page. */
  .compact .panel {
    position: static;
    width: auto;
    box-shadow: none;
  }

  .compact summary {
    min-height: 2.75rem;
    padding-inline: 0.6rem;
    border: 1px solid var(--line-subtle);
  }
</style>
