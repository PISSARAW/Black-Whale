<script lang="ts">
  import type { Evidence } from '$lib/investigation/case'
  import type { CaseSession } from '$lib/investigation/caseSession.svelte'
  import type { caseUi } from '$lib/investigation/caseLabels'

  let { session, ui }: { session: CaseSession; ui: ReturnType<typeof caseUi> } = $props()

  const investigation = $derived(session.investigation)

  function evidenceTone(evidence: Evidence) {
    if (evidence.truthStatus === 'CONFIRMED')
      return 'border-emerald-400/50 bg-emerald-950/40 text-emerald-300'
    if (evidence.truthStatus === 'CONTESTED') return 'border-red-400/50 bg-red-950/40 text-red-300'
    return 'border-sky-400/50 bg-sky-950/40 text-sky-300'
  }
</script>

<div
  class="mb-6 flex items-end justify-between gap-4 rounded-xl border border-sky-900/50 bg-sky-950/20 p-5"
>
  <div>
    <p class="text-[10px] font-bold uppercase tracking-widest text-sky-400">
      {ui.collected}
    </p>
    <p class="mt-1 text-xs text-sky-200/50">
      {ui.sourceCaution}
    </p>
  </div>
  <div class="flex items-center gap-3">
    <span class="text-2xl font-black text-white">{session.discoveredIds.length}</span>
    <span class="text-xl font-light text-sky-700">/</span>
    <span class="text-xl font-bold text-sky-500/50">{investigation.evidence.length}</span>
  </div>
</div>

{#if session.discoveredEvidence.length === 0}
  <div
    class="flex flex-col items-center justify-center rounded-xl border border-dashed border-sky-800/30 bg-sky-950/10 py-16 text-center text-sky-500/40"
  >
    <svg
      class="mb-4 h-12 w-12 opacity-20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      ><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line
        x1="12"
        y1="8"
        x2="12"
        y2="16"
      /><line x1="8" y1="12" x2="16" y2="12" /></svg
    >
    <p class="text-sm font-medium">{ui.emptyNotebook}</p>
  </div>
{:else}
  <!-- Cards Grid (Greed Island Binder Slots) -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each session.discoveredEvidence as evidence (evidence.id)}
      <article
        class="group relative flex flex-col overflow-hidden rounded-xl border border-sky-700/30 bg-gradient-to-b from-[#0f172a] to-[#020617] p-1 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]"
      >
        <div
          class="absolute inset-0 bg-gradient-to-tr from-sky-400/0 via-sky-400/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        ></div>
        <div
          class="relative flex flex-1 flex-col rounded-lg border border-white/5 bg-[#0a0f1c]/90 p-4"
        >
          <div class="mb-3 flex items-start justify-between gap-2">
            <span
              class="inline-flex items-center justify-center rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest {evidenceTone(
                evidence,
              )}"
            >
              {ui.evidence.statuses[evidence.truthStatus]}
            </span>
            <span class="text-[9px] font-mono text-sky-500/50"
              >#{evidence.id.slice(0, 4).toUpperCase()}</span
            >
          </div>

          <h3 class="font-black text-white">{evidence.title}</h3>
          <p class="mt-2 flex-1 text-xs leading-relaxed text-sky-100/70">
            {evidence.claim}
          </p>

          <div class="mt-4 border-t border-sky-900/50 pt-3">
            <p class="text-[9px] uppercase tracking-wider text-sky-400/50">
              {evidence.source} · ch. {evidence.chapter}
            </p>
          </div>
        </div>
      </article>
    {/each}

    <!-- Empty Slots to simulate GI Binder pages -->
    {#each Array(Math.max(0, Math.ceil(session.discoveredEvidence.length / 3) * 3 - session.discoveredEvidence.length)) as _, index (index)}
      <div class="rounded-xl border border-dashed border-sky-900/30 bg-sky-950/5"></div>
    {/each}
  </div>
{/if}
{#if session.log.length > 0}
  <div class="mt-8 border-t border-sky-900/50 pt-5">
    <p class="text-[10px] font-bold uppercase tracking-widest text-sky-500/50">{ui.evidence.log}</p>
    <ol class="mt-3 space-y-2">
      {#each [...session.log].reverse().slice(0, 8) as entry, index (index)}
        <li class="flex items-center gap-3 text-xs text-sky-100/50">
          <span class="w-20 shrink-0 font-mono text-[9px] uppercase tracking-wider text-sky-400/70"
            >{ui.evidence.logKinds[entry.kind]}</span
          ><span>{entry.label}</span>
        </li>
      {/each}
    </ol>
  </div>
{/if}
