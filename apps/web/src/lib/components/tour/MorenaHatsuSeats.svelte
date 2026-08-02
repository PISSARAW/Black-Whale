<script lang="ts">
  import { t } from '$lib/i18n'
  import { exposureNow, moveFor, type MorenaGame, type TableKind } from '$lib/tour/morena'

  type TableMove = ReturnType<typeof moveFor>

  interface SeatView {
    page: string
    kind: TableKind
    move: TableMove
    name: string
    usedUp: boolean
    unbidden: boolean
    spent: number
  }

  interface Props {
    game: MorenaGame
    seats: SeatView[]
    keyed: SeatView[]
    auraColor: string | null
    onCast: (hand: 'first' | 'second') => void
  }

  let { game, seats, keyed, auraColor, onCast }: Props = $props()
  const copy = $derived($t.tour.morena)
  const techniqueBuys = (kind: TableKind) =>
    (copy.hatsu.techniques as Record<string, { buys: string }>)[kind]?.buys ?? kind
  const effectLabel = (effect: string) =>
    (copy.hatsu.effects as Record<string, string>)[effect] ?? effect
</script>

{#if seats.length && game.phase !== 'over'}
  {#if seats.length > 1}
    <p class="mt-5 text-[10px] uppercase tracking-widest text-[#FFD700]/70">{copy.hatsu.book.title}</p>
    <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/55">{copy.hatsu.book.body}</p>
  {/if}
  {#each seats as seat, index (seat.page)}
    <div class="mt-3 rounded border border-[#333] p-3 {index === 0 && seats.length === 1 ? 'mt-5' : ''}" style:border-color={auraColor}>
      <div class="flex items-baseline justify-between gap-2">
        <p class="text-sm font-semibold" style:color={auraColor}>
          {#if keyed.length > 1 && !seat.unbidden}<span class="text-[#FFFFF0]/40">{keyed.indexOf(seat) === 0 ? 'F' : 'R'} · </span>{/if}{seat.name}
        </p>
        <span class="rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider {seat.move.fraud
          ? 'border-[#ef3340]/60 text-[#ef8a90]'
          : 'border-[#7fc8a0]/60 text-[#7fc8a0]'}">
          {seat.move.fraud ? copy.hatsu.fraud : copy.hatsu.legal}
        </span>
      </div>
      <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/60">{techniqueBuys(seat.kind)}</p>
      {#if seat.move.fraud}
        <p class="mt-2 text-[11px] text-[#ef8a90]/80">{copy.hatsu.exposure(Math.round(exposureNow(seat.move, game) * 100))}</p>
      {/if}
      <div class="mt-3 flex flex-wrap items-center gap-2">
        {#if seat.unbidden}
          <span class="text-[11px] leading-snug text-[#d8c7ed]">{copy.hatsu.unbidden}</span>
        {:else}
          <button class="rounded px-3 py-1.5 text-xs font-semibold text-[#0b0b0d] disabled:opacity-30"
            style:background={auraColor ?? '#d94f68'} disabled={seat.usedUp}
            onclick={() => onCast(keyed.indexOf(seat) === 0 ? 'first' : 'second')}>
            {effectLabel(seat.move.effect)}
          </button>
        {/if}
        <span class="text-[10px] uppercase tracking-wider text-[#FFFFF0]/40">
          {seat.usedUp ? copy.hatsu.exhausted : copy.hatsu.spent(seat.spent, seat.move.uses)}
        </span>
      </div>
    </div>
  {/each}
{/if}
