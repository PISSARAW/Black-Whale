<script lang="ts">
  import type { NenStatusHeader } from '@black-whale/nen-engine'

  export let status: NenStatusHeader

  const perspectiveLabels: Record<string, string> = {
    character: 'Personnage',
    omniscient: 'Omniscient',
    body: 'Corps',
    aura: 'Aura',
    apparent: 'Apparente',
  }
</script>

<!--
  Section 2 — top identity bar.
  Displays chapter, time, consciousness, body, perspective and aura level
  so the user always knows WHO they are following and HOW they perceive the world.
-->
<div class="nen-status-bar flex items-center gap-6 px-4 py-2 bg-bw-navy border-b border-bw-gold/30 text-xs font-mono text-gray-300 overflow-x-auto whitespace-nowrap">
  <!-- Chapitre / Heure -->
  <span class="text-bw-gold font-semibold">Ch. {status.chapterId}</span>
  {#if status.narrativeTime}
    <span class="text-gray-500">{status.narrativeTime}</span>
  {/if}

  <span class="text-gray-600">|</span>

  <!-- Conscience suivie -->
  <span title="Conscience suivie">
    <span class="text-gray-500">Conscience :</span>
    <span class="ml-1 text-white">{status.followedConsciousnessId}</span>
  </span>

  <!-- Corps occupé -->
  <span title="Corps occupé">
    <span class="text-gray-500">Corps :</span>
    <span
      class="ml-1"
      class:text-bw-scarlet={status.occupiedBodyId !== status.followedConsciousnessId}
      class:text-white={status.occupiedBodyId === status.followedConsciousnessId}
    >
      {status.occupiedBodyId}
    </span>
  </span>

  <!-- Identité perçue -->
  {#if status.perceivedAs !== status.occupiedBodyId}
    <span title="Perçu par les autres comme">
      <span class="text-gray-500">Perçu comme :</span>
      <span class="ml-1 text-bw-gold italic">{status.perceivedAs}</span>
    </span>
  {/if}

  <span class="text-gray-600">|</span>

  <!-- Perspective -->
  <span title="Mode de perspective">
    <span class="text-gray-500">Perspective :</span>
    <span class="ml-1 text-bw-gold">{perspectiveLabels[status.perspectiveMode] ?? status.perspectiveMode}</span>
  </span>

  <!-- Aura -->
  <span class="flex items-center gap-2 ml-auto" title="Aura restante">
    <span class="text-gray-500">Nen :</span>
    <span class="relative w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
      <span
        class="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
        class:bg-bw-gold={status.auraLevel > 30}
        class:bg-bw-scarlet={status.auraLevel <= 30}
        style="width: {status.auraLevel}%"
      ></span>
    </span>
    <span class:text-bw-scarlet={status.auraLevel <= 30} class:text-bw-gold={status.auraLevel > 30}>
      {status.auraLevel}%
    </span>
  </span>
</div>

<!-- Dissonance banner — shown when consciousness ≠ body -->
{#if status.occupiedBodyId !== status.followedConsciousnessId}
  <div class="bg-bw-scarlet/10 border-b border-bw-scarlet/40 text-bw-scarlet text-xs text-center py-1 font-mono">
    Vous êtes <strong>{status.followedConsciousnessId}</strong> —
    vous occupez le corps de <strong>{status.occupiedBodyId}</strong> —
    les autres vous perçoivent comme <strong>{status.perceivedAs}</strong>
  </div>
{/if}
