<script lang="ts">
  // Room interactions keep their keyboard/click affordances for map navigation
  function handleElementClick(_elementId: string) {}

  interface ChairCoord {
    id: string
    cx: number
    cy: number
    label: string
  }

  // 15 conference chairs mapped from metric positions (40 px per metre)
  const chairs: ChairCoord[] = [
    { id: 'chair-01', cx: 288, cy: 230, label: '01' },
    { id: 'chair-02', cx: 344, cy: 230, label: '02' },
    { id: 'chair-03', cx: 400, cy: 230, label: '03' },
    { id: 'chair-04', cx: 456, cy: 230, label: '04' },
    { id: 'chair-05', cx: 512, cy: 230, label: '05' },
    { id: 'chair-06', cx: 220, cy: 320, label: '06' },
    { id: 'chair-07', cx: 220, cy: 364, label: '07' },
    { id: 'chair-08', cx: 220, cy: 408, label: '08' },
    { id: 'chair-09', cx: 220, cy: 452, label: '09' },
    { id: 'chair-10', cx: 580, cy: 320, label: '10' },
    { id: 'chair-11', cx: 580, cy: 364, label: '11' },
    { id: 'chair-12', cx: 580, cy: 408, label: '12' },
    { id: 'chair-13', cx: 580, cy: 452, label: '13' },
    { id: 'chair-14', cx: 312, cy: 480, label: '14' },
    { id: 'chair-15', cx: 488, cy: 480, label: '15' },
  ]
</script>

<svg
  viewBox="0 0 1000 700"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .wall {
        stroke: #fffff0;
        stroke-width: 6;
        fill: none;
      }
      .zone {
        fill: rgba(45, 48, 53, 0.12);
        transition: fill 0.2s;
        cursor: pointer;
      }
      .zone:hover {
        fill: rgba(45, 48, 53, 0.28);
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 15px;
        font-weight: bold;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #9e9070;
        font-size: 11px;
        pointer-events: none;
        text-anchor: middle;
      }
      .furniture {
        fill: #3e352f;
        stroke: #5a5d64;
        stroke-width: 2;
      }
      .screen {
        fill: #eae8e1;
        stroke: #2d3035;
        stroke-width: 3;
      }
      .chair {
        fill: #232529;
        stroke: #8d9096;
        stroke-width: 1.5;
        cursor: pointer;
        transition: fill 0.15s;
      }
      .chair:hover {
        fill: #4a4d52;
      }
      .podium {
        fill: #2d3035;
        stroke: #9e9070;
        stroke-width: 2;
        cursor: pointer;
      }
      .tactical-board {
        fill: #dcd9d0;
        stroke: #5a5d64;
        stroke-width: 2;
      }
      .grid-line {
        stroke: #3d4f5d;
        stroke-width: 1;
        stroke-dasharray: 4 2;
        opacity: 0.7;
      }
    </style>
  </defs>

  <!-- Title header -->
  <text x="500" y="42" class="label" font-size="22" fill="#FFD700">
    Kakin Royal Army Briefing Room (Chap. 350, 380)
  </text>
  <text x="500" y="62" class="sublabel"> Tier 4 Security Operations & Joint Military Command </text>

  <g transform="translate(100, 80)">
    <!-- Room Walls (20m x 15m -> 800 x 600) -->
    <rect x="0" y="0" width="800" height="600" class="wall" />

    <!-- Speaker / Presenter Dais Stage Zone -->
    <rect
      role="button"
      tabindex="0"
      aria-label="Speaker Dais Stage Zone"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.currentTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }
      }}
      class="zone"
      x="170"
      y="0"
      width="460"
      height="136"
      onclick={() => handleElementClick('stage')}
    />
    <line
      x1="170"
      y1="136"
      x2="630"
      y2="136"
      stroke="#5a5d64"
      stroke-width="3"
      stroke-dasharray="6 3"
    />
    <text x="580" y="125" class="sublabel" font-size="10">DAIS (0.15m)</text>

    <!-- Briefing Screen (7.5m x 0.22m, X: [250, 550], Y: [3, 11]) -->
    <rect x="245" y="0" width="310" height="8" fill="#33363b" stroke="#5a5d64" stroke-width="1.5" />
    <rect x="250" y="3" width="300" height="8" class="screen" />
    <text x="400" y="30" class="sublabel" font-size="11">7.5m BRIEFING SCREEN</text>

    <!-- Tactical Chart Board on West Wall (5.0m, X: [0, 8], Y: [80, 280]) -->
    <rect x="0" y="80" width="10" height="200" class="tactical-board" />
    <!-- Tactical Grid preview lines -->
    {#each [110, 140, 170, 200, 230, 260] as gy (gy)}
      <line x1="1" y1={gy} x2="9" y2={gy} class="grid-line" />
    {/each}
    <text x="35" y="185" class="sublabel" font-size="11" transform="rotate(-90, 35, 185)">
      TACTICAL CHARTS (5m)
    </text>

    <!-- Lectern / Podium (1m x 1m, X: 350 to 390, Y: 150 to 190) -->
    <rect
      x="350"
      y="150"
      width="40"
      height="40"
      class="podium"
      role="button"
      tabindex="0"
      aria-label="Lectern"
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleElementClick('lectern')
        }
      }}
      onclick={() => handleElementClick('lectern')}
    />
    <!-- Gooseneck Mic indicator dots -->
    <circle cx="362" cy="158" r="2.5" fill="#111" stroke="#bf3030" stroke-width="1" />
    <circle cx="378" cy="158" r="2.5" fill="#111" stroke="#bf3030" stroke-width="1" />
    <text x="370" y="206" class="sublabel" font-size="10">LECTERN</text>

    <!-- U-Shaped Meeting Table -->
    <!-- Head table: X in [250, 550], Y in [250, 298] -->
    <rect x="250" y="250" width="300" height="48" class="furniture" />
    <!-- Port arm: X in [250, 350], Y in [298, 442] -->
    <rect x="250" y="298" width="100" height="144" class="furniture" />
    <!-- Starboard arm: X in [450, 550], Y in [298, 442] -->
    <rect x="450" y="298" width="100" height="144" class="furniture" />

    <!-- Cable access raceways on table surface -->
    <rect x="280" y="271" width="240" height="6" fill="#5a5d64" opacity="0.6" />
    <rect x="297" y="320" width="6" height="100" fill="#5a5d64" opacity="0.6" />
    <rect x="497" y="320" width="6" height="100" fill="#5a5d64" opacity="0.6" />

    <!-- Table label in central hollow -->
    <text x="400" y="360" class="sublabel" font-size="12">COMMAND U-TABLE</text>
    <text x="400" y="378" class="sublabel" font-size="10">(15 DELEGATE SEATS)</text>

    <!-- 15 Conference Executive Chairs -->
    {#each chairs as chair (chair.id)}
      <g
        role="button"
        tabindex="0"
        aria-label={'Chair ' + chair.label}
        onkeydown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleElementClick(chair.id)
          }
        }}
        onclick={() => handleElementClick(chair.id)}
      >
        <circle cx={chair.cx} cy={chair.cy} r="14" class="chair" />
        <text
          x={chair.cx}
          y={chair.cy + 4}
          font-size="10"
          fill="#fff"
          text-anchor="middle"
          pointer-events="none"
        >
          {chair.label}
        </text>
      </g>
    {/each}

    <!-- Entrance Doorway at South Wall -->
    <rect x="370" y="594" width="60" height="6" fill="#ffd700" />
    <text x="400" y="586" class="sublabel" font-size="10">SECURITY ACCESS</text>
  </g>
</svg>
