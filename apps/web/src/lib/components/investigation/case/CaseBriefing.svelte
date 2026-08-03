<script lang="ts">
  import type { CaseSession } from '$lib/investigation/caseSession.svelte'
  import type { caseUi } from '$lib/investigation/caseLabels'

  let { session, ui }: { session: CaseSession; ui: ReturnType<typeof caseUi> } = $props()

  const investigation = $derived(session.investigation)
</script>

{#if session.briefingOpen}
  <div
    class="absolute inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#020617]/95 p-4 backdrop-blur-md"
  >
    <div
      class="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"
    ></div>

    <section
      class="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-sky-300/30 bg-[#0a0f1c]/90 shadow-[0_0_40px_rgba(56,189,248,0.15)] backdrop-blur-xl"
    >
      <div
        class="absolute inset-0 bg-gradient-to-br from-sky-400/5 via-transparent to-sky-600/5"
      ></div>

      <div class="relative border-b border-sky-900/50 p-6 sm:p-9">
        <div class="flex items-center gap-3">
          <span class="h-2 w-2 animate-pulse rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]"
          ></span>
          <p
            class="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-300 drop-shadow-[0_0_5px_rgba(56,189,248,0.5)]"
          >
            {ui.briefing}
          </p>
        </div>
        <h2 class="mt-4 text-4xl font-black text-white drop-shadow-md sm:text-6xl">
          {investigation.title}
        </h2>
        <p class="mt-4 max-w-2xl text-sm leading-relaxed text-sky-100/70">
          {ui.briefingBody}
        </p>
      </div>
      <div class="relative grid gap-7 bg-sky-950/10 p-6 sm:grid-cols-[1fr_0.8fr] sm:p-9">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-widest text-sky-500/70">
            {ui.mission}
          </p>
          <p class="mt-3 font-medium text-lg leading-relaxed text-sky-50">
            {investigation.objective}
          </p>
          <div class="mt-6 rounded border border-amber-500/30 bg-amber-500/10 p-3">
            <p class="text-[10px] leading-relaxed text-amber-200/80">
              {ui.canonLimit}
            </p>
          </div>
        </div>
        <div class="rounded-xl border border-sky-800/30 bg-[#0a0f1c]/50 p-5">
          <p class="mb-4 text-[10px] font-bold uppercase tracking-widest text-sky-500/70">
            Objectifs d'investigation
          </p>
          <ol class="space-y-4">
            {#each investigation.objectives as objective, index (objective.id)}
              <li class="flex gap-3 text-sm text-sky-100/80">
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-900/50 font-mono text-[10px] text-sky-300 shadow-[inset_0_0_5px_rgba(56,189,248,0.2)]"
                  >0{index + 1}</span
                >
                <span class="leading-snug">{objective.label}</span>
              </li>
            {/each}
          </ol>
        </div>
      </div>
      <div
        class="relative flex flex-wrap items-center justify-between gap-4 border-t border-sky-900/50 bg-[#0a0f1c]/90 px-6 py-5 sm:px-9"
      >
        <p class="flex items-center gap-2 text-[9px] uppercase tracking-wider text-sky-500/50">
          <svg
            class="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            ><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline
              points="17 21 17 13 7 13 7 21"
            /><polyline points="7 3 7 8 15 8" /></svg
          >
          {ui.saved}
        </p>
        <button
          class="group relative overflow-hidden rounded-lg bg-sky-400 px-8 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#020617] shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all hover:bg-sky-300 hover:shadow-[0_0_25px_rgba(56,189,248,0.6)]"
          onclick={session.startInvestigation}
        >
          <span
            class="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"
          ></span>
          GAIN
        </button>
      </div>
    </section>
  </div>
{/if}
