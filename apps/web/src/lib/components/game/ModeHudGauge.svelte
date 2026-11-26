<script lang="ts">
  import './mode-hud.css'

  interface Props {
    label: string
    value: number
    max?: number
    percent?: boolean
    tone?: 'danger' | 'success'
    kind?: 'meter' | 'progressbar'
  }

  let { label, value, max = 100, percent = false, tone, kind = 'meter' }: Props = $props()
  const bounded = $derived(Math.min(max, Math.max(0, value)))
  const width = $derived(max > 0 ? (bounded / max) * 100 : 0)
  const readout = $derived(percent ? `${Math.round(width)}%` : `${Math.round(value)} / ${max}`)
</script>

<div
  class="gauge"
  data-tone={tone}
  role={kind}
  aria-label={label}
  aria-valuemin={0}
  aria-valuemax={max}
  aria-valuenow={bounded}
  aria-valuetext={readout}
>
  <div class="readout" aria-hidden="true">
    <span class="mode-hud-label">{label}</span>
    <strong class="mode-hud-value">{readout}</strong>
  </div>
  <div class="track" aria-hidden="true"><span style:width={`${width}%`}></span></div>
</div>

<style>
  .gauge {
    --gauge-color: var(--mode-accent, #8ad7e7);
    min-width: 0;
  }
  .gauge[data-tone='danger'] {
    --gauge-color: #ff8190;
  }
  .gauge[data-tone='success'] {
    --gauge-color: #8be6af;
  }
  .readout {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.2rem 0.55rem;
    margin-bottom: 0.25rem;
  }
  .readout strong {
    color: var(--gauge-color);
    white-space: nowrap;
  }
  .track {
    overflow: hidden;
    height: 0.45rem;
    border: 1px solid #435665;
    background: #061018;
  }
  .track span {
    display: block;
    height: 100%;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--gauge-color) 58%, #163045),
      var(--gauge-color)
    );
    transition: width 150ms ease-out;
  }
  @media (prefers-reduced-motion: reduce) {
    .track span {
      transition: none;
    }
  }
</style>
