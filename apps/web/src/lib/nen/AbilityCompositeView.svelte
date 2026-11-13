<script lang="ts">
  import type { AbilityViewModel } from './abilityPresentation'
  import type { AbilityViewFamily } from './abilityComponents'
  import { t } from '$lib/i18n'

  let {
    model,
    variant,
    family = 'target',
    accent = 'var(--accent-gold)',
  }: {
    model: AbilityViewModel
    variant: string
    family?: AbilityViewFamily
    accent?: string
  } = $props()
</script>

<section
  class="ability-view family-{family}"
  class:reduced={model.reducedMotion}
  data-component-key={variant}
  style:--view={accent}
  aria-label={`${model.name} — ${model.action.label}`}
>
  <div class="view-head">
    <span>{variant.replace(/([a-z])([A-Z])/g, '$1 $2')}</span>
    {#if model.preview}<small>{$t.abilities.preview}</small>{/if}
  </div>
  <div class="visual" aria-hidden="true">
    {#if family === 'gauge'}
      <i style:--fill={`${Math.min(100, 18 + model.plan.conditions.length * 14)}%`}></i>
    {:else if family === 'network'}
      <i></i><i></i><i></i>
    {:else if family === 'ledger'}
      <i></i><i></i><i></i><i></i>
    {:else if family === 'target'}
      <i></i>
    {:else if family === 'map'}
      <i></i><i></i><i></i>
    {:else if family === 'timeline'}
      <i></i><i></i><i></i><i></i>
    {:else if family === 'steps'}
      {#each model.plan.conditions as condition, index (`${condition.id}-${index}`)}<i
          data-status={condition.status}
        ></i>{/each}
    {/if}
  </div>
  <dl>
    <div>
      <dt>{$t.abilities.uses}</dt>
      <dd>{model.action.label}</dd>
    </div>
    <div>
      <dt>{$t.abilities.targets}</dt>
      <dd>{model.targets.join(' · ') || $t.nen.noTarget}</dd>
    </div>
    <div>
      <dt>{$t.abilities.effects}</dt>
      <dd>{model.effects.length}</dd>
    </div>
  </dl>
</section>

<style>
  .ability-view {
    display: grid;
    gap: 0.7rem;
    padding: 0.8rem;
    border: 1px solid var(--line-subtle);
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--surface-void) 72%, transparent);
    overflow: hidden;
  }
  .view-head {
    display: flex;
    justify-content: space-between;
    gap: 0.8rem;
    color: var(--view);
    font: 600 0.62rem/1 var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .view-head small {
    color: var(--text-muted);
    font-size: 0.52rem;
  }
  .visual {
    position: relative;
    display: flex;
    min-height: 2.6rem;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    border-radius: 0.3rem;
    background: color-mix(in srgb, var(--view) 7%, transparent);
  }
  .visual i {
    display: block;
    width: 0.65rem;
    height: 0.65rem;
    border: 1px solid var(--view);
    border-radius: 50%;
    box-shadow: 0 0 12px color-mix(in srgb, var(--view) 35%, transparent);
    animation: pulse 1.8s ease-in-out infinite alternate;
  }
  .family-gauge .visual {
    justify-content: flex-start;
    min-height: 0.55rem;
    background: var(--line-subtle);
  }
  .family-gauge .visual i {
    width: var(--fill);
    height: 0.55rem;
    border: 0;
    border-radius: 0.2rem;
    background: var(--view);
    box-shadow: none;
  }
  .family-ledger .visual {
    align-items: stretch;
    padding: 0.45rem;
  }
  .family-ledger .visual i {
    width: 22%;
    height: auto;
    border-radius: 0.15rem;
    box-shadow: none;
  }
  .family-network .visual i:nth-child(2) {
    transform: scale(1.4);
  }
  .family-target .visual i {
    width: 2rem;
    height: 2rem;
    border-color: transparent var(--view) var(--view) transparent;
  }
  .family-map .visual {
    align-items: stretch;
    justify-content: stretch;
    background-image:
      linear-gradient(var(--line-subtle) 1px, transparent 1px),
      linear-gradient(90deg, var(--line-subtle) 1px, transparent 1px);
    background-size: 0.8rem 0.8rem;
  }
  .family-map .visual i {
    position: absolute;
    width: 0.45rem;
    height: 0.45rem;
  }
  .family-map .visual i:nth-child(1) {
    left: 20%;
    top: 55%;
  }
  .family-map .visual i:nth-child(2) {
    left: 52%;
    top: 25%;
  }
  .family-map .visual i:nth-child(3) {
    right: 15%;
    bottom: 18%;
  }
  .family-timeline .visual::before {
    position: absolute;
    right: 12%;
    left: 12%;
    height: 1px;
    background: var(--view);
    content: '';
    opacity: 0.45;
  }
  .family-timeline .visual i {
    z-index: 1;
    width: 0.48rem;
    height: 0.48rem;
    background: var(--surface-void);
  }
  .family-steps .visual {
    justify-content: flex-start;
    padding: 0.5rem;
  }
  .family-steps .visual i {
    width: 0.8rem;
    height: 0.2rem;
    border: 0;
    border-radius: 0.1rem;
    background: #6fbf8b;
    box-shadow: none;
  }
  .family-steps .visual i[data-status='UNMET'] {
    background: #ff8b8b;
  }
  .family-steps .visual i[data-status='UNKNOWN'] {
    background: var(--text-muted);
  }
  dl {
    display: grid;
    gap: 0.3rem;
    margin: 0;
    font-size: 0.65rem;
  }
  dl div {
    display: grid;
    grid-template-columns: 4rem 1fr;
    gap: 0.5rem;
  }
  dt {
    color: var(--text-muted);
  }
  dd {
    margin: 0;
    color: var(--text-secondary);
  }
  .reduced .visual i {
    animation: none;
  }
  @keyframes pulse {
    to {
      opacity: 0.45;
      transform: scale(0.86);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .visual i {
      animation: none;
    }
  }
</style>
