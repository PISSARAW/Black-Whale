<script lang="ts">
  import { t } from '$lib/i18n'
  import type { InfectionProgress, VictimStatus } from '$lib/tour/morena'

  let {
    state,
    progress,
    onWitness,
    onLeave,
    onKill,
  }: {
    state: 'pending' | 'left' | 'completed' | null
    progress: InfectionProgress
    onWitness: () => void
    onLeave: () => void
    onKill: (status: VictimStatus) => void
  } = $props()
  const copy = $derived($t.tour.morena.epilogue)
</script>

{#if state === 'pending'}
  <section
    class="mt-4 rounded border border-[#d94f68]/60 bg-[#140f13] p-3"
    data-testid="morena-epilogue"
  >
    <h3 class="text-sm font-semibold text-[#d94f68]">{copy.title}</h3>
    <p class="mt-1 text-xs leading-relaxed text-[#FFFFF0]/70">{copy.body}</p>
    <div class="mt-3 flex flex-wrap gap-2">
      <button
        class="rounded bg-[#d94f68] px-3 py-2 text-xs font-semibold text-black"
        onclick={onWitness}>{copy.witness}</button
      >
      <button
        class="rounded border border-[#444] px-3 py-2 text-xs text-[#FFFFF0]"
        onclick={onLeave}>{copy.leave}</button
      >
    </div>
  </section>
{:else if state === 'left'}
  <p
    class="mt-4 rounded border border-[#333] p-3 text-xs text-[#FFFFF0]/60"
    data-testid="morena-epilogue"
  >
    {copy.left}
  </p>
{/if}

{#if progress.member}
  <section
    class="mt-4 rounded border border-[#d94f68]/50 bg-[#0b0b0d] p-3"
    data-testid="morena-network"
  >
    <div class="flex items-baseline justify-between gap-3">
      <h3 class="text-sm font-semibold text-[#d94f68]">{copy.network} · 1 / 22</h3>
      <span class="text-xs font-semibold text-[#FFD700]">{copy.level(progress.member.level)}</span>
    </div>
    <p class="mt-1 text-xs text-[#FFFFF0]/65">{copy.you} · {copy.kills(progress.member.kills)}</p>
    {#if state === 'completed'}
      <p class="mt-2 text-xs text-[#7fc8a0]">{copy.recruited}</p>
    {/if}
    {#if progress.member.uniqueAbilityUnlocked}
      <p class="mt-2 text-xs font-semibold text-[#8ecae6]">{copy.ability}</p>
    {/if}
    <p class="mt-3 text-[10px] uppercase tracking-widest text-[#FFFFF0]/40">{copy.record}</p>
    <div class="mt-2 flex flex-wrap gap-2">
      <button
        class="rounded border border-[#444] px-2 py-1.5 text-xs text-[#FFFFF0]"
        onclick={() => onKill('ordinary')}>{copy.ordinary}</button
      >
      <button
        class="rounded border border-[#444] px-2 py-1.5 text-xs text-[#FFFFF0]"
        onclick={() => onKill('nen-user')}>{copy.nenUser}</button
      >
      <button
        class="rounded border border-[#444] px-2 py-1.5 text-xs text-[#FFFFF0]"
        onclick={() => onKill('prince')}>{copy.prince}</button
      >
    </div>
  </section>
{/if}
