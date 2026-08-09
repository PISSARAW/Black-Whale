<script lang="ts">
  import { questionIsAvailable } from '$lib/investigation/interrogation'
  import type { InterviewStance } from '$lib/investigation/interview'
  import { activeHatsu, emperorTimeLifeHours } from '$lib/nen/hatsuState'
  import type { CaseSession } from '$lib/investigation/caseSession.svelte'
  import type { caseUi } from '$lib/investigation/caseLabels'

  let { session, ui }: { session: CaseSession; ui: ReturnType<typeof caseUi> } = $props()
</script>

{#if session.activeSubject}
  <button
    class="absolute inset-0 z-40 cursor-default bg-black/30"
    aria-label={ui.closeTestimony}
    onclick={() => (session.activeSubjectId = null)}
  ></button>
  <div
    class="absolute bottom-2 left-1/2 z-50 max-h-[calc(100vh-1rem)] w-[calc(100%-1rem)] max-w-3xl -translate-x-1/2 overflow-y-auto border border-white/20 bg-[#0b1012]/95 p-4 shadow-2xl backdrop-blur-md sm:bottom-5 sm:w-[calc(100%-2rem)] sm:p-7"
    role="dialog"
    aria-modal="true"
    aria-labelledby="subject-name"
  >
    <div class="flex items-start justify-between gap-5">
      <div>
        <p class="text-[9px] font-bold uppercase tracking-[0.24em] text-[#d6b35a]">
          {session.activeSubject.role}
        </p>
        <h2 id="subject-name" class="mt-1 font-serif text-2xl text-white">
          {session.activeSubject.name}
        </h2>
        <p class="mt-1 text-xs text-white/45">{session.activeSubject.status}</p>
      </div>
      <button
        class="px-2 text-2xl text-white/45 hover:text-white"
        onclick={() => (session.activeSubjectId = null)}
        aria-label={ui.close}>×</button
      >
    </div>
    <blockquote
      class="mt-5 border-l border-[#d6b35a]/50 pl-4 font-serif text-lg leading-relaxed text-white/85"
    >
      « {session.activeSubject.dialogue} »
    </blockquote>
    {#if session.activeSubject.questions.length > 0}
      <fieldset class="mt-5">
        <legend class="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
          {ui.approach}
        </legend>
        <div class="mt-2 flex flex-wrap gap-2">
          {#each ['neutral', 'empathetic', 'pressing', 'accusatory'] as stance (stance)}
            <button
              type="button"
              aria-pressed={session.interviewStance === stance}
              class="min-h-9 border px-3 text-[10px] font-bold uppercase tracking-wider transition {session.interviewStance ===
              stance
                ? 'border-[#d6b35a] bg-[#d6b35a]/15 text-[#f2d98c]'
                : 'border-white/10 text-white/45 hover:border-white/30 hover:text-white/75'}"
              onclick={() => (session.interviewStance = stance as InterviewStance)}
              >{ui.stances[stance as InterviewStance]}</button
            >
          {/each}
        </div>
      </fieldset>
      <div class="mt-5 grid gap-2 sm:grid-cols-2">
        {#each session.activeSubject.questions as question (question.id)}
          {@const available = questionIsAvailable(question, session.discoveredIds)}
          {@const asked = session.askedQuestionKeys.includes(
            `${session.activeSubject.id}:${question.id}`,
          )}
          <button
            class="border p-3 text-left text-xs transition {asked
              ? 'border-emerald-400/35 bg-emerald-400/[0.06] text-emerald-100'
              : available
                ? 'border-white/20 text-white/75 hover:border-[#d6b35a]/60'
                : 'cursor-not-allowed border-white/5 text-white/25'}"
            disabled={!available}
            onclick={() => session.askQuestion(question.id)}
          >
            <span class="block">{asked ? '✓ ' : ''}{question.prompt}</span>
            {#if !available}<span class="mt-1 block text-[9px] uppercase tracking-wider"
                >{ui.needsEvidence}</span
              >{/if}
          </button>
        {/each}
      </div>
    {/if}
    {#if session.activeResponse}
      <div
        class="mt-3 border-l-2 border-[#d6b35a] bg-[#d6b35a]/[0.06] px-4 py-3 text-sm leading-relaxed text-white/70"
        aria-live="polite"
      >
        « {session.activeResponse} »
      </div>
    {/if}
    <div class="mt-5 border border-white/10 bg-black/25 p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
            {ui.nenAnalysis}
          </p>
          <p class="mt-1 text-sm font-semibold" style:color={$activeHatsu?.color ?? '#ffffff'}>
            {$activeHatsu?.name ?? ui.noHatsu}
          </p>
        </div>
        <button
          class="border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition {$activeHatsu
            ? 'border-white/30 text-white hover:border-white/60'
            : 'border-[#d6b35a]/50 text-[#e8cc84] hover:bg-[#d6b35a]/10'}"
          onclick={session.useActiveHatsu}>{$activeHatsu ? ui.useTarget : ui.chooseHatsu}</button
        >
      </div>
      {#if session.hatsuResult}
        <div
          class="mt-4 border-l-2 pl-3 {session.hatsuResult.tone === 'success'
            ? 'border-emerald-400'
            : session.hatsuResult.tone === 'forbidden'
              ? 'border-red-400'
              : 'border-amber-300'}"
          aria-live="polite"
        >
          <p class="text-xs font-semibold text-white">{session.hatsuResult.title}</p>
          <p class="mt-1 text-xs leading-relaxed text-white/55">{session.hatsuResult.finding}</p>
          {#if session.hatsuResult.lifeHours > 0}<p
              class="mt-2 font-mono text-[9px] uppercase tracking-wider text-red-200"
            >
              {ui.lifeConsumed(session.hatsuResult.lifeHours, $emperorTimeLifeHours)}
            </p>{/if}
        </div>
      {/if}
    </div>
    {#if session.activeSubject.evidenceIds.length > 0}
      <div
        class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4"
      >
        <p class="text-xs text-emerald-200">
          {ui.recorded(session.activeSubject.evidenceIds.length)}
        </p>
        <button
          class="border border-[#d6b35a]/50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#e8cc84] hover:bg-[#d6b35a]/10"
          onclick={() => session.openNotebook('evidence')}>{ui.inspectNotebook}</button
        >
      </div>
    {/if}
  </div>
{/if}
