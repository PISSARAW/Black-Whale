<script lang="ts">
  import type { CaseSession } from '$lib/investigation/caseSession.svelte'

  let { session }: { session: CaseSession } = $props()

  const investigation = $derived(session.investigation)
</script>

<div class="max-w-2xl">
  <p class="text-[10px] font-bold uppercase tracking-widest text-sky-400">
    Construire la conclusion
  </p>
  <h3 class="mt-2 font-black text-2xl text-white">
    Que s’est-il passé pendant ces onze secondes ?
  </h3>
  <p class="mt-2 text-sm leading-relaxed text-sky-200/50">
    Choisissez une hypothèse puis uniquement les éléments qui la soutiennent. Le verdict évaluera
    aussi les contradictions.
  </p>

  <div class="mt-6 space-y-3">
    {#each investigation.hypotheses as hypothesis (hypothesis.id)}
      {@const assessment = session.hypothesisAssessments[hypothesis.id]}
      <button
        class="w-full overflow-hidden rounded-xl border p-4 text-left transition-all {session.selectedHypothesisId ===
        hypothesis.id
          ? 'border-sky-400 bg-sky-900/50 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
          : 'border-sky-800/30 bg-[#0a0f1c]/50 hover:border-sky-500/50 hover:bg-sky-900/20'}"
        onclick={() => session.chooseHypothesis(hypothesis.id)}
      >
        <span class="flex items-center gap-4"
          ><span
            class="flex h-4 w-4 items-center justify-center rounded-full border {session.selectedHypothesisId ===
            hypothesis.id
              ? 'border-sky-400 bg-sky-400 shadow-[0_0_8px_#38bdf8]'
              : 'border-sky-700/50'}"
            ><span class="h-1.5 w-1.5 rounded-full bg-[#0a0f1c]"></span></span
          ><span class="flex-1 font-black text-lg text-white">{hypothesis.label}</span>
          <span
            class="font-mono text-[10px] uppercase tracking-wider {session.selectedHypothesisId ===
            hypothesis.id
              ? 'text-sky-300'
              : 'text-sky-500/40'}"
          >
            {assessment.status} · {assessment.score}%
          </span></span
        >
        {#if assessment.missingPropositionIds.length > 0}
          <span class="mt-3 block pl-8 text-[10px] uppercase tracking-widest text-amber-300/60">
            {assessment.missingPropositionIds.length} proposition{assessment.missingPropositionIds
              .length > 1
              ? 's'
              : ''} à établir
          </span>
        {/if}
      </button>
    {/each}
  </div>

  <p class="mt-8 text-[10px] font-bold uppercase tracking-widest text-sky-500/60">
    Pièces versées au raisonnement · {session.selectedEvidenceIds.length}
  </p>
  <div class="mt-4 grid gap-3 sm:grid-cols-2">
    {#each session.discoveredEvidence as evidence (evidence.id)}
      <button
        class="rounded-lg border p-4 text-left text-xs transition-all {session.selectedEvidenceIds.includes(
          evidence.id,
        )
          ? 'border-emerald-400/60 bg-emerald-900/40 text-emerald-100 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
          : 'border-sky-800/30 bg-[#0a0f1c]/50 text-sky-100/60 hover:border-sky-500/50 hover:bg-sky-900/20'}"
        onclick={() => session.toggleEvidence(evidence.id)}
      >
        <div class="flex items-start gap-3">
          <span
            class="mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border {session.selectedEvidenceIds.includes(
              evidence.id,
            )
              ? 'border-emerald-400 bg-emerald-500/20'
              : 'border-sky-700/50'}"
          >
            {#if session.selectedEvidenceIds.includes(evidence.id)}<svg
                class="h-2 w-2 text-emerald-400"
                viewBox="0 0 14 14"
                fill="none"
                ><path
                  d="M1 7l4 4 8-8"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                /></svg
              >{/if}
          </span>
          <span class="font-medium leading-relaxed">{evidence.title}</span>
        </div>
      </button>
    {/each}
  </div>

  <button
    class="mt-8 w-full rounded-xl bg-sky-400 px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#020617] shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all enabled:hover:bg-sky-300 enabled:hover:shadow-[0_0_25px_rgba(56,189,248,0.6)] disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
    disabled={!session.selectedHypothesisId || session.selectedEvidenceIds.length === 0}
    onclick={session.submitVerdict}>Soumettre (GAIN)</button
  >

  {#if session.verdict}
    <article
      class="mt-6 rounded-xl border-l-4 p-5 {session.verdict.status === 'solved'
        ? 'border-emerald-400 bg-emerald-950/40'
        : session.verdict.status === 'contradicted'
          ? 'border-red-400 bg-red-950/40'
          : 'border-amber-400 bg-amber-950/40'}"
      aria-live="polite"
    >
      <p
        class="text-[9px] font-bold uppercase tracking-widest {session.verdict.status === 'solved'
          ? 'text-emerald-400/70'
          : session.verdict.status === 'contradicted'
            ? 'text-red-400/70'
            : 'text-amber-400/70'}"
      >
        Analyse du raisonnement
      </p>
      <h4 class="mt-2 font-black text-2xl text-white">{session.verdict.title}</h4>
      <p class="mt-3 text-sm leading-relaxed text-white/80">{session.verdict.summary}</p>
      {#if session.verdict.contradictions.length > 0}<p
          class="mt-4 rounded bg-red-900/40 p-3 text-xs font-medium text-red-200"
        >
          Contradiction : {session.verdict.contradictions.map((item) => item.title).join(' · ')}
        </p>{/if}
      {#if session.verdict.missing.length > 0}<p
          class="mt-4 rounded bg-amber-900/40 p-3 text-xs font-medium text-amber-200"
        >
          À établir : {session.verdict.missing.map((item) => item.title).join(' · ')}
        </p>{/if}
      {#if session.verdict.status === 'solved'}<p
          class="mt-5 border-t border-emerald-400/20 pt-4 text-xs leading-relaxed text-emerald-100/80"
        >
          Limite épistémique : l’enquêteur peut démontrer l’usage d’un Nen dissimulé, mais pas
          encore nommer son utilisateur. La vérité du lecteur reste séparée du verdict.
        </p>{/if}
    </article>
  {/if}
</div>
