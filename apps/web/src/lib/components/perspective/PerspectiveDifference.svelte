<script lang="ts">
  import { t } from '$lib/i18n'

  let {
    title,
    leftLabel,
    leftValue,
    rightLabel,
    rightValue,
    code,
  }: {
    title: string
    leftLabel: string
    leftValue: string
    rightLabel: string
    rightValue: string
    code: '=' | '←' | '→' | '≠' | '~' | '⏱'
  } = $props()
</script>

<article class="difference" data-code={code}>
  <header>
    <h3>{title}</h3>
    <span class="code" aria-label={$t.perspectiveUi.differenceType}>{code}</span>
  </header>
  <div class="columns">
    <p><strong>{leftLabel}:</strong> {leftValue}</p>
    <p><strong>{rightLabel}:</strong> {rightValue}</p>
  </div>
</article>

<style>
  .difference {
    border: 1px solid var(--line);
    border-radius: 0.65rem;
    padding: 0.72rem;
    background: color-mix(in srgb, var(--panel) 92%, #10131c 8%);
  }

  .difference[data-code='≠'] {
    border-style: dashed;
    border-color: var(--state-contradicted);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  h3 {
    margin: 0;
    font-size: 0.86rem;
  }

  .code {
    font-weight: 800;
    min-width: 2rem;
    text-align: center;
    border: 1px solid color-mix(in srgb, var(--line) 75%, #f8f3dd 25%);
    border-radius: 999px;
    padding: 0.1rem 0.45rem;
  }

  .columns {
    display: grid;
    gap: 0.35rem;
  }

  p {
    margin: 0;
    font-size: 0.8rem;
    color: color-mix(in srgb, var(--ink) 76%, #889b97 24%);
  }

  strong {
    color: var(--ink);
  }
</style>
