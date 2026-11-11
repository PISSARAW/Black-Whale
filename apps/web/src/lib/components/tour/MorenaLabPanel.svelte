<script lang="ts">
  import { t } from '$lib/i18n'
  import type { MorenaLabTechnique } from '$lib/tour/morenaHatsuAdapter'

  interface Props {
    techniques: MorenaLabTechnique[]
    selectedId: string | null
    clean: boolean
    onSelect: (id: string) => void
    onCleanChange: (clean: boolean) => void
    onDeal: () => void
    onBack: () => void
  }

  let { techniques, selectedId, clean, onSelect, onCleanChange, onDeal, onBack }: Props = $props()
  const copy = $derived($t.tour.morena)
  const featured = $derived(techniques.filter((technique) => technique.featured))
  const selected = $derived(techniques.find((technique) => technique.id === selectedId) ?? null)
  const effect = (technique: MorenaLabTechnique) =>
    technique.kind === 'bookmark'
      ? copy.hatsu.book.body
      : copy.hatsu.techniques[technique.kind].buys
</script>

<section data-testid="morena-lab">
  <p class="text-[10px] uppercase tracking-[0.22em] text-[#FFD700]/70">{copy.lab.eyebrow}</p>
  <h2 class="mt-1 text-lg font-semibold text-[#FFFFF0]">{copy.lab.title}</h2>
  <p class="mt-2 text-sm leading-relaxed text-[#FFFFF0]/65">{copy.lab.intro}</p>

  <h3 class="mt-5 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">
    {copy.lab.archetypes}
  </h3>
  <div class="mt-2 grid gap-2 sm:grid-cols-2">
    {#each featured as technique (technique.id)}
      <button
        type="button"
        data-testid="morena-lab-archetype"
        aria-pressed={selectedId === technique.id}
        onclick={() => onSelect(technique.id)}
        class="rounded border p-3 text-left transition {selectedId === technique.id
          ? 'border-[#FFD700] bg-[#FFD700]/10'
          : 'border-[#333] hover:border-[#FFD700]/50'}"
      >
        <span class="block text-sm font-semibold" style:color={technique.color}>
          {technique.name}
        </span>
        <span class="mt-1 block text-[10px] uppercase tracking-wider text-[#FFFFF0]/35">
          {technique.owner}
        </span>
        <span class="mt-2 block text-xs leading-snug text-[#FFFFF0]/60">
          {effect(technique)}
        </span>
      </button>
    {/each}
  </div>

  <details
    class="mt-4 rounded border border-[#292929] bg-[#080808]"
    data-testid="morena-lab-catalog"
  >
    <summary
      class="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-[#FFFFF0]/65 marker:hidden hover:text-[#FFFFF0]"
    >
      {copy.lab.catalog(techniques.length)}
    </summary>
    <div class="grid max-h-80 gap-1.5 overflow-y-auto border-t border-[#222] p-2 sm:grid-cols-2">
      {#each techniques as technique (technique.id)}
        <button
          type="button"
          aria-pressed={selectedId === technique.id}
          onclick={() => onSelect(technique.id)}
          class="rounded border px-2.5 py-2 text-left text-xs transition {selectedId ===
          technique.id
            ? 'border-[#FFD700] bg-[#FFD700]/10 text-[#FFFFF0]'
            : 'border-[#292929] text-[#FFFFF0]/65 hover:border-[#555]'}"
        >
          <span class="font-semibold" style:color={technique.color}>{technique.name}</span>
          <span class="ml-1 text-[10px] text-[#FFFFF0]/30">{technique.owner}</span>
        </button>
      {/each}
    </div>
  </details>

  <fieldset class="mt-5">
    <legend class="text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">
      {copy.lab.deal}
    </legend>
    <div class="mt-2 grid gap-2 sm:grid-cols-2">
      <label
        class="flex cursor-pointer gap-2 rounded border border-[#333] p-2 text-xs text-[#FFFFF0]/70"
      >
        <input
          type="radio"
          name="morena-lab-deal"
          checked={!clean}
          onchange={() => onCleanChange(false)}
        />
        <span>{copy.menu.marked}</span>
      </label>
      <label
        class="flex cursor-pointer gap-2 rounded border border-[#333] p-2 text-xs text-[#FFFFF0]/70"
      >
        <input
          type="radio"
          name="morena-lab-deal"
          checked={clean}
          onchange={() => onCleanChange(true)}
        />
        <span>{copy.menu.clean}</span>
      </label>
    </div>
  </fieldset>

  {#if selected}
    <p class="mt-4 text-xs text-[#FFFFF0]/50">{copy.lab.selected(selected.name)}</p>
  {/if}

  <div class="mt-5 flex flex-wrap gap-2">
    <button
      type="button"
      disabled={!selectedId}
      onclick={onDeal}
      class="rounded bg-[#d94f68] px-4 py-2 text-sm font-semibold text-[#0b0b0d] hover:bg-[#e8697f] disabled:opacity-40"
    >
      {copy.lab.play}
    </button>
    <button
      type="button"
      onclick={onBack}
      class="rounded border border-[#444] px-4 py-2 text-sm text-[#FFFFF0] hover:border-[#FFD700]"
    >
      {copy.menu.back}
    </button>
  </div>
</section>
