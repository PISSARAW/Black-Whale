<script lang="ts">
  import { t } from '$lib/i18n'
  import {
    EXPOSURE_RANGE,
    FOV_RANGE,
    HEAD_BOB_RANGE,
    NIGHT_LIGHT_RANGE,
    SENSITIVITY_RANGE,
    SNAP_ANGLE_RANGE,
    WALK_PACE_RANGE,
    comfort,
    resetComfort,
    setComfort,
  } from '$lib/tour/comfort'
  // The dial is a multiplier; what the visitor is shown is the pace itself, in
  // the units the reconstruction publishes everything else in.
  import { WALK_SPEED } from '$lib/tour/navigation'
  import type { QualitySetting } from '$lib/tour/quality'
  import type { ShipHourChoice } from '$lib/tour/sky'

  let { calm }: { calm: boolean } = $props()

  /**
   * The hour behind the two windows. `quality`'s doctrine word for word: the
   * projection picks the default and the visitor overrules it — and `noon` is
   * the way out for whoever wants the one state the manga draws.
   *
   * A list and not a dial, because that is what these are: the sky has a table
   * of posed hours, and offering a continuum would imply that any minute of it
   * is a claim about the voyage. It is not — the projection's own hour is.
   */
  const hours: { value: ShipHourChoice; label: () => string }[] = [
    { value: 'canon', label: () => $t.tour.comfort.hourCanon },
    { value: 'morning', label: () => $t.tour.comfort.hourMorning },
    { value: 'noon', label: () => $t.tour.comfort.hourNoon },
    { value: 'evening', label: () => $t.tour.comfort.hourEvening },
    { value: 'night', label: () => $t.tour.comfort.hourNight },
  ]

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
    <!--
      The aperture, next to the light the visitor carries, because the two
      answer the same complaint from opposite sides: one adds a lamp the ship
      does not have, and this one only opens the eye looking at it.
    -->
    <label class="block">
      <span class="flex items-baseline justify-between"
        ><span>{$t.tour.comfort.exposure}</span><span class="text-[#FFD700]/80"
          >{$t.tour.comfort.times($comfort.exposure)}</span
        ></span
      >
      <input
        type="range"
        min={EXPOSURE_RANGE[0]}
        max={EXPOSURE_RANGE[1]}
        step="0.05"
        value={$comfort.exposure}
        oninput={(event) => setComfort({ exposure: Number(event.currentTarget.value) })}
        class="mt-1 w-full accent-[#FFD700]"
      />
      <span class="mt-0.5 block text-[11px] leading-snug text-[#FFFFF0]/40"
        >{$t.tour.comfort.exposureHelp}</span
      >
    </label>
    <label class="block">
      <span class="flex items-baseline justify-between"
        ><span>{$t.tour.comfort.walkPace}</span><span class="text-[#FFD700]/80"
          >{$t.tour.comfort.metresASecond(WALK_SPEED * $comfort.walkPace)}</span
        ></span
      >
      <input
        type="range"
        min={WALK_PACE_RANGE[0]}
        max={WALK_PACE_RANGE[1]}
        step="0.05"
        value={$comfort.walkPace}
        oninput={(event) => setComfort({ walkPace: Number(event.currentTarget.value) })}
        class="mt-1 w-full accent-[#FFD700]"
      />
    </label>
    <label class="block">
      <span class="flex items-baseline justify-between"
        ><span>{$t.tour.comfort.headBob}</span><span class="text-[#FFD700]/80"
          >{$comfort.headBob > 0
            ? $t.tour.comfort.times($comfort.headBob)
            : $t.tour.comfort.headBobOff}</span
        ></span
      >
      <input
        type="range"
        min={HEAD_BOB_RANGE[0]}
        max={HEAD_BOB_RANGE[1]}
        step="0.05"
        value={$comfort.headBob}
        oninput={(event) => setComfort({ headBob: Number(event.currentTarget.value) })}
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
    <!--
      Next to the jump, because it answers the same complaint: a visitor who
      came for the deck should not have to keep the walk's own effects between
      them and it. The aura is still up — only its picture and its hum stop.
    -->
    <label class="flex items-center gap-2">
      <input
        type="checkbox"
        checked={$comfort.restingAura}
        onchange={(event) => setComfort({ restingAura: event.currentTarget.checked })}
        class="accent-[#FFD700]"
      />
      <span>{$t.tour.comfort.restingAura}</span>
    </label>
    <p class="-mt-1.5 text-[11px] leading-snug text-[#FFFFF0]/40">
      {$t.tour.comfort.restingAuraHelp}
    </p>
    <div>
      <span class="block">{$t.tour.comfort.shipHour}</span>
      <div class="mt-1 flex flex-wrap gap-1">
        {#each hours as choice (choice.value)}
          <button
            type="button"
            aria-pressed={$comfort.shipHour === choice.value}
            onclick={() => setComfort({ shipHour: choice.value })}
            class="rounded border px-1.5 py-1 text-[11px] transition-colors {$comfort.shipHour ===
            choice.value
              ? 'border-[#FFD700]/60 bg-[#FFD700]/10 text-[#FFD700]'
              : 'border-[#333] text-[#FFFFF0]/60 hover:border-[#FFD700]/40 hover:text-[#FFFFF0]'}"
            >{choice.label()}</button
          >
        {/each}
      </div>
      <p class="mt-1 text-[11px] leading-snug text-[#FFFFF0]/40">{$t.tour.comfort.shipHourHelp}</p>
    </div>
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
