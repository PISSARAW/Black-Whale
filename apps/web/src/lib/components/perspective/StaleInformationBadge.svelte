<script lang="ts">
  let {
    lastConfirmed
  }: {
    lastConfirmed: string;
  } = $props();
</script>

<div class="stale" role="status" aria-label={`Information outdated since ${lastConfirmed}`}>
  <span aria-hidden="true">⏱</span>
  Latest information: {lastConfirmed}
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
