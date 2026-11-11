<script lang="ts">
  import { link, t } from '$lib/i18n'
  import { HIDEOUT_OFFICE } from '$lib/tour/morena'

  interface Props {
    mode: 'menu' | 'rules'
    onDeal: () => void
    onRules: () => void
    onBack: () => void
  }

  let { mode, onDeal, onRules, onBack }: Props = $props()
  const copy = $derived($t.tour.morena)
</script>

{#if mode === 'menu'}
  <h2 class="text-lg font-semibold text-[#FFFFF0]">{copy.menu.canonicalTitle}</h2>
  <p class="mt-2 text-sm leading-relaxed text-[#FFFFF0]/65">{copy.menu.quickRule}</p>
  <div class="mt-4 flex flex-wrap gap-2">
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
    class="mt-3 block text-xs text-[#FFD700]/80 underline hover:text-[#FFD700]"
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
