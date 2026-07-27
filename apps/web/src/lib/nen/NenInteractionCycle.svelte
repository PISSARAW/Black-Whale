<script lang="ts">
  import type { NenCycleStep } from '@black-whale/nen-engine'

  export let steps: NenCycleStep[]

  const statusClass: Record<string, string> = {
    pending: 'border-gray-700 text-gray-600',
    current: 'border-bw-gold text-white bg-bw-gold/10 font-semibold',
    completed: 'border-green-700 text-green-400',
    skipped: 'border-gray-700 text-gray-600 line-through',
    blocked: 'border-bw-scarlet text-bw-scarlet',
  }
  const statusIcon: Record<string, string> = {
    pending: '○',
    current: '◉',
    completed: '✓',
    skipped: '–',
    blocked: '✗',
  }
</script>

<!--
  Section 3 — universal Nen interaction cycle tracker.
  Renders the 8-step cycle and highlights the current step.
  Each ability adapts the cycle; skipped steps are still shown
  so the user understands the full grammar.
-->
<div class="nen-cycle bg-bw-navy/60 border border-bw-gold/20 rounded-lg p-3 text-xs font-mono">
  <div class="text-bw-gold text-xs font-bold tracking-widest mb-2">CYCLE</div>
  <ol class="flex flex-col gap-1">
    {#each steps as step, i (step.id)}
      <li class="flex items-start gap-2 px-2 py-1 rounded border {statusClass[step.status]}">
        <span class="shrink-0 w-4 text-center">{statusIcon[step.status]}</span>
        <div class="flex flex-col min-w-0">
          <span class="truncate">{step.label}</span>
          {#if step.note && (step.status === 'current' || step.status === 'blocked')}
            <span class="text-gray-500 text-[10px] leading-tight mt-0.5 whitespace-normal"
              >{step.note}</span
            >
          {/if}
        </div>
      </li>
      {#if i < steps.length - 1}
        <li class="text-gray-700 text-center leading-none select-none" aria-hidden="true">↓</li>
      {/if}
    {/each}
  </ol>
</div>
