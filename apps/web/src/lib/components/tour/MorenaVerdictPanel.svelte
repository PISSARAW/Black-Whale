<script lang="ts">
  import { t } from '$lib/i18n'
  import { infectionAfter, type MorenaGame } from '$lib/tour/morena'

  interface Props {
    game: MorenaGame
    onAgain: () => void
    onLeave: () => void
  }

  let { game, onAgain, onLeave }: Props = $props()
  const copy = $derived($t.tour.morena)
  const conditions = $derived(infectionAfter(game))
  const verdictCopy = $derived(
    game.verdict
      ? (copy.verdicts as Record<string, { title: string; body: string }>)[game.verdict]
      : null,
  )
  const aftermathLabel = (consequence: string) =>
    (copy.hatsu.aftermath as Record<string, string>)[consequence] ?? consequence
</script>

{#if game.verdict}
  <div class="mt-4 rounded border border-[#d94f68]/60 bg-[#d94f68]/10 p-3">
    <h2 class="text-base font-semibold text-[#FFFFF0]">{verdictCopy?.title}</h2>
    <p class="mt-1 text-xs leading-relaxed text-[#FFFFF0]/75">{verdictCopy?.body}</p>
  </div>

  <h3 class="mt-4 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
    {copy.conditions.title}
  </h3>
  <ul class="mt-2 space-y-1 text-xs">
    {#each [{ label: copy.conditions.said, met: conditions.said }, { label: copy.conditions.kissed, met: conditions.kissed }, { label: copy.conditions.witnessed, met: conditions.witnessed }] as condition (condition.label)}
      <li class="flex justify-between gap-3">
        <span class="text-[#FFFFF0]/70">{condition.label}</span>
        <span class={condition.met ? 'text-[#7fc8a0]' : 'text-[#FFFFF0]/35'}>
          {condition.met ? copy.conditions.met : copy.conditions.unmet}
        </span>
      </li>
    {/each}
  </ul>
  <p class="mt-2 text-xs font-semibold text-[#FFD700]">
    {conditions.level === null ? copy.conditions.none : copy.conditions.level(conditions.level)}
  </p>
  {#if !conditions.said && conditions.kissed}
    <p class="mt-2 text-xs leading-snug text-[#FFFFF0]/60">{copy.conditions.kissedAnyway}</p>
  {/if}

  {#if game.aftermath.length}
    <h3 class="mt-4 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
      {copy.hatsu.aftermath.title}
    </h3>
    <ul class="mt-2 space-y-2">
      {#each game.aftermath as consequence (consequence)}
        <li class="text-xs leading-relaxed text-[#8ecae6]">{aftermathLabel(consequence)}</li>
      {/each}
    </ul>
  {/if}

  <div class="mt-4 flex flex-wrap gap-2">
    <button
      class="rounded bg-[#d94f68] px-4 py-2 text-sm font-semibold text-[#0b0b0d] hover:bg-[#e8697f]"
      onclick={onAgain}>{copy.again}</button
    >
    <button
      class="rounded border border-[#444] px-4 py-2 text-sm text-[#FFFFF0] hover:border-[#FFD700]"
      onclick={onLeave}>{copy.menu.leave}</button
    >
  </div>
{/if}
