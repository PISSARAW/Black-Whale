<script lang="ts">
  import { link, locale, t } from '$lib/i18n'
  import { localizeHatsu } from '$lib/i18n/hatsu'
  import type { HatsuProfile } from '$lib/nen/hatsuRegistry'
  import { HIDEOUT_OFFICE, moveFor, worksAtTheTable, type TableKind } from '$lib/tour/morena'

  interface Props {
    mode: 'menu' | 'rules'
    cheats?: boolean
    locked?: boolean
    carried: HatsuProfile | null
    onDeal: () => void
    onRules: () => void
    onBack: () => void
  }

  let {
    mode,
    cheats = $bindable(true),
    locked = false,
    carried,
    onDeal,
    onRules,
    onBack,
  }: Props = $props()
  const copy = $derived($t.tour.morena)
  const tableKind = $derived<TableKind | null>(
    worksAtTheTable(carried?.kind) ? (carried!.kind as TableKind) : null,
  )
  const move = $derived(tableKind ? moveFor(tableKind) : null)
  const carryingBook = $derived(carried?.kind === 'bookmark')
</script>

{#if mode === 'menu'}
  <h2 class="text-lg font-semibold text-[#FFFFF0]">{copy.menu.deck}</h2>
  <div class="mt-4 space-y-3">
    <label
      class="flex cursor-pointer gap-3 rounded border border-[#333] p-3 hover:border-[#d94f68]"
    >
      <input type="radio" class="mt-1" bind:group={cheats} value={true} disabled={locked} />
      <span
        ><span class="block text-sm font-semibold text-[#FFFFF0]">{copy.menu.marked}</span>
        <span class="mt-1 block text-xs leading-snug text-[#FFFFF0]/60">{copy.menu.markedNote}</span
        ></span
      >
    </label>
    <label
      class="flex cursor-pointer gap-3 rounded border border-[#333] p-3 hover:border-[#d94f68]"
    >
      <input type="radio" class="mt-1" bind:group={cheats} value={false} disabled={locked} />
      <span
        ><span class="block text-sm font-semibold text-[#FFFFF0]">{copy.menu.clean}</span>
        <span class="mt-1 block text-xs leading-snug text-[#FFFFF0]/60">{copy.menu.cleanNote}</span
        ></span
      >
    </label>
  </div>

  <h3 class="mt-6 text-[10px] uppercase tracking-widest text-[#FFD700]/70">{copy.hatsu.title}</h3>
  {#if tableKind && move}
    <div class="mt-2 rounded border border-[#333] p-3" style:border-color={carried?.color}>
      <p class="text-sm font-semibold" style:color={carried?.color}>
        {localizeHatsu(carried!, $locale).name}
      </p>
      <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/70">
        <span class="text-[#FFFFF0]/40">{copy.hatsu.buys} — </span>{copy.hatsu.techniques[tableKind]
          .buys}
      </p>
      <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/55">
        <span class="text-[#FFFFF0]/40">{copy.hatsu.costs} — </span>{copy.hatsu.techniques[
          tableKind
        ].costs}
      </p>
    </div>
  {:else if carryingBook}
    <div class="mt-2 rounded border border-[#333] p-3" style:border-color={carried?.color}>
      <p class="text-sm font-semibold" style:color={carried?.color}>
        {localizeHatsu(carried!, $locale).name}
      </p>
      <p class="mt-1 text-xs leading-snug text-[#FFFFF0]/70">
        <span class="text-[#FFFFF0]/40">{copy.hatsu.buys} — </span>{copy.hatsu.book.body}
      </p>
    </div>
  {:else if carried}
    <p class="mt-2 text-xs leading-snug text-[#FFFFF0]/50">
      {copy.hatsu.useless(localizeHatsu(carried, $locale).name)}
    </p>
  {:else}
    <p class="mt-2 text-xs leading-snug text-[#FFFFF0]/50">{copy.hatsu.none}</p>
  {/if}

  <div class="mt-5 flex flex-wrap gap-2">
    <button
      class="rounded bg-[#d94f68] px-4 py-2 text-sm font-semibold text-[#0b0b0d] hover:bg-[#e8697f]"
      onclick={onDeal}>{copy.menu.play}</button
    >
    <button
      class="rounded border border-[#444] px-4 py-2 text-sm text-[#FFFFF0] hover:border-[#FFD700]"
      onclick={onRules}>{copy.menu.rules}</button
    >
  </div>
  <p class="mt-6 text-xs leading-snug text-[#FFFFF0]/50">{copy.source}</p>
  <a
    class="mt-3 text-xs text-[#FFD700]/80 underline hover:text-[#FFD700]"
    href="{$link('/tour')}?space={HIDEOUT_OFFICE}">{copy.menu.walk}</a
  >
{:else}
  <h2 class="text-lg font-semibold text-[#FFFFF0]">{copy.rules.title}</h2>
  <ol class="mt-3 space-y-3">
    {#each copy.rules.lines as line, index (index)}
      <li class="flex gap-3 text-sm leading-relaxed text-[#FFFFF0]/75">
        <span class="text-[#d94f68]">{index + 1}</span><span>{line}</span>
      </li>
    {/each}
  </ol>
  <div class="mt-5">
    <button
      class="rounded border border-[#444] px-4 py-2 text-sm text-[#FFFFF0] hover:border-[#FFD700]"
      onclick={onBack}>{copy.menu.back}</button
    >
  </div>
{/if}
