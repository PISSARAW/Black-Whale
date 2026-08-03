<script lang="ts">
  import type { ScenePhenomenon } from '$lib/investigation/geometry'
  import type { CaseSession } from '$lib/investigation/caseSession.svelte'

  let { session }: { session: CaseSession } = $props()
</script>

<section class="mb-5 overflow-hidden border border-[#d6b35a]/25 bg-black/35">
  <div class="grid min-h-44 sm:grid-cols-[0.72fr_1fr]">
    <div
      class="relative flex items-center justify-center overflow-hidden border-b border-white/10 p-6 sm:border-b-0 sm:border-r"
    >
      <div
        class="absolute inset-0 opacity-20"
        style:background={`radial-gradient(circle at center, ${session.replayFrame.stage === 'death' ? '#7f1d1d' : '#d6b35a'}, transparent 65%)`}
      ></div>
      <div class="relative text-center">
        <p class="font-mono text-5xl text-white">
          {session.replayFrame.second.toString().padStart(2, '0')}
        </p>
        <p class="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-[#d6b35a]">seconde</p>
        <div
          class="mt-4 flex justify-center gap-1.5"
          aria-label={`${session.replayFrame.snakes} créatures actives`}
        >
          {#each Array(4) as _, index (index)}<span
              class="block h-6 w-1.5 rounded-full transition {index < session.replayFrame.snakes
                ? 'bg-[#e8f3f5] shadow-[0_0_8px_white]'
                : 'bg-white/10'}"
            ></span>{/each}
        </div>
        <div class="mt-4 h-1.5 w-28 overflow-hidden bg-white/10">
          <div
            class="h-full bg-red-500 transition-all"
            style:width={`${session.replayFrame.bloodLevel}%`}
          ></div>
        </div>
        <p class="mt-1 text-[8px] uppercase tracking-wider text-white/30">volume sanguin</p>
      </div>
    </div>
    <div class="flex flex-col justify-between p-5">
      <div>
        <p class="text-[9px] font-bold uppercase tracking-widest text-white/35">
          Reconstitution synchronisée
        </p>
        <h3 class="mt-2 font-serif text-2xl text-white">{session.replayFrame.title}</h3>
        <p class="mt-2 text-sm leading-relaxed text-white/55">
          {session.replayFrame.description}
        </p>
      </div>
      <div class="mt-5">
        <input
          class="w-full accent-[#d6b35a]"
          type="range"
          min="0"
          max="11"
          step="1"
          value={session.replaySecond}
          oninput={(event) => session.seekReplay(Number(event.currentTarget.value))}
          aria-label="Seconde de la reconstitution"
        />
        <div class="mt-3 flex items-center justify-between">
          <button
            class="border border-[#d6b35a]/60 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#e8cc84] hover:bg-[#d6b35a]/10"
            onclick={session.toggleReplay}
            >{session.replayPlaying
              ? 'Pause'
              : session.replaySecond >= 11
                ? 'Rejouer'
                : 'Lecture'}</button
          >
          <span class="font-mono text-[9px] text-white/30">00:00 — 00:11</span>
        </div>
      </div>
    </div>
  </div>
</section>
<section class="mb-8 border border-white/10 bg-white/[0.02] p-4">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p class="text-[10px] font-bold uppercase tracking-widest text-[#d6b35a]">
        Plan des lignes de vue
      </p>
      <p class="mt-1 text-xs text-white/40">Position relative au moment de l’attaque</p>
    </div>
    <div class="flex border border-white/10">
      {#each [['doll', 'Poupée'], ['snakes', 'Créatures']] as layer (layer[0])}
        <button
          class="px-3 py-2 text-[9px] font-bold uppercase tracking-wider {session.scenePhenomenon ===
          layer[0]
            ? 'bg-[#d6b35a]/15 text-[#f0cf76]'
            : 'text-white/35 hover:text-white'}"
          onclick={() => (session.scenePhenomenon = layer[0] as ScenePhenomenon)}>{layer[1]}</button
        >
      {/each}
    </div>
  </div>
  <svg
    class="mt-4 h-auto w-full border border-white/5 bg-black/35"
    viewBox="0 0 400 260"
    role="img"
    aria-label={`Lignes de vue · ${session.scenePhenomenon === 'doll' ? 'poupée' : 'créatures'}`}
  >
    <rect x="8" y="8" width="384" height="244" rx="4" fill="none" stroke="rgba(255,255,255,.12)" />
    {#each session.planSightLines as line (`${line.observerId}-${line.targetId}`)}
      {@const from = session.planNodeById.get(line.observerId)}
      {@const to = session.planNodeById.get(line.targetId)}
      {#if from && to}
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={session.scenePhenomenon === 'doll' ? '#d6b35a' : '#7dd3fc'}
          stroke-width="1.5"
          stroke-dasharray={session.scenePhenomenon === 'doll' ? '4 3' : 'none'}
          opacity=".7"
        />
      {/if}
    {/each}
    {#each session.planNodes as node (node.id)}
      <g>
        <circle
          cx={node.x}
          cy={node.y}
          r={node.isDead ? 10 : 7}
          fill={node.isDead ? '#7f1d1d' : '#182126'}
          stroke={node.id === 'loberry' && session.scenePhenomenon === 'doll'
            ? '#d6b35a'
            : 'rgba(255,255,255,.45)'}
          stroke-width="1.5"
        />
        <text
          x={node.x}
          y={node.y + 19}
          text-anchor="middle"
          fill="rgba(255,255,255,.65)"
          font-size="8">{node.label}</text
        >
      </g>
    {/each}
    <text
      x="92"
      y="30"
      fill={session.scenePhenomenon === 'doll' ? '#d6b35a' : '#7dd3fc'}
      font-size="9"
    >
      {session.scenePhenomenon === 'doll'
        ? 'Poupée derrière Furykov · visible par Loberry seule'
        : 'Créatures matérialisées · visibles par tous'}
    </text>
  </svg>
</section>
<ol class="relative ml-2 border-l border-[#d6b35a]/30 pl-7">
  {#each [['T − 00:11', 'Loberry désigne une poupée que personne d’autre ne voit.', 'loberry-vision'], ['T − 00:08', 'Quatre créatures blanches se fixent au cou de Barrigen.', 'bill-testimony'], ['T + 00:00', 'Barrigen s’effondre, entièrement vidé de son sang.', 'wounds'], ['Après', 'Kurapika recherche un mécanisme de Nen.', 'nen-residue']] as event (event[2])}
    <li class="relative mb-8 last:mb-0">
      <span
        class="absolute -left-[2.08rem] top-1 h-2.5 w-2.5 rounded-full border border-[#d6b35a] {session.discoveredIds.includes(
          event[2],
        )
          ? 'bg-[#d6b35a]'
          : 'bg-[#0a0d0e]'}"
      ></span>
      <p class="font-mono text-[10px] text-[#d6b35a]">{event[0]}</p>
      <p
        class="mt-1 text-sm {session.discoveredIds.includes(event[2])
          ? 'text-white/75'
          : 'text-white/25 blur-[3px] select-none'}"
      >
        {event[1]}
      </p>
    </li>
  {/each}
</ol>
