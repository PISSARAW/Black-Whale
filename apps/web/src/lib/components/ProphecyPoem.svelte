<script lang="ts">
  import { t } from '$lib/i18n'

  /**
   * A Lovely Ghostwriter sheet.
   *
   * The ability left Skill Hunter before the Black Whale sailed, so no such
   * sheet exists in canon: every record in data/prophecies is `apocryphal` and
   * the card says so rather than letting a poem pass for a source.
   *
   * The gloss stays collapsed. A prophecy carries no chapter anchor, so the
   * spoiler filter cannot reason about it — the reader opens it deliberately.
   */
  interface Prophecy {
    id: string
    subjectId: string
    subjectName: string
    desire: string
    poem: string[]
    blank?: boolean
    reading: string
    foretells: string
    horizon: string
    canonStatus: string
  }

  let { prophecy }: { prophecy: Prophecy } = $props()
</script>

<article class="sheet">
  <header>
    <p class="sheet-code">{$t.prophecy.sheetCode}</p>
    <dl>
      <div>
        <dt>{$t.prophecy.covers}</dt>
        <dd>{prophecy.horizon}</dd>
      </div>
      <div>
        <dt>{$t.prophecy.foretells}</dt>
        <dd>{prophecy.foretells}</dd>
      </div>
    </dl>
  </header>

  <p class="desire"><span>{$t.prophecy.desireLabel}</span>{prophecy.desire}</p>

  {#if prophecy.blank}
    <p class="unwritten">{$t.prophecy.unwritten}</p>
  {:else}
    <blockquote>
      {#each prophecy.poem as line, lineIndex (lineIndex)}<span>{line}</span>{/each}
    </blockquote>
  {/if}

  <details>
    <summary>{$t.prophecy.glossSummary}</summary>
    <p>{prophecy.reading}</p>
  </details>

  <footer>{$t.prophecy.footer}</footer>
</article>

<style>
  .sheet {
    display: grid;
    gap: 1.5rem;
    padding: clamp(1.4rem, 3vw, 2.4rem);
    border: 1px solid var(--line-default);
    border-left: 2px solid var(--accent-gold);
    background:
      radial-gradient(circle at 12% 0%, rgba(200, 169, 86, 0.07), transparent 45%),
      linear-gradient(160deg, rgba(23, 38, 45, 0.5), transparent);
  }
  header {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 2.5rem;
    align-items: baseline;
    justify-content: space-between;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--line-subtle);
  }
  .sheet-code {
    margin: 0;
    color: var(--accent-gold);
    font: 0.5rem/1 var(--font-mono);
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  header dl {
    display: flex;
    gap: 2rem;
    margin: 0;
  }
  header dt {
    color: var(--text-faint);
    font: 0.45rem/1.6 var(--font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  header dd {
    margin: 0;
    color: var(--text-secondary);
    font: 0.6rem/1.4 var(--font-mono);
  }
  .desire {
    display: grid;
    gap: 0.4rem;
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.86rem;
    line-height: 1.6;
  }
  .desire span {
    color: var(--text-faint);
    font: 0.45rem/1 var(--font-mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  blockquote {
    display: grid;
    gap: 0.7rem;
    margin: 0;
    padding-left: clamp(0.75rem, 2vw, 1.75rem);
    border-left: 1px solid rgba(200, 169, 86, 0.32);
  }
  blockquote span {
    color: var(--text-primary);
    font: 400 clamp(1rem, 1.9vw, 1.28rem)/1.5 var(--font-display);
    font-style: italic;
    letter-spacing: -0.01em;
    text-wrap: balance;
  }
  .unwritten {
    margin: 0;
    padding-left: clamp(0.75rem, 2vw, 1.75rem);
    border-left: 1px dashed rgba(200, 169, 86, 0.32);
    color: var(--text-faint);
    font: 400 clamp(0.95rem, 1.7vw, 1.15rem)/1.55 var(--font-display);
    font-style: italic;
  }
  details summary {
    color: var(--text-secondary);
    cursor: pointer;
    font: 0.55rem/1.6 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  details summary:hover {
    color: var(--accent-gold-bright);
  }
  details p {
    margin: 0.9rem 0 0;
    padding-left: 1rem;
    border-left: 1px solid var(--line-subtle);
    color: var(--text-secondary);
    font-size: 0.82rem;
    line-height: 1.7;
  }
  footer {
    padding-top: 1rem;
    border-top: 1px solid var(--line-subtle);
    color: var(--text-faint);
    font: 0.5rem/1.7 var(--font-mono);
    letter-spacing: 0.05em;
  }
</style>
