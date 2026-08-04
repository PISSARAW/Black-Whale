<script lang="ts">
  /**
   * The exchange with one body, laid out.
   *
   * A sibling of `TourExamineCard` and deliberately its twin: the walk answers
   * a question about a pillar and a question about a person with the same kind
   * of card, because they are the same kind of claim — here is what the archive
   * holds, and here is the chapter you can check it against.
   *
   * Two things it insists on saying, both at the bottom, both in the smallest
   * type on the card and neither optional:
   *
   * - that none of these lines is dialogue. A reader who thought the guard was
   *   *talking* would have been told a lie by the layout rather than by the
   *   text, and the layout is where it has to be corrected.
   * - that what the reader's own chapter withheld exists. Silently trimming the
   *   route would let a capped reader believe they had the whole of it.
   */
  import { fly } from 'svelte/transition'
  import { t } from '$lib/i18n'
  import { prefersReducedMotion } from '$lib/tour/comfort'
  import type { Answer, Interview } from '$lib/tour/cast'
  import type { BodyMark } from '$lib/tour/cast'
  import type { ReadingTell } from '$lib/tour/cast'

  interface Props {
    /** The exchange, or null when nobody has been addressed. */
    talk: Interview | null
    /** What the body answered over the person: Body and Soul, and nothing else. */
    extracted: Answer[]
    /** What the visitor's own aura tells them, right now. */
    reading: ReadingTell[]
    /** What the walk is currently holding on them, if anything. */
    held: BodyMark | null
    onClose: () => void
  }

  let { talk, extracted, reading, held, onClose }: Props = $props()

  const motion = $derived(prefersReducedMotion() ? { y: 0, duration: 0 } : { y: 10, duration: 180 })
</script>

{#if talk}
  <aside
    class="address pointer-events-auto absolute left-1/2 top-1/2 z-40 max-h-[calc(100%-2rem)] w-[min(26rem,calc(100%-1.5rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-[#FFD700]/30 bg-[#050505]/90 p-4 shadow-lg"
    aria-live="polite"
    aria-label={$t.tour.address.title}
    transition:fly={motion}
  >
    <div class="mb-2 flex items-baseline justify-between gap-3">
      <p class="text-[10px] uppercase tracking-widest text-[#FFD700]/70">
        {$t.tour.address.title}
      </p>
      <button
        type="button"
        onclick={onClose}
        class="shrink-0 text-[11px] text-[#FFFFF0]/50 transition-colors hover:text-[#FFFFF0]"
        >{$t.tour.address.close}</button
      >
    </div>

    <h2 class="text-lg font-semibold leading-tight text-[#FFFFF0]">{talk.name}</h2>
    <p class="mt-0.5 text-[11px] text-[#FFFFF0]/50">{$t.tour.address.lead(talk.name)}</p>

    {#if reading.length > 0 || held}
      <div class="mt-3 rounded border border-[#333] bg-[#FFFFF0]/[0.03] p-2">
        <p class="text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">
          {$t.tour.body.readingTitle}
        </p>
        <ul class="mt-1 space-y-0.5 text-[11px] leading-snug text-[#FFFFF0]/70">
          {#each reading as tell (tell)}
            <li>{$t.tour.body.reading[tell]}</li>
          {/each}
          {#if held}
            <li class="text-[#FFD700]/80">
              {$t.tour.body.held(talk.name, $t.tour.body.marks[held])}
            </li>
          {/if}
        </ul>
        {#if held}
          <p class="mt-1 text-[10px] text-[#FFFFF0]/35">{$t.tour.body.ephemeral}</p>
        {/if}
      </div>
    {/if}

    <dl class="mt-3 space-y-2.5 text-xs leading-snug">
      {#each talk.answers as answer (answer.topic)}
        <div>
          <dt class="text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">
            {answer.question}
          </dt>
          <dd class="mt-0.5 {answer.said ? 'text-[#FFFFF0]/80' : 'text-[#FFFFF0]/45'}">
            {answer.said ?? answer.refusal}
            {#if answer.chapter}
              <span class="ml-1 text-[10px] text-[#FFD700]/60">ch. {answer.chapter}</span>
            {/if}
          </dd>
        </div>
      {/each}
    </dl>

    {#if extracted.length > 0}
      <div class="mt-3 border-t border-[#FFD700]/20 pt-2">
        <p class="text-[10px] uppercase tracking-widest text-[#FFD700]/70">
          {$t.tour.address.unsealed}
        </p>
        <dl class="mt-1 space-y-2 text-xs leading-snug">
          {#each extracted as answer (answer.topic)}
            <div>
              <dt class="text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">
                {answer.question}
              </dt>
              <dd class="mt-0.5 {answer.said ? 'text-[#FFFFF0]/80' : 'text-[#FFFFF0]/45'}">
                {answer.said ?? answer.refusal}
              </dd>
            </div>
          {/each}
        </dl>
      </div>
    {/if}

    <p class="mt-3 border-t border-[#333] pt-2 text-[10px] leading-snug text-[#FFFFF0]/40">
      {$t.tour.address.sourced}
      {#if talk.withheld > 0}
        <span class="block">{$t.tour.address.withheld(talk.withheld)}</span>
      {/if}
    </p>
  </aside>
{/if}

<style>
  /* The same desktop-only blur as the evidence card, for the same reason. */
  @media (hover: hover) and (pointer: fine) {
    .address {
      backdrop-filter: blur(6px);
    }
  }
</style>
