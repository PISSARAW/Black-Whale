<script lang="ts">
  import type { CaseSession } from '$lib/investigation/caseSession.svelte'

  let { session }: { session: CaseSession } = $props()

  const investigation = $derived(session.investigation)
</script>

<div class="grid gap-3 sm:grid-cols-2">
  {#each investigation.subjects as subject (subject.id)}
    <button
      class="border border-white/10 bg-white/[0.025] p-4 text-left hover:border-[#d6b35a]/40"
      onclick={() => {
        session.notebookOpen = false
        session.openSubject(subject.id)
      }}
    >
      <p class="text-[9px] uppercase tracking-widest text-[#d6b35a]">{subject.role}</p>
      <h3 class="mt-1 font-serif text-xl text-white">{subject.name}</h3>
      <p class="mt-1 text-xs text-white/45">{subject.status}</p>
      <p
        class="mt-4 text-[10px] uppercase tracking-wider {session.discoveredIds.some((id) =>
          subject.evidenceIds.includes(id),
        )
          ? 'text-emerald-200'
          : 'text-white/30'}"
      >
        {session.discoveredIds.some((id) => subject.evidenceIds.includes(id))
          ? 'Consigné · revoir'
          : 'À examiner'}
      </p>
    </button>
  {/each}
</div>
<section class="mt-8 border-t border-white/10 pt-6">
  <p class="text-[10px] font-bold uppercase tracking-widest text-[#d6b35a]">
    Confronter deux déclarations
  </p>
  <p class="mt-2 text-sm text-white/45">
    Sélectionnez deux témoins. Une divergence précise peut devenir une déduction.
  </p>
  <div class="mt-4 flex flex-wrap gap-2">
    {#each investigation.subjects.filter((subject) => !subject.isDead && subject.id !== 'kurapika') as subject (subject.id)}
      <button
        class="border px-3 py-2 text-xs transition {session.confrontationWitnessIds.includes(
          subject.id,
        )
          ? 'border-[#d6b35a] bg-[#d6b35a]/10 text-[#f0cf76]'
          : 'border-white/15 text-white/55 hover:border-white/35'}"
        onclick={() => session.toggleConfrontationWitness(subject.id)}>{subject.name}</button
      >
    {/each}
  </div>
  <button
    class="mt-4 border border-[#d6b35a]/60 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#e8cc84] enabled:hover:bg-[#d6b35a]/10 disabled:opacity-30"
    disabled={session.confrontationWitnessIds.length !== 2}
    onclick={session.performConfrontation}>Confronter les versions</button
  >
  {#if session.confrontationResult}
    <div
      class="mt-4 border-l-2 px-4 py-3 {session.confrontationResult.tone === 'deduction'
        ? 'border-emerald-400 bg-emerald-400/[0.06]'
        : session.confrontationResult.tone === 'corroboration'
          ? 'border-sky-300 bg-sky-300/[0.05]'
          : 'border-amber-300 bg-amber-300/[0.05]'}"
      aria-live="polite"
    >
      <p class="text-sm font-semibold text-white">{session.confrontationResult.title}</p>
      <p class="mt-1 text-xs leading-relaxed text-white/60">
        {session.confrontationResult.finding}
      </p>
    </div>
  {/if}
</section>
