<script lang="ts">
  /**
   * A free question to the body, answered by one of the catalogue's lines.
   *
   * Sits inside `TourAddressCard`, above the six fixed questions. What the
   * visitor types only picks which of those answers is quoted back — ADR-004
   * §2.4, amended: the question may be free, the answer may not. So the reply
   * shown here is always an `Answer` the card already holds, with its chapter,
   * and a question the archive has no line for says so and points at the six.
   */
  import { locale, t } from '$lib/i18n'
  import type { Answer } from '$lib/tour/cast'
  import { ASK_QUERY_MAX } from '$lib/tour/cast/askRouting'
  import { AddressAsk } from '$lib/tour/pageAddressAsk.svelte'

  interface Props {
    /** The interview's answers, already cut at the reader's chapter. */
    answers: Answer[]
  }

  let { answers }: Props = $props()

  const asking = new AddressAsk()
  let draft = $state('')

  const answer = $derived(
    asking.topic && asking.topic !== 'none'
      ? (answers.find((candidate) => candidate.topic === asking.topic) ?? null)
      : null,
  )

  const submit = (event: SubmitEvent) => {
    event.preventDefault()
    asking.ask(draft, $locale)
  }

  $effect(() => () => asking.clear())
</script>

<form class="mt-3" onsubmit={submit}>
  <label class="sr-only" for="address-ask">{$t.tour.address.ask.label}</label>
  <div class="flex gap-2">
    <input
      id="address-ask"
      type="text"
      bind:value={draft}
      maxlength={ASK_QUERY_MAX}
      autocomplete="off"
      placeholder={$t.tour.address.ask.placeholder}
      class="min-w-0 flex-1 rounded border border-[#FFFFF0]/20 bg-transparent px-2 py-1 text-xs text-[#FFFFF0] placeholder:text-[#FFFFF0]/35 focus:border-[#FFD700]/60 focus:outline-none"
    />
    <button
      type="submit"
      disabled={asking.pending}
      class="shrink-0 rounded border border-[#FFFFF0]/20 px-2 py-1 text-[11px] text-[#FFFFF0]/70 transition-colors hover:border-[#FFD700]/60 hover:text-[#FFD700] disabled:opacity-50"
      >{$t.tour.address.ask.submit}</button
    >
  </div>
</form>

{#if asking.asked}
  <div class="mt-2 rounded border border-[#FFD700]/25 bg-[#FFD700]/[0.04] p-2 text-xs leading-snug">
    <p class="text-[11px] italic text-[#FFFFF0]/60">« {asking.asked} »</p>
    {#if asking.pending}
      <p class="mt-1 text-[#FFFFF0]/45">{$t.tour.address.ask.pending}</p>
    {:else if answer}
      <p class="mt-1 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">
        {$t.tour.address.ask.answeredBy(answer.question)}
      </p>
      <p class="mt-0.5 {answer.said ? 'text-[#FFFFF0]/85' : 'text-[#FFFFF0]/45'}">
        {answer.said ?? answer.refusal}
        {#if answer.chapter}
          <span class="ml-1 text-[10px] text-[#FFD700]/60">ch. {answer.chapter}</span>
        {/if}
      </p>
    {:else}
      <p class="mt-1 text-[#FFFFF0]/45">{$t.tour.address.ask.none}</p>
    {/if}
  </div>
{/if}
