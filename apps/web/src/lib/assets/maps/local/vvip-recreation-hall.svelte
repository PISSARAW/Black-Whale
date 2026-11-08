<script lang="ts">
  import { locale } from '$lib/i18n'
  import {
    VVIP_RECREATION_VIEWBOX,
    VVIP_RECREATION_SCALE,
    vvipRecreationPoint,
    vvipRecreationPolygon,
    vvipRecreationRoom,
    vvipRecreationFixtures,
    vvipRecreationDoors,
  } from '$lib/components/map/projection/vvipRecreationPlan'

  const french = $derived($locale === 'fr')

  // Left gallery, right gallery, rear gallery polygons
  const leftGallery = vvipRecreationPolygon([
    [26, -50],
    [29, -50],
    [29, -25],
    [26, -25],
  ])
  const rightGallery = vvipRecreationPolygon([
    [53, -50],
    [56, -50],
    [56, -25],
    [53, -25],
  ])
  const rearGallery = vvipRecreationPolygon([
    [29, -50],
    [53, -50],
    [53, -47],
    [29, -47],
  ])
</script>

<svg
  viewBox={`0 0 ${VVIP_RECREATION_VIEWBOX.width} ${VVIP_RECREATION_VIEWBOX.height}`}
  role="img"
  aria-label={french
    ? 'Plan de la grande salle de loisirs VVIP, double escalier symétrique et mezzanine en U'
    : 'VVIP recreation hall plan with symmetric double staircase and U-shaped mezzanine'}
  class="w-full h-full rounded-lg bg-[#050505] text-[#fffff0]"
>
  <text x="450" y="32" text-anchor="middle" fill="currentColor" font-size="20">
    {french ? 'Grande salle de loisirs VVIP' : 'VVIP Recreation Hall'}
  </text>
  <text x="450" y="52" text-anchor="middle" fill="#b1a58d" font-size="12">
    {french
      ? 'Niveau 1-A · Chap. 419 (double escalier et mezzanine)'
      : 'Tier 1-A · Ch. 419 (double stair and mezzanine)'}
  </text>

  <!-- Hall floor boundary -->
  {#if vvipRecreationRoom}
    <polygon
      points={vvipRecreationPolygon(vvipRecreationRoom.footprint)}
      fill="#111111"
      stroke="#bda05e"
      stroke-width="2.5"
    />
  {/if}

  <!-- Upper mezzanine gallery footprint (shaded overlay) -->
  <polygon
    points={leftGallery}
    fill="#1d1b16"
    stroke="#bda05e"
    stroke-width="1.2"
    stroke-dasharray="4 2"
  />
  <polygon
    points={rightGallery}
    fill="#1d1b16"
    stroke="#bda05e"
    stroke-width="1.2"
    stroke-dasharray="4 2"
  />
  <polygon
    points={rearGallery}
    fill="#1d1b16"
    stroke="#bda05e"
    stroke-width="1.2"
    stroke-dasharray="4 2"
  />

  <!-- Labels for mezzanine -->
  <text
    x="112"
    y="375"
    text-anchor="middle"
    fill="#8f8776"
    font-size="10"
    transform="rotate(-90 112 375)"
  >
    {french ? 'Galerie bâbord' : 'Port Gallery'}
  </text>
  <text
    x="788"
    y="375"
    text-anchor="middle"
    fill="#8f8776"
    font-size="10"
    transform="rotate(90 788 375)"
  >
    {french ? 'Galerie tribord' : 'Starboard Gallery'}
  </text>
  <text x="450" y="95" text-anchor="middle" fill="#8f8776" font-size="10">
    {french ? 'Galerie supérieure (Mezzanine)' : 'Upper Gallery (Mezzanine)'}
  </text>

  <!-- Fixtures & Furniture -->
  {#each vvipRecreationFixtures as fixture (fixture.id)}
    {@const isBilliards = fixture.id.includes('billiards')}
    {@const isStair = fixture.id.includes('stair')}
    {@const isSofa = fixture.id.includes('sofa')}
    {@const isBar = fixture.id.includes('bar')}
    {@const isCard = fixture.id.includes('card')}

    {#if isBilliards}
      <!-- Billiards table with green felt -->
      <polygon points={fixture.polygon} fill="#1d5c36" stroke="#bda05e" stroke-width="1.8" />
      <circle cx={fixture.point.x} cy={fixture.point.y} r="3" fill="#ffffff" />
    {:else if isStair}
      <!-- Stair step platform -->
      <polygon points={fixture.polygon} fill="#26221c" stroke="#9b824a" stroke-width="0.8" />
    {:else if isBar}
      <!-- Bar counter / shelf -->
      <polygon points={fixture.polygon} fill="#3d2012" stroke="#bda05e" stroke-width="1.4" />
    {:else if isSofa}
      <!-- Tufted lounge sofa -->
      <polygon points={fixture.polygon} fill="#5a1922" stroke="#bda05e" stroke-width="1.2" />
    {:else if isCard}
      <!-- Card table -->
      <polygon points={fixture.polygon} fill="#1d5c36" stroke="#bda05e" stroke-width="1.2" />
    {:else}
      <!-- Other furniture (armchairs, tables) -->
      <polygon points={fixture.polygon} fill="#2b251d" stroke="#8a7e6b" stroke-width="1" />
    {/if}
  {/each}

  <!-- Structural columns -->
  <circle
    cx={vvipRecreationPoint([35.5, -37.5]).x}
    cy={vvipRecreationPoint([35.5, -37.5]).y}
    r={0.45 * VVIP_RECREATION_SCALE}
    fill="#dcd8c9"
    stroke="#bda05e"
    stroke-width="1.5"
  />
  <circle
    cx={vvipRecreationPoint([46.5, -37.5]).x}
    cy={vvipRecreationPoint([46.5, -37.5]).y}
    r={0.45 * VVIP_RECREATION_SCALE}
    fill="#dcd8c9"
    stroke="#bda05e"
    stroke-width="1.5"
  />

  <!-- Door thresholds -->
  {#each vvipRecreationDoors as door, index (index)}
    <line
      x1={door.from.x}
      y1={door.from.y}
      x2={door.to.x}
      y2={door.to.y}
      stroke="#bda05e"
      stroke-width="3"
    />
  {/each}

  <!-- Threshold indicators -->
  <text x="450" y="66" text-anchor="middle" fill="#dcd8c9" font-size="11">
    ▲ {french ? 'Vers Couloir VIP A & Casino' : 'To VIP Passage A & Casino'}
  </text>
  <text x="450" y="720" text-anchor="middle" fill="#dcd8c9" font-size="11">
    ▼ {french ? 'Vers Quartier des Princes' : 'To Prince Residential Corridor'}
  </text>
</svg>
