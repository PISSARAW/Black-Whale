<script lang="ts">
  import { t } from '$lib/i18n'
  import {
    FOV_RANGE,
    NIGHT_LIGHT_RANGE,
    SENSITIVITY_RANGE,
    SNAP_ANGLE_RANGE,
    comfort,
    resetComfort,
    setComfort,
  } from '$lib/tour/comfort'
  import type { QualitySetting } from '$lib/tour/quality'

  let { calm }: { calm: boolean } = $props()

  // The palier, spelled out. Three named choices rather than a slider: there
  // are two paliers and a way of not choosing, and a continuum would imply a
  // dial where there is a list of decisions — see `$lib/tour/quality`.
  const qualities: { value: QualitySetting; label: () => string }[] = [
    { value: 'auto', label: () => $t.tour.comfort.qualityAuto },
    { value: 'low', label: () => $t.tour.comfort.qualityLow },
    { value: 'high', label: () => $t.tour.comfort.qualityHigh },
  ]
</script>

<section class="rounded border border-[#333] p-3">
  <p class="mb-2 text-[10px] uppercase tracking-widest text-[#FFD700]/70">
    {$t.tour.comfort.title}
  </p>
  {#if calm}<p class="mb-2 text-xs leading-snug text-[#FFFFF0]/50">{$t.tour.comfort.calm}</p>{/if}
  <div class="space-y-2.5 text-xs text-[#FFFFF0]/70">
    <label class="block">
      <span class="flex items-baseline justify-between"
        ><span>{$t.tour.comfort.fov}</span><span class="text-[#FFD700]/80"
          >{$t.tour.comfort.degrees($comfort.fov)}</span
        ></span
      >
      <input
        type="range"
        min={FOV_RANGE[0]}
        max={FOV_RANGE[1]}
        step="1"
        value={$comfort.fov}
        oninput={(event) => setComfort({ fov: Number(event.currentTarget.value) })}
        class="mt-1 w-full accent-[#FFD700]"
      />
    </label>
    <label class="block">
      <span class="flex items-baseline justify-between"
        ><span>{$t.tour.comfort.sensitivity}</span><span class="text-[#FFD700]/80"
          >{$t.tour.comfort.times($comfort.sensitivity)}</span
        ></span
      >
      <input
        type="range"
        min={SENSITIVITY_RANGE[0]}
        max={SENSITIVITY_RANGE[1]}
        step="0.05"
        value={$comfort.sensitivity}
        oninput={(event) => setComfort({ sensitivity: Number(event.currentTarget.value) })}
        class="mt-1 w-full accent-[#FFD700]"
      />
    </label>
    <label class="block">
      <span class="flex items-baseline justify-between"
        ><span>{$t.tour.comfort.nightLight}</span><span class="text-[#FFD700]/80"
          >{$comfort.nightLight > 0
            ? $t.tour.comfort.metres($comfort.nightLight)
            : $t.tour.comfort.nightLightOff}</span
        ></span
      >
      <input
        type="range"
        min={NIGHT_LIGHT_RANGE[0]}
        max={NIGHT_LIGHT_RANGE[1]}
        step="1"
        value={$comfort.nightLight}
        oninput={(event) => setComfort({ nightLight: Number(event.currentTarget.value) })}
        class="mt-1 w-full accent-[#FFD700]"
      />
    </label>
    <label class="flex items-center gap-2">
      <input
        type="checkbox"
        checked={$comfort.snapTurn}
        onchange={(event) => setComfort({ snapTurn: event.currentTarget.checked })}
        class="accent-[#FFD700]"
      />
      <span>{$t.tour.comfort.snapTurn}</span>
    </label>
    {#if $comfort.snapTurn}
      <label class="block">
        <span class="flex items-baseline justify-between"
          ><span>{$t.tour.comfort.snapAngle}</span><span class="text-[#FFD700]/80"
            >{$t.tour.comfort.degrees($comfort.snapAngle)}</span
          ></span
        >
        <input
          type="range"
          min={SNAP_ANGLE_RANGE[0]}
          max={SNAP_ANGLE_RANGE[1]}
          step="5"
          value={$comfort.snapAngle}
          oninput={(event) => setComfort({ snapAngle: Number(event.currentTarget.value) })}
          class="mt-1 w-full accent-[#FFD700]"
        />
      </label>
    {/if}
    <label class="flex items-center gap-2">
      <input
        type="checkbox"
        checked={$comfort.jumpOnly}
        onchange={(event) => setComfort({ jumpOnly: event.currentTarget.checked })}
        class="accent-[#FFD700]"
      />
      <span>{$t.tour.comfort.jumpOnly}</span>
    </label>
    <div>
      <span class="block">{$t.tour.comfort.quality}</span>
      <div class="mt-1 flex gap-1">
        {#each qualities as choice (choice.value)}
          <button
            type="button"
            aria-pressed={$comfort.quality === choice.value}
            onclick={() => setComfort({ quality: choice.value })}
            class="flex-1 rounded border px-1.5 py-1 text-[11px] transition-colors {$comfort.quality ===
            choice.value
              ? 'border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700]'
              : 'border-[#333] text-[#FFFFF0]/60 hover:border-[#FFD700]/40 hover:text-[#FFFFF0]'}"
            >{choice.label()}</button
          >
        {/each}
      </div>
      <p class="mt-1 text-[11px] leading-snug text-[#FFFFF0]/40">{$t.tour.comfort.qualityHelp}</p>
    </div>
    <button
      type="button"
      onclick={resetComfort}
      class="rounded border border-[#333] px-2 py-1 text-[11px] text-[#FFFFF0]/60 transition-colors hover:border-[#FFD700]/50 hover:text-[#FFFFF0]"
      >{$t.tour.comfort.reset}</button
    >
  </div>
</section>
