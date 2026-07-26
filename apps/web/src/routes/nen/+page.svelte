<script lang="ts">
  import type {
    NenStatusHeader,
    NenActionWheelEntry,
    NenCycleStep,
  } from '@black-whale/nen-engine'
  import { bungeeGum } from '@black-whale/ability-modules'
  import { NenHUD } from '$lib/nen/index.js'

  // ── Demo context ───────────────────────────────────────
  // This page demonstrates the Nen interaction grammar with
  // Hisoka's Bungee Gum as the active ability.

  const status: NenStatusHeader = {
    chapterId: '360',
    narrativeTime: 'Day 3, 14:22',
    followedConsciousnessId: 'hisoka',
    occupiedBodyId: 'hisoka',
    perspectiveMode: 'character',
    perceivedAs: 'hisoka',
    auraLevel: 72,
  }

  const manifest = bungeeGum.getInteractionManifest()
  const wheelEntries: NenActionWheelEntry[] = bungeeGum.getActionWheel({
    abilityId: 'bungee-gum',
    actorId: 'hisoka',
    targets: [],
    eventId: 'event-360-01',
  })

  // Section 3 — universal cycle demo state for Bungee Gum
  const cycleSteps: NenCycleStep[] = [
    { id: 'OBSERVE',             label: 'Observe',              status: 'completed' },
    { id: 'PREPARE_AURA',        label: 'Prepare aura',         status: 'completed' },
    { id: 'SELECT_TARGET',       label: 'Select a target',      status: 'current',
      note: 'Click an anchor point on the map' },
    { id: 'FILL_CONDITIONS',     label: 'Meet conditions',      status: 'pending' },
    { id: 'ACTIVATE',            label: 'Activate',             status: 'pending' },
    { id: 'MAINTAIN',            label: 'Maintain / direct',    status: 'pending' },
    { id: 'PAY_COST',            label: 'Pay the cost',         status: 'pending' },
    { id: 'SUFFER_CONSEQUENCES', label: 'Face consequences',   status: 'pending' },
  ]

  const activeRules = [
    'Properties: rubber + gum',
    'Adhesion: active',
    'Maximum extension: 10 m',
    'Connection: maintained',
  ]

  const activeTargets: string[] = []
  const auraCost = 'Continuous — low per second'
</script>

<svelte:head>
  <title>Nen — Black Whale</title>
</svelte:head>

<!-- Full-height HUD demo -->
<div style="height: calc(100vh - 3.5rem)">
  <NenHUD
    {status}
    wheelEntries={wheelEntries}
    cycleSteps={cycleSteps}
    activeManifest={manifest}
    {activeRules}
    {activeTargets}
    {auraCost}
  >
    <svelte:fragment slot="map">
      <!-- Placeholder map with a Bungee Gum canvas hint -->
      <div class="flex flex-col items-center justify-center h-full gap-4 select-none">
        <div class="border border-bw-gold/20 rounded-lg p-6 text-center max-w-sm">
          <p class="text-bw-gold font-semibold mb-2">Bungee Gum — Hisoka</p>
          <p class="text-gray-400 text-sm mb-4">
            Drag from an origin point to draw out an aura strand
            and attach it to a target.
          </p>
          <div class="font-mono text-xs text-left bg-bw-dark rounded p-3 text-gray-300 leading-relaxed">
            <p>[Hisoka] ──────────── [?]</p>
            <br />
            <p class="text-gray-500">Length: —</p>
            <p class="text-gray-500">Tension: —</p>
            <p class="text-gray-500">Adhesion: pending</p>
          </div>
        </div>
        <p class="text-gray-700 text-xs italic">
          Interactive map — pending MapEngine connection
        </p>
      </div>
    </svelte:fragment>

    <svelte:fragment slot="timeline">
      <div class="flex items-center gap-3 px-4 h-full text-xs text-gray-500 font-mono overflow-x-auto">
        <span class="text-bw-gold shrink-0">Ch. 360</span>
        {#each ['Enter the deck', 'Activate En', '← Now', 'Impact', 'Retraction'] as evt, i}
          <span class:text-white={i === 2} class:text-bw-gold={i === 2}>{evt}</span>
          {#if i < 4}
            <span class="text-gray-700">──</span>
          {/if}
        {/each}
      </div>
    </svelte:fragment>
  </NenHUD>
</div>
