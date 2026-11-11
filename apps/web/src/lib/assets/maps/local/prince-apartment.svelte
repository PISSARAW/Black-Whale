<script lang="ts">
  import { t, locale } from '$lib/i18n'
  import { camillaFixtures } from '$lib/components/map/projection/camillaPlan'
  import BenjaminReceptionPlan from './BenjaminReceptionPlan.svelte'
  import BenjaminApartmentFixtures from './BenjaminApartmentFixtures.svelte'
  import { mapState } from '$lib/state/mapState.svelte'

  // Extract room number, e.g. "room-1014" -> "1014"
  let roomNumber = $derived(mapState.selectedLocationId?.split('-')[1] || '1000')

  // Room interactions are not wired up yet. The elements keep their click
  // and keyboard affordances so the behaviour can be attached in one place
  // when it exists; until then this must not log on a public page.
  function handleElementClick(_elementId: string) {}
</script>

<svg
  viewBox="0 0 800 800"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        stroke: #fffff0;
        stroke-width: 6;
        fill: none;
      }
      .thin-wall {
        stroke: #fffff0;
        stroke-width: 3;
        fill: none;
      }
      .door {
        stroke: #ffd700;
        stroke-width: 4;
        fill: none;
        cursor: pointer;
        transition: stroke 0.2s;
      }
      .door:hover {
        stroke: #fff;
      }
      .zone {
        fill: rgba(255, 215, 0, 0.05);
        transition: fill 0.2s;
        cursor: pointer;
      }
      .zone:hover {
        fill: rgba(255, 215, 0, 0.15);
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 16px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #ffd700;
        font-size: 12px;
        pointer-events: none;
        text-anchor: middle;
      }
      .furniture {
        stroke: #666;
        stroke-width: 2;
        fill: rgba(100, 100, 100, 0.2);
        pointer-events: none;
      }
      .evidence {
        fill: #999;
        font-family: sans-serif;
        font-size: 12px;
        pointer-events: none;
        text-anchor: middle;
      }
      .fixed {
        stroke: #ffd700;
        stroke-width: 2;
        fill: rgba(255, 215, 0, 0.09);
        pointer-events: none;
      }
    </style>
  </defs>

  <text x="400" y="30" class="label" font-size="28" fill="#FFD700"
    >{$t.map.localMaps.princeApartment.title(roomNumber)}</text
  >
  <text x="400" y="53" class="evidence">{$t.map.localMaps.princeApartment.programmeType}</text>
  <text x="400" y="70" class="evidence">{$t.map.localMaps.princeApartment.unpublished}</text>
  {#if ['1002', '1004', '1006'].includes(roomNumber)}
    <text x="400" y="785" class="evidence"
      >Panel-confirmed apartment plan · rooms 1002 / 1004 / 1006</text
    >
  {/if}

  <g transform="translate(50, 82)">
    <!-- Outer boundary -->
    <rect x="0" y="0" width="700" height="680" class="wall" />

    <!-- Entrance Area (Top Center) -->
    <!-- Open doorway at top center -->
    <line x1="0" y1="0" x2="300" y2="0" class="wall" />
    <line x1="400" y1="0" x2="700" y2="0" class="wall" />
    <line class="door" x1="300" y1="0" x2="350" y2="30" />
    <line class="door" x1="400" y1="0" x2="350" y2="30" />

    <!-- Living Room (Center, massive) -->
    <polygon
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="zone"
      points="0,250 400,250 400,350 700,350 700,530 0,530"
      onclick={() => handleElementClick('living')}
    />
    {#if !['1001', '1002'].includes(roomNumber)}
      <text x="250" y="390" class="label" font-size="24"
        >{$t.map.localMaps.princeApartment.living}</text
      >
    {/if}
    {#if !['1001', '1002', '1004', '1007', '1009', '1010'].includes(roomNumber)}
      <rect x="300" y="350" width="80" height="60" class="furniture" />
      <!-- Default programme-type table; removed where a panel contradicts it. -->
    {/if}

    <!-- Servants' Quarters (Top Left) -->
    <!-- Bounds: x: 0 to 300, y: 0 to 250 -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="zone"
      x="0"
      y="0"
      width="300"
      height="250"
      onclick={() => handleElementClick('servants')}
    />
    <line class="wall" x1="300" y1="0" x2="300" y2="250" />
    <line class="wall" x1="0" y1="250" x2="250" y2="250" />
    <line class="door" x1="250" y1="250" x2="300" y2="210" />
    <!-- Door to living -->
    <text x="150" y="100" class="label">{$t.map.localMaps.princeApartment.servants}</text>
    <text x="150" y="125" class="label">{$t.map.localMaps.princeApartment.quarters}</text>
    <!-- Servants Toilet -->
    <line class="thin-wall" x1="220" y1="130" x2="300" y2="130" />
    <line class="thin-wall" x1="220" y1="130" x2="220" y2="200" />
    {#if !['1001', '1002'].includes(roomNumber)}
      <circle cx="260" cy="165" r="15" class="furniture" />
    {/if}

    <!-- Kitchen (Top Right) -->
    <!-- Bounds: x: 400 to 700, y: 0 to 150 -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="zone"
      x="400"
      y="0"
      width="300"
      height="150"
      onclick={() => handleElementClick('kitchen')}
    />
    <line class="wall" x1="400" y1="0" x2="400" y2="350" />
    <line class="wall" x1="400" y1="150" x2="700" y2="150" />
    <text x="600" y="75" class="label">{$t.map.localMaps.princeApartment.kitchen}</text>
    {#if !['1001', '1002'].includes(roomNumber)}
      <!-- Counters/Stoves -->
      <rect x="420" y="20" width="80" height="60" class="furniture" />
      <circle cx="440" cy="40" r="10" class="furniture" />
      <circle cx="480" cy="40" r="10" class="furniture" />
      <circle cx="440" cy="60" r="10" class="furniture" />
      <circle cx="480" cy="60" r="10" class="furniture" />
    {/if}

    <!-- Dining (Middle Right, below Kitchen) -->
    <!-- Bounds: x: 400 to 700, y: 150 to 350 -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="zone"
      x="400"
      y="150"
      width="300"
      height="200"
      onclick={() => handleElementClick('dining')}
    />
    <line class="wall" x1="400" y1="350" x2="600" y2="350" />
    <line class="door" x1="600" y1="350" x2="650" y2="310" />
    <!-- Door to Living -->
    <text x="550" y="250" class="label">{$t.map.localMaps.princeApartment.dining}</text>
    {#if !['1001', '1002', '1003'].includes(roomNumber)}
      <rect x="510" y="220" width="80" height="40" class="furniture" />
      <!-- Dining table from the ch. 363 programme-type. -->
    {/if}

    <!-- Prince's Master Bedroom (Bottom Left/Center) -->
    <!-- Bounds: x: 0 to 500, y: 530 to 680 -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="zone"
      x="0"
      y="530"
      width="500"
      height="150"
      onclick={() => handleElementClick('master-bedroom')}
    />
    <line class="wall" x1="0" y1="530" x2="420" y2="530" />
    <line class="door" x1="420" y1="530" x2="470" y2="490" />
    <!-- Door from Living -->
    <line class="wall" x1="500" y1="530" x2="500" y2="680" />
    <text x="250" y="600" class="label">{$t.map.localMaps.princeApartment.princes}</text>
    <text x="250" y="625" class="label">{$t.map.localMaps.princeApartment.masterBedroom}</text>
    {#if !['1001', '1002'].includes(roomNumber)}
      <rect x="20" y="550" width="100" height="110" class="furniture" />
    {/if}
    <!-- Bed -->

    <!-- Bathroom / Toilet (Bottom Right) -->
    <!-- Bounds: x: 500 to 700, y: 530 to 680 -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Inspect map area"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="zone"
      x="500"
      y="530"
      width="200"
      height="150"
      onclick={() => handleElementClick('bathroom')}
    />
    <line class="wall" x1="500" y1="530" x2="700" y2="530" />
    <!-- Bathroom door is inside the living room leading to a small corridor maybe? Let's add a door at 550,530 -->
    <line class="door" x1="530" y1="530" x2="580" y2="490" />
    <text x="600" y="600" class="label">{$t.map.localMaps.princeApartment.bathWc}</text>
    {#if !['1001', '1002'].includes(roomNumber)}
      <rect x="520" y="580" width="50" height="80" class="furniture" rx="10" />
      <!-- Bathtub -->
      <circle cx="650" cy="580" r="15" class="furniture" />
      <!-- Toilet -->
    {/if}

    <!-- Apartment-specific fixtures. Event props
      (gifts, cake, chair circles) are not made permanent. -->
    {#if roomNumber === '1001'}
      <BenjaminReceptionPlan />
      <BenjaminApartmentFixtures />
    {:else if roomNumber === '1002'}
      <!-- One shared plan; the VVIP massage room is not part of Apartment 1002. -->
      {#each camillaFixtures as fixture (fixture.id)}
        <polygon points={fixture.polygon} class="fixed">
          <title>{$locale === 'fr' ? fixture.nameFr : fixture.name}</title>
        </polygon>
      {/each}
      <text x="340" y="420" class="evidence">1002 · chap. 366 / 389</text>
    {:else if roomNumber === '1004'}
      <!-- Same clear training room in ch. 384–387. -->
      <rect x="610" y="370" width="65" height="24" class="fixed" />
      <circle cx="642" cy="382" r="6" class="fixed" />
      <text x="350" y="405" class="sublabel">{$t.map.localMaps.princeApartment.clearTraining}</text>
      <text x="642" y="420" class="sublabel">{$t.map.localMaps.princeApartment.coatClock}</text>
    {:else if roomNumber === '1003'}
      <!-- State dining room confirmed in ch. 365 and 366. -->
      <!-- Longue table sculptée d'apparat -->
      <rect x="465" y="205" width="175" height="55" rx="6" class="fixed" />
      <!-- Fauteuil de tête (Prince Zhang Lei) -->
      <rect x="430" y="215" width="25" height="35" rx="4" class="fixed" />
      <!-- Fauteuil d'audience (Reine Oito) -->
      <rect x="650" y="215" width="25" height="35" rx="4" class="fixed" />
      <!-- Crédence d'apparat le long du mur tribord -->
      <rect x="675" y="165" width="18" height="95" class="fixed" />
      <!-- Statue d'art sur sa sellette -->
      <rect x="673" y="275" width="20" height="20" rx="3" class="fixed" />
      <circle cx="683" cy="285" r="5" class="fixed" />
      <!-- Guéridon circulaire près de l'entrée -->
      <circle cx="445" cy="175" r="13" class="fixed" />
      <!-- Haut candélabre à branches -->
      <circle cx="660" cy="180" r="10" class="fixed" />
      <circle cx="660" cy="180" r="3" fill="#ffd700" />
      <!-- Grand cadre officiel au mur -->
      <rect x="425" y="152" width="60" height="6" class="fixed" />
      <text x="550" y="292" class="sublabel">{$t.map.localMaps.princeApartment.stateDining}</text>
    {:else if roomNumber === '1005'}
      <!-- Scientific cabinet seen in ch. 366. -->
      <rect x="55" y="300" width="145" height="60" class="fixed" />
      <rect x="40" y="265" width="110" height="14" class="fixed" />
      <rect x="165" y="265" width="110" height="14" class="fixed" />
      <rect x="290" y="265" width="90" height="14" class="fixed" />
      <text x="220" y="390" class="sublabel"
        >{$t.map.localMaps.princeApartment.deskWhiteboards}</text
      >
    {:else if roomNumber === '1006'}
      <!-- Room confirmed; birthday decoration is temporary. -->
      <text x="350" y="395" class="sublabel">{$t.map.localMaps.princeApartment.largeReception}</text
      >
      <text x="350" y="417" class="evidence">{$t.map.localMaps.princeApartment.cakeAndGifts}</text>
    {:else if roomNumber === '1007'}
      <!-- Recurring cluttered salon in ch. 386 and 389. -->
      <rect x="65" y="410" width="190" height="65" rx="14" class="fixed" />
      <rect x="285" y="425" width="65" height="45" class="fixed" />
      <rect x="610" y="300" width="65" height="175" class="fixed" />
      <rect x="440" y="295" width="120" height="20" class="fixed" />
      <circle cx="95" cy="330" r="22" class="fixed" />
      <circle cx="580" cy="330" r="22" class="fixed" />
      <text x="350" y="500" class="sublabel">{$t.map.localMaps.princeApartment.clutteredSalon}</text
      >
    {:else if roomNumber === '1008'}
      <!-- Festive bedroom confirmed in ch. 362, 366 and 382. -->
      <rect x="20" y="550" width="225" height="110" rx="10" class="fixed" />
      <rect x="360" y="575" width="100" height="45" class="fixed" />
      <rect x="475" y="560" width="25" height="70" class="fixed" />
      <text x="330" y="650" class="sublabel">{$t.map.localMaps.princeApartment.largeBed}</text>
    {:else if roomNumber === '1009'}
      <!-- Ritual chairs are movable; wall fixtures remain. -->
      <rect x="35" y="275" width="120" height="28" class="fixed" />
      <rect x="545" y="365" width="130" height="28" class="fixed" />
      <rect x="285" y="275" width="95" height="26" class="fixed" />
      <text x="350" y="405" class="sublabel">{$t.map.localMaps.princeApartment.clearTiled}</text>
      <text x="350" y="427" class="evidence">{$t.map.localMaps.princeApartment.bookshelves}</text>
    {:else if roomNumber === '1010'}
      <!-- Kitchen and salon detailed in ch. 374 and 376. -->
      <rect x="420" y="20" width="250" height="45" class="fixed" />
      <rect x="640" y="65" width="30" height="65" class="fixed" />
      <rect x="65" y="285" width="180" height="28" class="fixed" />
      <circle cx="275" cy="300" r="16" class="fixed" />
      <rect x="80" y="330" width="150" height="16" class="fixed" />
      <text x="550" y="105" class="sublabel">{$t.map.localMaps.princeApartment.fittedKitchen}</text>
      <text x="205" y="375" class="sublabel">{$t.map.localMaps.princeApartment.dresserStool}</text>
    {/if}
  </g>
</svg>
