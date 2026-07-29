<script lang="ts">
  import { t } from '$lib/i18n'

  let {
    lastConfirmed,
  }: {
    lastConfirmed: string
  } = $props()
</script>

<div class="stale" role="status" aria-label={$t.perspectiveUi.staleAria(lastConfirmed)}>
  <span aria-hidden="true">⏱</span>
  {$t.perspectiveUi.staleLabel(lastConfirmed)}
</div>

<style>
  .stale {
    display: inline-flex;
    align-items: center;
    gap: 0.42rem;
    border: 1px dotted var(--state-outdated);
    color: color-mix(in srgb, var(--ink) 75%, var(--state-outdated) 25%);
    background: color-mix(in srgb, var(--panel) 84%, var(--state-outdated) 16%);
    border-radius: 0.5rem;
    padding: 0.24rem 0.5rem;
    font-size: 0.74rem;
  }
</style>
