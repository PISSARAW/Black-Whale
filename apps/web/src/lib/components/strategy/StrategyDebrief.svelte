<script lang="ts">
  let {
    won,
    turn,
    victoryPoints,
    reports,
    onrestart,
    oncontinue,
  }: {
    won: boolean
    turn: number
    victoryPoints: number
    reports: string[]
    onrestart: () => void
    oncontinue?: () => void
  } = $props()
</script>

<div
  class="mb-4 flex flex-col gap-3 rounded-xl border border-sky-500/50 bg-[#0a1018]/90 p-5 shadow-[0_0_20px_rgba(14,165,233,0.15)] backdrop-blur-md"
  role="status"
>
  <p class="text-[10px] font-bold uppercase tracking-widest text-sky-400">
    Rapport Final · Tour {turn}
  </p>
  <h2 class="text-2xl font-black text-white drop-shadow-md">
    {won ? 'Victoire Stratégique' : 'Opération Compromise'}
  </h2>
  <strong class="text-xs font-black uppercase tracking-widest text-amber-400"
    >{victoryPoints} point{victoryPoints > 1 ? 's' : ''} d'influence</strong
  >
  <div class="flex flex-col gap-1.5 rounded-lg border border-sky-900/40 bg-sky-950/20 p-3">
    {#each reports.slice(-4) as report (report)}<span
        class="text-[10px] leading-relaxed text-sky-200/70">› {report}</span
      >{/each}
  </div>
  <div class="mt-2 flex gap-3">
    <button
      class="rounded-lg border border-sky-900 bg-[#060b14] px-4 py-2 text-xs font-bold uppercase tracking-widest text-sky-100 transition-colors hover:border-sky-700 hover:bg-sky-900/40"
      type="button"
      onclick={onrestart}>Rejouer Scénario</button
    >
    {#if oncontinue}<button
        class="rounded-lg border border-sky-900 bg-[#060b14] px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-400 transition-colors hover:border-emerald-700 hover:bg-emerald-900/40"
        type="button"
        onclick={oncontinue}>Continuer Campagne</button
      >{/if}
  </div>
</div>
