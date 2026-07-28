<script lang="ts">
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
    </style>
  </defs>

  <text x="400" y="40" class="label" font-size="28" fill="#FFD700"
    >Appartement Princier {roomNumber}</text
  >

  <g transform="translate(50, 70)">
    <!-- Outer boundary -->
    <rect x="0" y="0" width="700" height="680" class="wall" />

    <!-- Entrance Area (Top Center) -->
    <!-- Open doorway at top center -->
    <line x1="0" y1="0" x2="300" y2="0" class="wall" />
    <line x1="400" y1="0" x2="700" y2="0" class="wall" />
    <line class="door" x1="300" y1="0" x2="350" y2="30" />
    <line class="door" x1="400" y1="0" x2="350" y2="30" />

    <!-- Living Room (Center, massive) -->
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
      y="250"
      width="700"
      height="280"
      onclick={() => handleElementClick('living')}
    />
    <text x="250" y="390" class="label" font-size="24">Living</text>
    <rect x="300" y="350" width="80" height="60" class="furniture" />
    <!-- Center Table -->

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
    <text x="150" y="100" class="label">Servants'</text>
    <text x="150" y="125" class="label">Quarters</text>
    <!-- Servants Toilet -->
    <line class="thin-wall" x1="220" y1="130" x2="300" y2="130" />
    <line class="thin-wall" x1="220" y1="130" x2="220" y2="200" />
    <circle cx="260" cy="165" r="15" class="furniture" />

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
    <text x="600" y="75" class="label">Kitchen</text>
    <!-- Counters/Stoves -->
    <rect x="420" y="20" width="80" height="60" class="furniture" />
    <circle cx="440" cy="40" r="10" class="furniture" />
    <circle cx="480" cy="40" r="10" class="furniture" />
    <circle cx="440" cy="60" r="10" class="furniture" />
    <circle cx="480" cy="60" r="10" class="furniture" />

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
    <text x="550" y="250" class="label">Dining</text>
    <rect x="510" y="220" width="80" height="40" class="furniture" />
    <!-- Dining Table -->

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
    <text x="250" y="600" class="label">Prince's</text>
    <text x="250" y="625" class="label">Master Bedroom</text>
    <rect x="20" y="550" width="100" height="110" class="furniture" />
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
    <text x="600" y="600" class="label">Bath / WC</text>
    <rect x="520" y="580" width="50" height="80" class="furniture" rx="10" />
    <!-- Bathtub -->
    <circle cx="650" cy="580" r="15" class="furniture" />
    <!-- Toilet -->

    <!-- Dynamic Elements per room -->
    <!--
      One asset draws fourteen apartments, so the shared plan holds only what
      every suite has: a bed, a dining table, a living room. Canon seats several
      princes on a fixture that is theirs alone — Luzurus never leaves his couch,
      Camilla receives from her massage table, Woble is in a cradle — and a plan
      that draws none of them leaves those markers floating in a room the map
      says is empty. Each block below is a fixture a chapter puts on panel, and
      `localSpotAnchors` in `markerProjection.ts` reads its centre.
    -->
    {#if roomNumber === '1001'}
      <!-- Benjamin runs the war from his console, ch. 363, 389 and 413. -->
      <rect x="460" y="400" width="180" height="70" class="furniture" />
      <text x="550" y="490" class="sublabel">Command console</text>
    {:else if roomNumber === '1002'}
      <!-- Camilla is attended on her table, ch. 413. -->
      <rect x="90" y="300" width="150" height="60" rx="10" class="furniture" />
      <text x="165" y="380" class="sublabel">Massage table</text>
    {:else if roomNumber === '1004'}
      <!-- Tserriednich's Zetsu drills, ch. 362 through 404. -->
      <rect
        x="440"
        y="370"
        width="210"
        height="130"
        fill="rgba(255, 0, 0, 0.08)"
        stroke="red"
        stroke-width="2"
        stroke-dasharray="5,5"
      />
      <text x="545" y="355" class="sublabel">Zetsu training zone</text>
    {:else if roomNumber === '1006'}
      <!-- Tyson preaches from a fixed seat, her disciples before her, ch. 375. -->
      <rect x="110" y="300" width="130" height="60" class="furniture" />
      <text x="175" y="380" class="sublabel">Preaching dais</text>
    {:else if roomNumber === '1007'}
      <!-- Luzurus is on this couch in ch. 362, 366 and still in 414. -->
      <rect x="90" y="420" width="190" height="60" rx="12" class="furniture" />
      <text x="185" y="500" class="sublabel">Couch</text>
    {:else if roomNumber === '1014'}
      <text x="350" y="440" class="sublabel">Nen Classroom</text>
      <circle
        cx="350"
        cy="460"
        r="60"
        fill="rgba(255, 0, 0, 0.1)"
        stroke="red"
        stroke-width="2"
        stroke-dasharray="5,5"
      />
      <!-- Woble's cradle, on the guarded side of the class. -->
      <rect x="500" y="430" width="100" height="70" rx="8" class="furniture" />
      <text x="550" y="520" class="sublabel">Cradle</text>
    {/if}
  </g>
</svg>
