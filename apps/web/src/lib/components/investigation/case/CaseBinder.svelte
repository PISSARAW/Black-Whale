<script lang="ts">
  import type { InvestigationTab } from '$lib/investigation/case'
  import type { CaseSession } from '$lib/investigation/caseSession.svelte'
  import type { caseUi } from '$lib/investigation/caseLabels'
  import CaseEvidenceTab from './CaseEvidenceTab.svelte'
  import CasePeopleTab from './CasePeopleTab.svelte'
  import CaseTimelineTab from './CaseTimelineTab.svelte'
  import CaseDeductionTab from './CaseDeductionTab.svelte'

  /** The binder: four tabs over one case, and the visitor's own copy of it. */
  let { session, ui }: { session: CaseSession; ui: ReturnType<typeof caseUi> } = $props()

  const investigation = $derived(session.investigation)
</script>

{#if session.notebookOpen}
  <button
    class="absolute inset-0 z-40 bg-sky-950/80 backdrop-blur-md transition-all"
    aria-label={ui.closeNotebook}
    onclick={() => (session.notebookOpen = false)}
  ></button>
  <div
    class="absolute left-1/2 top-1/2 z-50 flex h-[90vh] w-full max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border-2 border-sky-300/30 bg-[#0a0f1c]/95 shadow-[0_0_50px_rgba(56,189,248,0.2)]"
    role="dialog"
    aria-modal="true"
    aria-label={ui.binder}
  >
    <div
      class="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"
    ></div>

    <header
      class="relative flex items-start justify-between border-b border-sky-900/50 bg-[#020617] p-5 sm:p-7"
    >
      <div class="flex items-center gap-4">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-full border-2 border-sky-400 bg-sky-900/50 shadow-[0_0_15px_#38bdf8]"
        >
          <svg
            class="h-6 w-6 text-sky-100"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            ><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path
              d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
            /></svg
          >
        </div>
        <div>
          <p
            class="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-400 drop-shadow-[0_0_5px_rgba(56,189,248,0.5)]"
          >
            {investigation.investigator} · BINDER
          </p>
          <h2 class="mt-1 font-black tracking-tight text-3xl text-white drop-shadow-md sm:text-4xl">
            {investigation.subtitle}
          </h2>
        </div>
      </div>
      <button
        class="flex h-10 w-10 items-center justify-center rounded-full border border-sky-400/30 bg-sky-900/30 text-sky-300 transition-all hover:bg-sky-400/20 hover:text-white hover:shadow-[0_0_15px_rgba(56,189,248,0.5)]"
        onclick={() => (session.notebookOpen = false)}
        aria-label={ui.close}
        ><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          ><path d="M18 6L6 18M6 6l12 12" /></svg
        ></button
      >
    </header>

    <nav
      class="relative grid grid-cols-2 border-b border-sky-900/50 bg-[#020617]/80 sm:grid-cols-4"
      aria-label={ui.binderSections}
    >
      {#each ui.tabs as tab (tab[0])}
        <button
          class="group relative border-r border-sky-900/50 px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all sm:text-[11px] {session.activeTab ===
          tab[0]
            ? 'bg-sky-400/10 text-sky-300 shadow-[inset_0_-2px_0_#38bdf8]'
            : 'text-sky-500/50 hover:bg-sky-900/30 hover:text-sky-300'}"
          onclick={() => session.selectNotebookTab(tab[0] as InvestigationTab)}
        >
          {#if session.activeTab === tab[0]}
            <span class="absolute inset-0 bg-gradient-to-t from-sky-400/20 to-transparent"></span>
          {/if}
          <span class="relative z-10 drop-shadow-md">{tab[1]}</span>
        </button>
      {/each}
    </nav>

    <div class="relative flex-1 overflow-y-auto p-5 sm:p-7">
      {#if session.activeTab === 'evidence'}
        <CaseEvidenceTab {session} {ui} />
      {:else if session.activeTab === 'people'}
        <CasePeopleTab {session} {ui} />
      {:else if session.activeTab === 'timeline'}
        <CaseTimelineTab {session} {ui} />
      {:else}
        <CaseDeductionTab {session} {ui} />
      {/if}
    </div>

    <footer
      class="relative flex items-center justify-between border-t border-sky-900/50 bg-[#020617] px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-sky-500/50 sm:px-7"
    >
      <span>{ui.perspective} · {investigation.investigator}</span>
      <span class="flex items-center gap-5"
        ><button
          class="text-sky-400/50 transition-colors hover:text-red-400"
          onclick={session.resetInvestigation}>{ui.reset}</button
        ><span>{ui.spoilers} · ch. {investigation.chapter}</span></span
      >
    </footer>
  </div>
{/if}
