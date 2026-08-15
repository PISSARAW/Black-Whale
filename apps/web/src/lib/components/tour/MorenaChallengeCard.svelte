<script lang="ts">
  import { t } from '$lib/i18n'
  import type { MorenaGame } from '$lib/tour/morena'
  import {
    challengeOutcome,
    encodeMorenaChallenge,
    nextMorenaChallenge,
    type MorenaChallenge,
  } from '$lib/tour/morenaChallenge'

  interface Props {
    game?: MorenaGame | null
    incoming?: MorenaChallenge | null
    seed?: number
    previousStreak?: number
    path: string
  }

  let { game = null, incoming = null, seed = 0, previousStreak = 0, path }: Props = $props()
  const copy = $derived($t.tour.morena.challenge)
  const outcome = $derived(game ? challengeOutcome(game) : 'unfinished')
  const next = $derived(game ? nextMorenaChallenge(game, seed, previousStreak) : null)
  let shared = $state(false)

  async function share() {
    if (!next || typeof location === 'undefined') return
    const search = new URLSearchParams({ challenge: encodeMorenaChallenge(next) })
    const url = `${location.origin}${path}?${search}`
    const text = copy.shareText(next.streak)
    try {
      if (navigator.share) await navigator.share({ title: copy.shareTitle, text, url })
      else await navigator.clipboard.writeText(url)
      shared = true
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return
      try {
        await navigator.clipboard.writeText(url)
        shared = true
      } catch {
        shared = false
      }
    }
  }
</script>

{#if !game && incoming}
  <section
    class="mb-4 rounded border border-[#d94f68]/70 bg-[#1b0b10] p-3 shadow-[0_0_2rem_rgb(217_79_104_/_0.12)]"
  >
    <p class="text-[10px] uppercase tracking-[0.22em] text-[#d94f68]">{copy.invitation}</p>
    <h2 class="mt-1 text-base font-semibold text-[#FFFFF0]">
      {copy.streak(incoming.streak)}
    </h2>
    <p class="mt-2 text-xs leading-relaxed text-[#FFFFF0]/75">
      {copy.invitationBody(incoming.rounds)}
    </p>
    <p class="mt-2 text-[10px] leading-relaxed text-[#FFFFF0]/40">{copy.sameGame}</p>
  </section>
{:else if game && outcome === 'morena' && next}
  <section class="mt-4 rounded border border-[#d94f68] bg-[#1b0b10] p-3">
    <p class="text-[10px] uppercase tracking-[0.22em] text-[#d94f68]">{copy.chain}</p>
    <h3 class="mt-1 text-base font-semibold text-[#FFFFF0]">{copy.morenaWins(next.streak)}</h3>
    <p class="mt-2 text-xs leading-relaxed text-[#FFFFF0]/70">
      {copy.morenaWinsBody(game.round)}
    </p>
    <button
      type="button"
      onclick={share}
      class="mt-3 rounded bg-[#d94f68] px-4 py-2 text-sm font-semibold text-[#0b0b0d] transition hover:bg-[#e8697f]"
    >
      {shared ? copy.copied : copy.share}
    </button>
    <p class="mt-2 text-[10px] leading-relaxed text-[#FFFFF0]/40">{copy.nonCanonical}</p>
  </section>
{:else if game && outcome === 'player' && previousStreak > 0}
  <section class="mt-4 rounded border border-[#7fc8a0]/70 bg-[#0c1a13] p-3">
    <p class="text-[10px] uppercase tracking-[0.22em] text-[#7fc8a0]">{copy.broken}</p>
    <h3 class="mt-1 text-base font-semibold text-[#FFFFF0]">
      {copy.playerWins(previousStreak)}
    </h3>
    <p class="mt-2 text-xs leading-relaxed text-[#FFFFF0]/70">{copy.playerWinsBody}</p>
  </section>
{:else if game && outcome === 'abandoned' && previousStreak > 0}
  <section class="mt-4 rounded border border-[#555] bg-[#121214] p-3">
    <p class="text-[10px] uppercase tracking-[0.22em] text-[#FFFFF0]/45">{copy.unfinished}</p>
    <p class="mt-1 text-xs leading-relaxed text-[#FFFFF0]/60">{copy.unfinishedBody}</p>
  </section>
{/if}
