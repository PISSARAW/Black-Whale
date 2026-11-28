<script lang="ts">
  import MangaIcon from '$lib/components/icons/MangaIcon.svelte'

  let {
    touchUseLabel,
    castLabel,
    take,
    castNow,
    aiming,
    hands,
    tunes,
    twoHanded,
    auraColour,
  }: {
    touchUseLabel?: string | null
    castLabel: string
    take?: (() => void) | null
    castNow?: ((hand?: 'first' | 'second' | 'third') => void) | null
    aiming: boolean
    hands?: { first: string; second: string } | null
    tunes?: { first: string; second: string; third: string } | null
    twoHanded: boolean
    auraColour?: string | null
  } = $props()
</script>

<!-- Clear of the page's own read-out, which sits in the bottom corner. -->
<div class="absolute bottom-14 right-4 flex flex-col items-end gap-2">
  {#if touchUseLabel}
    <button
      type="button"
      onclick={() => take?.()}
      class="max-w-[13rem] touch-none rounded border border-[#FFD700]/60 bg-[#050505]/90 px-3 py-2 text-left text-xs leading-snug text-[#FFD700]"
    >
      {touchUseLabel}
    </button>
  {/if}
  {#if aiming && hands}
    <!-- Two techniques, so two buttons: a phone has no Hatsu wheel, and
         which of the two pages is being cast is the whole of the ability. -->
    {#each [{ hand: 'first' as const, name: hands.first }, { hand: 'second' as const, name: hands.second }] as page (page.hand)}
      <button
        type="button"
        onclick={() => castNow?.(page.hand)}
        aria-label={`${castLabel} · ${page.name}`}
        class="max-w-[13rem] touch-none truncate rounded border bg-[#050505]/90 px-3 py-2 text-xs"
        style:border-color={auraColour ? `color-mix(in srgb, ${auraColour} 70%, transparent)` : ''}
        style:color={auraColour ?? '#FFFFF0'}
      >
        {page.name}
      </button>
    {/each}
  {:else if aiming && tunes}
    <!-- And three, for the instrument: a phone has no Hatsu wheel, so
         the three airs are three buttons in the order the keys play them. -->
    {#each [{ hand: 'first' as const, name: tunes.first }, { hand: 'second' as const, name: tunes.second }, { hand: 'third' as const, name: tunes.third }] as air (air.hand)}
      <button
        type="button"
        onclick={() => castNow?.(air.hand)}
        aria-label={`${castLabel} · ${air.name}`}
        class="max-w-[13rem] touch-none truncate rounded border bg-[#050505]/90 px-3 py-2 text-xs"
        style:border-color={auraColour ? `color-mix(in srgb, ${auraColour} 70%, transparent)` : ''}
        style:color={auraColour ?? '#FFFFF0'}
      >
        {air.name}
      </button>
    {/each}
  {:else if aiming && twoHanded}
    <!-- And two for the two hands, which need no names: the marks are what
         the technique puts on, and a phone draws them as the walk draws them
         over the things themselves. -->
    {#each [{ hand: 'first' as const, glyph: '☀' }, { hand: 'second' as const, glyph: '☾' }] as mark (mark.hand)}
      <button
        type="button"
        onclick={() => castNow?.(mark.hand)}
        aria-label={`${castLabel} · ${mark.glyph}`}
        class="touch-none rounded border bg-[#050505]/90 px-4 py-2 text-sm"
        style:border-color={auraColour ? `color-mix(in srgb, ${auraColour} 70%, transparent)` : ''}
        style:color={auraColour ?? '#FFFFF0'}
      >
        <MangaIcon glyph={mark.glyph} />
      </button>
    {/each}
  {:else if aiming}
    <button
      type="button"
      onclick={() => castNow?.()}
      class="touch-none rounded border bg-[#050505]/90 px-4 py-2 text-xs uppercase tracking-widest"
      style:border-color={auraColour ? `color-mix(in srgb, ${auraColour} 70%, transparent)` : ''}
      style:color={auraColour ?? '#FFFFF0'}
    >
      {castLabel}
    </button>
  {/if}
</div>
