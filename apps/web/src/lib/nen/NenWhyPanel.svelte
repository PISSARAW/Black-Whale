<script lang="ts">
  import type { ActionAvailability } from '@black-whale/nen-engine'
  import { createEventDispatcher } from 'svelte'

  export let availability: ActionAvailability | null = null
  export let perspectiveMode: 'character' | 'omniscient' | 'body' | 'aura' | 'apparent' =
    'character'

  const dispatch = createEventDispatcher<{ close: void }>()

  const statusIcon: Record<string, string> = {
    met: '✓',
    unmet: '✗',
    unknown: '?',
  }
  const statusClass: Record<string, string> = {
    met: 'text-green-400',
    unmet: 'text-bw-scarlet',
    unknown: 'text-gray-500 italic',
  }
</script>

<!--
  Section 14 — "Why?" panel.
  Explains why a specific action is unavailable.
  Conditions are shown according to perspective:
    - character perspective: unknown conditions may appear as '?'
    - omniscient: full canonical reason revealed
-->
{#if availability}
  <div class="why-panel bg-bw-navy border border-bw-gold/30 rounded-lg p-4 w-72 text-sm shadow-lg">
    <div class="flex items-start justify-between mb-3">
      <span class="text-bw-gold font-semibold text-xs tracking-widest">WHY?</span>
      <button
        class="text-gray-500 hover:text-white text-xs leading-none"
        onclick={() => dispatch('close')}
        aria-label="Close">✕</button
      >
    </div>

    <p class="text-gray-400 text-xs mb-3">
      {availability.available
        ? 'This action is available.'
        : 'This action is currently unavailable.'}
    </p>

    <ul class="flex flex-col gap-1.5">
      {#each availability.conditions as cond (cond.label)}
        <li class="flex items-start gap-2">
          <span class="shrink-0 font-mono {statusClass[cond.status]}"
            >{statusIcon[cond.status]}</span
          >
          <span
            class:text-gray-300={cond.status !== 'unknown'}
            class:text-gray-600={cond.status === 'unknown'}
            class:italic={cond.status === 'unknown'}
          >
            {#if cond.status === 'unknown' && perspectiveMode === 'character'}
              Unknown condition
            {:else}
              {cond.label}
            {/if}
          </span>
        </li>
      {/each}
    </ul>

    <!-- Omniscient canonical reason -->
    {#if perspectiveMode === 'omniscient' && availability.canonicalReason}
      <div class="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
        <span class="text-bw-gold">Actual cause:</span>
        <p class="mt-1 text-gray-300">{availability.canonicalReason}</p>
      </div>
    {/if}
  </div>
{/if}
