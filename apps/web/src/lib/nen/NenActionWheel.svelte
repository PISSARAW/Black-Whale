<script lang="ts">
  import type { NenActionWheelEntry, ActionVisibility } from '@black-whale/nen-engine'
  import { createEventDispatcher } from 'svelte'

  export let entries: NenActionWheelEntry[]
  export let title = 'NEN'

  const dispatch = createEventDispatcher<{
    select: NenActionWheelEntry
    inspect: NenActionWheelEntry
  }>()

  const visibilityClass: Record<ActionVisibility, string> = {
    available:            'border-bw-gold text-white hover:bg-bw-gold/20 cursor-pointer',
    locked:               'border-gray-600 text-gray-500 cursor-not-allowed',
    hidden:               'hidden',
    unknown:              'border-gray-700 text-gray-600 italic cursor-default',
    warning:              'border-yellow-600 text-yellow-400 hover:bg-yellow-900/20 cursor-pointer',
  }

  const visibilityIcon: Record<ActionVisibility, string> = {
    available: '',
    locked:    '🔒',
    hidden:    '',
    unknown:   '?',
    warning:   '⚠',
  }

  function handleClick(entry: NenActionWheelEntry) {
    if (entry.visibility === 'available' || entry.visibility === 'warning') {
      dispatch('select', entry)
    } else if (entry.visibility === 'locked' || entry.visibility === 'unknown') {
      dispatch('inspect', entry)
    }
  }
</script>

<!--
  Section 4 — NEN action wheel.
  Each action is shown according to its visibility state:
    available   → clickable, gold border
    locked      → greyed, shows lock icon, clicking opens Why-panel
    hidden      → not rendered
    unknown     → shown as '?' — the character cannot identify the action
    warning     → available but with a caution icon
-->
<div class="nen-action-wheel bg-bw-navy/80 border border-bw-gold/30 rounded-lg p-3 w-52">
  <div class="text-bw-gold text-xs font-bold tracking-widest mb-3 text-center">{title}</div>

  <ul class="flex flex-col gap-1">
    {#each entries as entry (entry.id)}
      {#if entry.visibility !== 'hidden'}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <li
          class="flex items-center justify-between gap-2 px-3 py-1.5 rounded border text-sm transition-colors {visibilityClass[entry.visibility]}"
          title={entry.hint ?? entry.label}
          onclick={() => handleClick(entry)}
        >
          <span class="truncate">
            {#if entry.visibility === 'unknown'}?{:else}{entry.label}{/if}
          </span>
          {#if visibilityIcon[entry.visibility]}
            <span class="shrink-0 text-xs">{visibilityIcon[entry.visibility]}</span>
          {/if}
        </li>
      {/if}
    {/each}
  </ul>
</div>
