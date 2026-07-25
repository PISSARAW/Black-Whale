<script lang="ts">
  let {
    label,
    value,
    anomaly = false,
    subtle = false
  }: {
    label: string;
    value: string;
    anomaly?: boolean;
    subtle?: boolean;
  } = $props();
</script>

<div class:identity-badge={true} class:anomaly class:subtle>
  <span class="label">{label}</span>
  <span class="value">{value}</span>
</div>

<style>
  .identity-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: 1px solid color-mix(in srgb, var(--state-known) 50%, #f7f5ea 10%);
    border-radius: 999px;
    padding: 0.24rem 0.62rem;
    background: color-mix(in srgb, var(--panel) 70%, #0b2020 30%);
    font-size: 0.74rem;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .identity-badge .label {
    color: color-mix(in srgb, var(--ink) 70%, #9faba2 30%);
    text-transform: uppercase;
    font-weight: 600;
  }

  .identity-badge .value {
    color: var(--ink);
    font-weight: 700;
  }

  .identity-badge.anomaly {
    border-style: dashed;
    border-color: var(--state-transferred);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--state-transferred) 45%, transparent);
  }

  .identity-badge.anomaly .value::before {
    content: '◉';
    margin-right: 0.32rem;
    color: var(--state-transferred);
  }

  .identity-badge.subtle {
    opacity: 0.8;
  }
</style>
