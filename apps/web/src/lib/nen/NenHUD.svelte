<script lang="ts">
  import type {
    NenStatusHeader,
    NenActionWheelEntry,
    NenCycleStep,
    ActionAvailability,
    AbilityInteractionManifest,
  } from '@black-whale/nen-engine'
  import { BASE_NEN_ACTIONS } from '@black-whale/nen-engine'

  import NenStatusBar from './NenStatusBar.svelte'
  import NenActionWheel from './NenActionWheel.svelte'
  import NenInteractionCycle from './NenInteractionCycle.svelte'
  import NenWhyPanel from './NenWhyPanel.svelte'

  // ── Props ───────────────────────────────────────────────
  export let status: NenStatusHeader
  export let wheelEntries: NenActionWheelEntry[] = []
  export let cycleSteps: NenCycleStep[] = []
  /** Active ability manifest — drives overlays and input mode label */
  export let activeManifest: AbilityInteractionManifest | null = null
  /** Active interaction rules shown in the right panel */
  export let activeRules: string[] = []
  /** Active targets */
  export let activeTargets: string[] = []
  /** Current aura cost string */
  export let auraCost = ''

  // ── Internal state ──────────────────────────────────────
  let whyPanelData: ActionAvailability | null = null

  // Merge base Nen actions (always visible as 'locked' placeholders when
  // the wheel has no entries) with ability-specific entries.
  $: mergedWheel = wheelEntries.length > 0
    ? wheelEntries
    : BASE_NEN_ACTIONS.map((a) => ({ ...a, visibility: 'locked' as const, hint: 'Aucune capacité active' }))

  function handleActionSelect(e: CustomEvent<NenActionWheelEntry>) {
    whyPanelData = null
    // Parent should handle actual action execution via slot/forwarding;
    // here we just surface a console note for demonstration.
    console.info('[NenHUD] Action selected:', e.detail)
  }

  function handleActionInspect(e: CustomEvent<NenActionWheelEntry>) {
    whyPanelData = {
      actionId: e.detail.id,
      available: false,
      conditions: [
        { label: 'Action reconnue', status: 'met' },
        { label: e.detail.hint ?? 'Condition non remplie', status: 'unmet' },
      ],
    }
  }

  const overlayLabels: Record<string, string> = {
    RANGE:        'Portée',
    TRAJECTORY:   'Trajectoire',
    AURA:         'Aura',
    TENSION:      'Tension',
    FUTURE:       'Futur',
    CONTROL_LINK: 'Lien de contrôle',
  }

  const inputModeLabels: Record<string, string> = {
    CLICK:            'Clic',
    DRAG:             'Glisser',
    HOLD:             'Maintenir',
    DRAW:             'Tracer',
    SEQUENCE:         'Séquence',
    TARGET_SELECTION: 'Sélection de cible',
    CUSTOM:           'Interface dédiée',
  }
</script>

<!--
  Section 2 — Main NEN HUD layout.

  ┌────────────────────────────────────────────────────┐
  │ NenStatusBar (chapter / identity / perspective)    │
  ├─────────────┬──────────────────────┬───────────────┤
  │ Left panel  │ Centre (map slot)    │ Right panel   │
  │ Capacités   │                      │ Règles actives│
  │ Action wheel│                      │ Cibles        │
  │ Cycle       │                      │ Coûts         │
  ├─────────────┴──────────────────────┴───────────────┤
  │ Chronologie (slot)                                 │
  └────────────────────────────────────────────────────┘
-->
<div class="nen-hud flex flex-col h-full bg-bw-dark text-white">

  <!-- TOP BAR -->
  <NenStatusBar {status} />

  <!-- BODY: three-column layout -->
  <div class="flex flex-1 overflow-hidden">

    <!-- LEFT PANEL: abilities / action wheel / cycle -->
    <aside class="flex flex-col gap-3 p-3 w-56 border-r border-bw-gold/20 overflow-y-auto shrink-0">

      <!-- Active ability info -->
      {#if activeManifest}
        <div class="bg-bw-navy border border-bw-gold/30 rounded p-2 text-xs">
          <div class="text-bw-gold font-bold mb-1 truncate">{activeManifest.abilityId}</div>
          <div class="text-gray-400">
            Mode : <span class="text-white">{inputModeLabels[activeManifest.inputMode] ?? activeManifest.inputMode}</span>
          </div>
          {#if activeManifest.overlays.length > 0}
            <div class="text-gray-400 mt-0.5">
              Superpositions :
              <span class="text-white">{activeManifest.overlays.map(o => overlayLabels[o] ?? o).join(', ')}</span>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Action wheel -->
      <NenActionWheel
        entries={mergedWheel}
        on:select={handleActionSelect}
        on:inspect={handleActionInspect}
      />

      <!-- Why panel (inline below wheel) -->
      {#if whyPanelData}
        <NenWhyPanel
          availability={whyPanelData}
          perspectiveMode={status.perspectiveMode}
          on:close={() => (whyPanelData = null)}
        />
      {/if}

      <!-- Interaction cycle -->
      {#if cycleSteps.length > 0}
        <NenInteractionCycle steps={cycleSteps} />
      {/if}
    </aside>

    <!-- CENTRE: map slot -->
    <main class="flex-1 overflow-hidden relative">
      <slot name="map">
        <div class="flex items-center justify-center h-full text-gray-600 text-sm italic select-none">
          Carte non disponible
        </div>
      </slot>
    </main>

    <!-- RIGHT PANEL: active rules, targets, costs -->
    <aside class="flex flex-col gap-3 p-3 w-52 border-l border-bw-gold/20 overflow-y-auto shrink-0">

      <!-- Active rules -->
      {#if activeRules.length > 0}
        <div class="bg-bw-navy border border-bw-gold/20 rounded p-2 text-xs">
          <div class="text-bw-gold font-bold mb-1 tracking-wider">RÈGLES ACTIVES</div>
          <ul class="flex flex-col gap-0.5">
            {#each activeRules as rule}
              <li class="text-gray-300 before:content-['·'] before:mr-1 before:text-bw-gold">{rule}</li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- Active targets -->
      {#if activeTargets.length > 0}
        <div class="bg-bw-navy border border-bw-gold/20 rounded p-2 text-xs">
          <div class="text-bw-gold font-bold mb-1 tracking-wider">CIBLES</div>
          <ul class="flex flex-col gap-0.5">
            {#each activeTargets as t}
              <li class="text-gray-300">{t}</li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- Aura cost -->
      {#if auraCost}
        <div class="bg-bw-navy border border-bw-gold/20 rounded p-2 text-xs">
          <div class="text-bw-gold font-bold mb-1 tracking-wider">COÛT</div>
          <p class="text-gray-300">{auraCost}</p>
        </div>
      {/if}

      <!-- Perspective transition hint -->
      {#if activeManifest?.perspectiveTransition}
        {@const pt = activeManifest.perspectiveTransition}
        <div class="bg-bw-navy border border-bw-gold/20 rounded p-2 text-xs">
          <div class="text-bw-gold font-bold mb-1 tracking-wider">PERSPECTIVE</div>
          <ul class="flex flex-col gap-0.5 text-gray-300">
            {#if pt.canChangeBody}
              <li>● Changement de corps possible</li>
            {/if}
            {#if pt.canChangeConsciousness}
              <li>● Transfert de conscience possible</li>
            {/if}
            {#if pt.canFollowAura}
              <li>● Suivre l'entité d'aura</li>
            {/if}
          </ul>
        </div>
      {/if}

      <slot name="right-extra" />
    </aside>
  </div>

  <!-- BOTTOM: timeline slot -->
  <footer class="border-t border-bw-gold/20 h-16 shrink-0">
    <slot name="timeline">
      <div class="flex items-center justify-center h-full text-gray-700 text-xs italic select-none">
        Chronologie
      </div>
    </slot>
  </footer>
</div>
