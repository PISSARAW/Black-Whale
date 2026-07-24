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
    narrativeTime: 'Jour 3, 14:22',
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
    { id: 'OBSERVE',             label: 'Observer',              status: 'completed' },
    { id: 'PREPARE_AURA',        label: 'Préparer l\'aura',      status: 'completed' },
    { id: 'SELECT_TARGET',       label: 'Sélectionner une cible', status: 'current',
      note: 'Cliquez sur un point d\'ancrage sur la carte' },
    { id: 'FILL_CONDITIONS',     label: 'Remplir les conditions', status: 'pending' },
    { id: 'ACTIVATE',            label: 'Activer',                status: 'pending' },
    { id: 'MAINTAIN',            label: 'Maintenir / diriger',    status: 'pending' },
    { id: 'PAY_COST',            label: 'Payer le coût',          status: 'pending' },
    { id: 'SUFFER_CONSEQUENCES', label: 'Subir les conséquences', status: 'pending' },
  ]

  const activeRules = [
    'Propriétés : caoutchouc + gomme',
    'Adhérence : active',
    'Extension max : 10 m',
    'Connexion : maintenue',
  ]

  const activeTargets: string[] = []
  const auraCost = 'Continu — faible par seconde'
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
            Glissez depuis un point d'origine pour tirer un filament d'aura
            et l'attacher à une cible.
          </p>
          <div class="font-mono text-xs text-left bg-bw-dark rounded p-3 text-gray-300 leading-relaxed">
            <p>[Hisoka] ──────────── [?]</p>
            <br />
            <p class="text-gray-500">Longueur : —</p>
            <p class="text-gray-500">Tension : —</p>
            <p class="text-gray-500">Adhérence : en attente</p>
          </div>
        </div>
        <p class="text-gray-700 text-xs italic">
          Carte interactive — à connecter au MapEngine
        </p>
      </div>
    </svelte:fragment>

    <svelte:fragment slot="timeline">
      <div class="flex items-center gap-3 px-4 h-full text-xs text-gray-500 font-mono overflow-x-auto">
        <span class="text-bw-gold shrink-0">Ch. 360</span>
        {#each ['Entrée sur le pont', 'Activation du En', '← Maintenant', 'Impact', 'Rétraction'] as evt, i}
          <span class:text-white={i === 2} class:text-bw-gold={i === 2}>{evt}</span>
          {#if i < 4}
            <span class="text-gray-700">──</span>
          {/if}
        {/each}
      </div>
    </svelte:fragment>
  </NenHUD>
</div>
