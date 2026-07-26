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
    : BASE_NEN_ACTIONS.map((a) => ({ ...a, visibility: 'locked' as const, hint: 'No active ability' }))

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
        { label: 'Recognized action', status: 'met' },
        { label: e.detail.hint ?? 'Unmet condition', status: 'unmet' },
      ],
    }
  }

  const overlayLabels: Record<string, string> = {
    RANGE:        'Range',
    TRAJECTORY:   'Trajectory',
    AURA:         'Aura',
    TENSION:      'Tension',
    FUTURE:       'Future',
    CONTROL_LINK: 'Control link',
  }

  const inputModeLabels: Record<string, string> = {
    CLICK:            'Click',
    DRAG:             'Drag',
    HOLD:             'Hold',
    DRAW:             'Draw',
    SEQUENCE:         'Sequence',
    TARGET_SELECTION: 'Target selection',
    CUSTOM:           'Custom interface',
  }
</script>

<!--
  Section 2 — Main NEN HUD layout.

  ┌────────────────────────────────────────────────────┐
  │ NenStatusBar (chapter / identity / perspective)    │
  ├─────────────┬──────────────────────┬───────────────┤
  │ Left panel  │ Centre (map slot)    │ Right panel   │
  │ Abilities   │                      │ Active rules  │
  │ Action wheel│                      │ Targets       │
  │ Cycle       │                      │ Costs         │
  ├─────────────┴──────────────────────┴───────────────┤
  │ Timeline (slot)                                    │
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
            Mode: <span class="text-white">{inputModeLabels[activeManifest.inputMode] ?? activeManifest.inputMode}</span>
          </div>
          {#if activeManifest.overlays.length > 0}
            <div class="text-gray-400 mt-0.5">
              Overlays:
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
          Map unavailable
        </div>
      </slot>
    </main>

    <!-- RIGHT PANEL: active rules, targets, costs -->
    <aside class="flex flex-col gap-3 p-3 w-52 border-l border-bw-gold/20 overflow-y-auto shrink-0">

      <!-- Active rules -->
      {#if activeRules.length > 0}
        <div class="bg-bw-navy border border-bw-gold/20 rounded p-2 text-xs">
          <div class="text-bw-gold font-bold mb-1 tracking-wider">ACTIVE RULES</div>
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
          <div class="text-bw-gold font-bold mb-1 tracking-wider">TARGETS</div>
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
          <div class="text-bw-gold font-bold mb-1 tracking-wider">COST</div>
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
              <li>● Body change available</li>
            {/if}
            {#if pt.canChangeConsciousness}
              <li>● Consciousness transfer available</li>
            {/if}
            {#if pt.canFollowAura}
              <li>● Follow aura entity</li>
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
        Timeline
      </div>
    </slot>
  </footer>
</div>
