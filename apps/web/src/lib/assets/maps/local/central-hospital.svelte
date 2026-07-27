<script lang="ts">
  // Area inspection is not wired up yet; the keyboard and click affordances
  // stay so the behaviour can be attached in one place when it exists.
  function inspect(_area: string) {}
  function inspectWithKeyboard(event: KeyboardEvent, area: string) {
    if (event.key === 'Enter' || event.key === ' ') inspect(area)
  }
</script>

<svg
  viewBox="0 0 1000 680"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        fill: none;
        stroke: #eaf7ff;
        stroke-width: 5;
      }
      .zone {
        fill: rgba(70, 150, 185, 0.09);
        stroke: #6097ac;
        stroke-width: 2;
        cursor: pointer;
      }
      .zone:hover {
        fill: rgba(70, 150, 185, 0.2);
      }
      .label {
        fill: #fffff0;
        font: bold 15px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .sub {
        fill: #8ec4d9;
        font: 11px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .bed {
        fill: #dcebf1;
        stroke: #6b8792;
        stroke-width: 2;
      }
    </style>
  </defs>
  <text x="500" y="38" class="label" font-size="28" fill="#ffd700"
    >Central Hospital · Medical Ward · Tier 3</text
  >
  <text x="500" y="60" class="sub"
    >The tier has three clinics, including the Central Medical Clinic</text
  >
  <g transform="translate(60 90)">
    <rect width="880" height="520" class="wall" />
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the Central Medical Clinic"
      class="zone"
      x="25"
      y="25"
      width="500"
      height="300"
      onclick={() => inspect('central-medical-clinic')}
      onkeydown={(event) => inspectWithKeyboard(event, 'central-medical-clinic')}
    />
    <text x="275" y="75" class="label">Central Medical Clinic</text>
    {#each [0, 1, 2, 3] as i (i)}
      <rect
        class="bed"
        x={75 + (i % 2) * 240}
        y={115 + Math.floor(i / 2) * 95}
        width="150"
        height="55"
        rx="6"
      />
    {/each}
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect medical supplies"
      class="zone"
      x="555"
      y="25"
      width="300"
      height="145"
      onclick={() => inspect('medical-supplies')}
      onkeydown={(event) => inspectWithKeyboard(event, 'medical-supplies')}
    />
    <text x="705" y="92" class="label">Medical Supplies</text>
    <text x="705" y="115" class="sub">Medicines and voyage provisions</text>
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect staff work area"
      class="zone"
      x="555"
      y="195"
      width="300"
      height="130"
      onclick={() => inspect('staff-area')}
      onkeydown={(event) => inspectWithKeyboard(event, 'staff-area')}
    />
    <text x="705" y="255" class="label">Medical Staff Area</text>
    <text x="705" y="278" class="sub">Clinical offices and staff station</text>
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect the research institute connection"
      class="zone"
      x="25"
      y="355"
      width="830"
      height="130"
      onclick={() => inspect('research-institute')}
      onkeydown={(event) => inspectWithKeyboard(event, 'research-institute')}
    />
    <text x="440" y="410" class="label">Medical Ward / Research Institute Connection</text>
    <text x="440" y="438" class="sub"
      >The Central Hospital and Research Institute occupy the Medical Ward; exact internal
      boundaries are unpublished</text
    >
  </g>
</svg>
