<script lang="ts">
  import { fly } from 'svelte/transition'
  import { locale, t } from '$lib/i18n'
  import { prefersReducedMotion } from '$lib/tour/comfort'
  import type { ContextLine } from '$lib/tour/cast'

  interface Props {
    conversation: { name: string; line: ContextLine } | null
    onClose: () => void
    onOpenArchive: () => void
  }

  let { conversation, onClose, onOpenArchive }: Props = $props()
  const motion = $derived(prefersReducedMotion() ? { y: 0, duration: 0 } : { y: 10, duration: 180 })
</script>

{#if conversation}
  <aside
    class="dialogue pointer-events-auto absolute left-1/2 top-1/2 z-40 w-[min(26rem,calc(100%-1.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#FFD700]/40 bg-[#050505]/95 p-4 shadow-lg"
    aria-live="polite"
    aria-label={$t.tour.dialogue.title}
    transition:fly={motion}
  >
    <div class="mb-2 flex items-baseline justify-between gap-3">
      <p class="text-[10px] uppercase tracking-widest text-[#FFD700]/70">
        {$t.tour.dialogue.title}
      </p>
      <button
        type="button"
        onclick={onClose}
        class="shrink-0 text-[11px] text-[#FFFFF0]/50 transition-colors hover:text-[#FFFFF0]"
        >{$t.tour.dialogue.close}</button
      >
    </div>

    <h2 class="text-lg font-semibold leading-tight text-[#FFFFF0]">{conversation.name}</h2>
    <p
      class="mt-3 border-l-2 border-[#FFD700]/60 pl-3 text-sm italic leading-relaxed text-[#FFFFF0]/90"
    >
      « {$locale === 'fr' ? conversation.line.textFr : conversation.line.text} »
    </p>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#333] pt-2">
      <p class="text-[10px] leading-snug text-[#FFFFF0]/40">
        {$t.tour.dialogue.paraphrase(conversation.line.chapter)}
      </p>
      <button
        type="button"
        onclick={onOpenArchive}
        class="rounded border border-[#FFFFF0]/20 px-2 py-1 text-[11px] text-[#FFFFF0]/60 transition-colors hover:border-[#FFD700]/60 hover:text-[#FFD700]"
        >{$t.tour.address.open}</button
      >
    </div>
  </aside>
{/if}

<style>
  @media (hover: hover) and (pointer: fine) {
    .dialogue {
      backdrop-filter: blur(6px);
    }
  }
</style>
