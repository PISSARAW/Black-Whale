<script lang="ts">
  import type { CaseSession } from '$lib/investigation/caseSession.svelte'
  import type { caseUi } from '$lib/investigation/caseLabels'

  let { session, ui }: { session: CaseSession; ui: ReturnType<typeof caseUi> } = $props()

  const investigation = $derived(session.investigation)
</script>

{#if session.reportOpen && session.finalReport}
  <div class="absolute inset-0 z-[65] overflow-y-auto bg-[#020617]/96 p-4 backdrop-blur-md sm:p-8">
    <div
      class="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"
    ></div>

    <article
      class="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border-2 border-emerald-400/30 bg-[#0a0f1c]/95 shadow-[0_0_50px_rgba(52,211,153,0.15)]"
    >
      <div
        class="absolute inset-0 bg-gradient-to-br from-emerald-400/5 via-transparent to-emerald-900/10 pointer-events-none"
      ></div>

      <header
        class="relative flex items-start justify-between gap-5 border-b border-emerald-900/50 bg-[#060b14] p-6 sm:p-9"
      >
        <div>
          <div class="flex items-center gap-3">
            <span
              class="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"
            ></span>
            <p
              class="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]"
            >
              {ui.report.final} · {session.finalReport.caseId}
            </p>
          </div>
          <h2 class="mt-4 font-black text-4xl text-white drop-shadow-md sm:text-5xl">
            {session.finalReport.title}
          </h2>
          <p
            class="mt-3 inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300"
          >
            {session.finalReport.disposition}
          </p>
        </div>
        <button
          class="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-900/30 text-emerald-300 transition-all hover:bg-emerald-400/20 hover:text-white hover:shadow-[0_0_15px_rgba(52,211,153,0.5)]"
          aria-label={ui.report.close}
          onclick={() => (session.reportOpen = false)}
          ><svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"><path d="M18 6L6 18M6 6l12 12" /></svg
          ></button
        >
      </header>

      <div class="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p class="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            {ui.report.retained}
          </p>
          <ol class="mt-6 space-y-5 border-l-2 border-emerald-900/50 pl-7">
            {#each session.finalReport.mechanism as step, index (index)}
              <li class="relative text-sm leading-relaxed text-emerald-50">
                <span
                  class="absolute -left-[2.15rem] flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400 bg-emerald-950 font-black text-[10px] text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                  >{index + 1}</span
                >{step}
              </li>
            {/each}
          </ol>

          <div class="mt-10 grid gap-4 sm:grid-cols-3">
            {#each session.reportGroups as group (group.label)}
              <div class="rounded-xl border border-sky-900/40 bg-sky-950/20 p-4">
                <p class="text-[9px] font-bold uppercase tracking-wider {group.tone}">
                  {group.label} · {group.evidence.length}
                </p>
                <ul class="mt-3 space-y-2">
                  {#each group.evidence as evidence (evidence.id)}<li
                      class="text-xs leading-snug text-sky-100/60"
                    >
                      {evidence.title}
                    </li>{/each}
                </ul>
              </div>
            {/each}
          </div>
        </section>

        <aside class="space-y-6">
          <section
            class="rounded-xl border-l-4 border-red-400 bg-red-950/20 p-5 shadow-[0_0_15px_rgba(248,113,113,0.1)]"
          >
            <p class="text-[10px] font-bold uppercase tracking-widest text-red-400">
              {ui.report.unknowns}
            </p>
            <ul class="mt-4 space-y-3">
              {#each session.finalReport.unknowns as unknown, index (index)}<li
                  class="flex gap-3 text-sm leading-relaxed text-red-100/80"
                >
                  <span
                    class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-900/50 text-[10px] font-bold text-red-300"
                    >?</span
                  >
                  <span>{unknown}</span>
                </li>{/each}
            </ul>
          </section>
          <section class="rounded-xl border border-sky-900/40 bg-sky-950/20 p-5">
            <p class="text-[10px] font-bold uppercase tracking-widest text-sky-500/50">
              {ui.report.rejected}
            </p>
            <ul class="mt-4 space-y-2">
              {#each session.finalReport.rejectedHypotheses as hypothesis, index (index)}<li
                  class="flex gap-2 text-xs text-sky-100/50"
                >
                  <span class="text-sky-500/50">×</span>
                  {hypothesis}
                </li>{/each}
            </ul>
          </section>
          <div class="rounded border border-emerald-900/50 bg-emerald-950/20 p-4">
            <p class="text-[11px] leading-relaxed text-emerald-200/80">
              <span class="font-bold text-emerald-400">{ui.report.procedure} :</span>
              {ui.report.procedureBody(investigation.chapter)}
            </p>
          </div>
        </aside>
      </div>

      <footer
        class="relative flex flex-wrap items-center justify-between gap-4 border-t border-emerald-900/50 bg-[#060b14] px-6 py-5 sm:px-9"
      >
        <span class="text-[9px] font-bold uppercase tracking-wider text-emerald-500/50"
          >{ui.report.signed} · {investigation.investigator}</span
        >
        <div class="flex gap-3">
          <button
            class="rounded-lg border border-sky-900/50 bg-[#0a0f1c] px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-sky-400 transition-all hover:border-sky-500 hover:text-sky-300 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]"
            onclick={() => {
              session.reportOpen = false
              session.openNotebook('evidence')
            }}>{ui.report.review}</button
          ><button
            class="rounded-lg border border-emerald-400/50 bg-emerald-900/40 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 transition-all hover:bg-emerald-400/30 hover:shadow-[0_0_15px_rgba(52,211,153,0.4)]"
            onclick={() => (session.reportOpen = false)}>{ui.report.back}</button
          >
        </div>
      </footer>
    </article>
  </div>
{/if}
