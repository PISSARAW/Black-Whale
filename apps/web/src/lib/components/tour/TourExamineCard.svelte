<script lang="ts">
  /**
   * The exhibit, in front of the walk.
   *
   * Everything worth arguing about is in `$lib/tour/exhibit`; this only lays it
   * out. Three decisions live here and nowhere else:
   *
   * The appearance is `svelte/transition`, not a library. The proposals asked
   * for framer-motion, which is React — and a card that rises eight pixels over
   * 180 ms does not need a dependency in any case. `prefers-reduced-motion` is
   * answered by giving it no distance and no duration rather than by removing
   * the transition, so the card still announces itself to the reader that is
   * watching for a DOM change.
   *
   * The blur is on this one card and on desktop only. `backdrop-filter` over a
   * WebGL canvas forces a recomposite of everything under it every frame, and on
   * the phones the tour is only just becoming usable on that is a frame budget
   * spent on an aesthetic. `@media (hover: hover) and (pointer: fine)` is the
   * same query the walk uses to decide the pointer is a mouse.
   *
   * It takes the pointer — `pointer-events-auto` — because it has a close
   * button and a link out to `/tour/sources`, which is the whole point of
   * handing someone evidence: they can go and check it.
   */
  import { fly } from 'svelte/transition'
  import { t } from '$lib/i18n'
  import { prefersReducedMotion } from '$lib/tour/comfort'
  import type { Exhibit } from '$lib/tour/exhibit'
  import type { Provenance } from '$lib/tour/types'

  interface Props {
    /**
     * Whether the visitor has asked, kept apart from whether there is an answer.
     *
     * Asking and being given silence is the one outcome a card about evidence
     * must not have: out in the hull between two footprints there is genuinely
     * nothing sourced in front of you, and saying so is itself the honest
     * answer. Folding the two into one nullable prop would render nothing at
     * all, and the visitor would read that as a broken key.
     */
    open: boolean
    exhibit: Exhibit | null
    sourcesHref: string
    onClose: () => void
    /**
     * The way on to the exchange, when the thing in front of you is a person.
     *
     * Offered from here rather than from a key of its own: addressing somebody
     * is the second half of the same gesture as asking who they are, and the
     * card is where the visitor already is when the question occurs to them. A
     * pillar gets `null`, and there is no button.
     */
    address: { label: string; onOpen: () => void } | null
  }

  let { open, exhibit, sourcesHref, onClose, address }: Props = $props()

  /** The same four colours the legend and the reveal already use. */
  const badgeClass: Record<Provenance, string> = {
    panel: 'border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700]',
    plan: 'border-[#FFFFF0]/30 bg-[#FFFFF0]/5 text-[#FFFFF0]/80',
    map: 'border-[#5f8f6a] bg-[#5f8f6a]/20 text-[#8fd0a0]',
    inferred: 'border-[#2b3a4a] bg-[#2b3a4a]/30 text-[#9dc4e0]',
  }

  const motion = $derived(prefersReducedMotion() ? { y: 0, duration: 0 } : { y: 10, duration: 180 })
</script>

{#if open}
  <aside
    class="examine pointer-events-auto absolute left-1/2 top-1/2 z-40 w-[min(24rem,calc(100%-1.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#FFD700]/30 bg-[#050505]/90 p-4 shadow-lg"
    aria-live="polite"
    aria-label={$t.tour.examine.title}
    transition:fly={motion}
  >
    <div class="mb-2 flex items-baseline justify-between gap-3">
      <p class="text-[10px] uppercase tracking-widest text-[#FFD700]/70">
        {$t.tour.examine.title}
      </p>
      <button
        type="button"
        onclick={onClose}
        class="shrink-0 text-[11px] text-[#FFFFF0]/50 transition-colors hover:text-[#FFFFF0]"
        >{$t.tour.examine.close}</button
      >
    </div>

    {#if !exhibit}
      <p class="text-xs leading-snug text-[#FFFFF0]/60">{$t.tour.examine.nothing}</p>
    {:else}
      <h2 class="text-lg font-semibold leading-tight text-[#FFFFF0]">{exhibit.title}</h2>
      <p class="mt-1.5">
        <span
          class="inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider {badgeClass[
            exhibit.provenance
          ]}">{exhibit.badge}</span
        >
      </p>

      <dl class="mt-3 space-y-2.5 text-xs leading-snug">
        <div>
          <dt class="text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">
            {$t.tour.examine.claimHeading}
          </dt>
          <dd class="mt-0.5 text-[#FFFFF0]/80">{exhibit.claim}</dd>
        </div>
        <div>
          <dt class="text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">
            {$t.tour.examine.sourceHeading}
          </dt>
          <dd class="mt-0.5 text-[#FFFFF0]/60">{exhibit.source}</dd>
        </div>
      </dl>

      {#if exhibit.measured || exhibit.standingIn}
        <p class="mt-3 border-t border-[#333] pt-2 text-[11px] text-[#FFFFF0]/45">
          {[exhibit.standingIn, exhibit.measured].filter(Boolean).join(' · ')}
        </p>
      {/if}

      {#if address}
        <p class="mt-3">
          <button
            type="button"
            onclick={address.onOpen}
            class="rounded border border-[#FFD700]/40 px-2 py-1 text-[11px] text-[#FFD700]/90 transition-colors hover:border-[#FFD700] hover:text-[#FFD700]"
            >{address.label}</button
          >
        </p>
      {/if}

      <p class="mt-2">
        <a
          href={sourcesHref}
          class="text-[11px] text-[#FFD700]/80 underline underline-offset-2 transition-colors hover:text-[#FFD700]"
          >{$t.tour.sourcesLink} →</a
        >
      </p>
    {/if}
  </aside>
{/if}

<style>
  /* See the component comment: the blur is desktop-only and this card only. */
  @media (hover: hover) and (pointer: fine) {
    .examine {
      backdrop-filter: blur(6px);
    }
  }
</style>
