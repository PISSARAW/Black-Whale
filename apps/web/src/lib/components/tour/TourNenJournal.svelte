<script lang="ts">
  import type { NenCause, NenCauseEntry } from '$lib/tour/nenFeedback'
  import { nenCauseText, nenJournalLabel } from '$lib/tour/nenText'

  interface Props {
    entries?: readonly NenCauseEntry[]
    french?: boolean
  }

  let { entries = [], french = false }: Props = $props()

  const sentence = (cause: NenCause) => nenCauseText(cause, french)
</script>

{#if entries.length}
  <ol
    class="pointer-events-none absolute bottom-24 left-3 z-20 w-72 space-y-1 text-[10px] text-[#fffff0]/70"
    aria-live="polite"
    aria-label={nenJournalLabel(french)}
  >
    {#each entries as entry (entry.id)}
      <li class="rounded border border-[#8ecae6]/20 bg-[#050505]/80 px-2 py-1">
        {sentence(entry.cause)}
      </li>
    {/each}
  </ol>
{/if}
