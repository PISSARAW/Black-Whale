<script lang="ts">
  /**
   * The observation deck, drawn from `data/ship/blueprint.json`.
   *
   * It used to be drawn as an open-air platform at the bow, over a sea with
   * waves on it. It is not open air: the room stands inboard on Tier 3 behind a
   * window ch. 380 draws curved. But the sea was right. The panel puts the
   * container city of the lower tiers under the glass and the water beyond it,
   * out to the horizon and the cloud over it — the Black Whale sails to the Dark
   * Continent, it does not fly there.
   *
   * The footprint below is the blueprint's, corner for corner, and it is a
   * different room from the one this file used to draw: ch. 358's annotated
   * cutaway put the deck at the bow, and the drawing kept the aft footprint it
   * had been given by a deck plan read with the axes crossed. What that leaves
   * is not a square room off a corridor but a crescent 129,5 m across the whole
   * bow and 17 m deep, with the cap of the hull curving away in front of it.
   *
   * `deckMaps.test.ts` holds the five generated deck plans to the blueprint;
   * this one is drawn by hand, which is how it drifted, so `localMaps.test.ts`
   * now holds it to the same corners.
   */

  // Room interactions are not wired up yet. The elements keep their click
  // and keyboard affordances so the behaviour can be attached in one place
  // when it exists; until then this must not log on a public page.
  function handleElementClick(_elementId: string) {}

  function activate(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    ;(event.currentTarget as Element).dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }

  /**
   * The plan, turned a quarter to the right.
   *
   * The deck plans of `/ship` put the bow at the left and +z down the page. A
   * room 129,5 m wide and 17 m deep drawn that way is a ribbon eight times taller
   * than it is broad, and unreadable in the frame it is given. So this is that
   * same drawing rotated 90° clockwise — bow at the top, +z to the left — which
   * is a rotation and not a mirror: what is to your left standing in the room is
   * to the left on the page.
   *
   * 6,6 px to the metre, which is what puts 129,5 m of bow inside the viewBox.
   */
  const SCALE = 6.6
  /** Athwartships, across the page: +z to the left, so the drawing is not flipped. */
  const px = (z: number) => (59.5 - z) * SCALE + 70
  /** Fore and aft, down the page: the bow is at -x, so the bow is at the top. */
  const py = (x: number) => (x + 157) * SCALE + 150

  /** The footprint, corner for corner: the aft wall, then the cap of the bow. */
  const footprint: [number, number][] = [
    [-140, -70],
    [-140, 59.5],
    [-148, 52],
    [-154, 30],
    [-157, 0],
    [-154, -30],
    [-148, -52],
  ]
  const outline = footprint.map(([mx, mz]) => `${px(mz)},${py(mx)}`).join(' ')

  /**
   * The bay: 30 m of glass on the centreline, 0,3 m thick, at x = -154,5.
   *
   * The blueprint's own solid, not a line eyeballed along the wall — the same
   * rectangle `$lib/tour/mesh` cuts at the horizon and lights the room with.
   */
  const bay = { at: [-154.5, 0], size: [0.3, 30] }
  const bayFrom = bay.at[1] - bay.size[1] / 2
  const bayTo = bay.at[1] + bay.size[1] / 2

  /**
   * The one way in, and the walk derives it rather than declaring it: a 3 m
   * doorway in the middle of the wall the deck shares with the promenade behind
   * it. Nothing else on Tier 3 touches this room.
   */
  const door = { from: [-140, -6.75], to: [-140, -3.75] }
</script>

<svg
  viewBox="0 0 1000 330"
  class="w-full h-full text-[#FFFFF0] bg-[#050505] rounded-lg border border-[#333]"
>
  <defs>
    <style>
      .room {
        fill: rgba(255, 255, 240, 0.03);
        stroke: #fffff0;
        stroke-width: 3;
      }
      .window {
        stroke: #9dc4e0;
        stroke-width: 9;
        stroke-linecap: round;
        cursor: pointer;
      }
      .window:hover {
        stroke: #d8ecfa;
      }
      .door {
        stroke: #ffd700;
        stroke-width: 5;
        cursor: pointer;
      }
      .door:hover {
        stroke: #fff;
      }
      .bar {
        fill: rgba(220, 180, 100, 0.2);
        stroke: #d09030;
        stroke-width: 2;
      }
      .lounger {
        fill: rgba(180, 220, 255, 0.1);
        stroke: #8eb8e6;
        stroke-width: 1.5;
      }
      .parasol {
        fill: rgba(255, 100, 100, 0.15);
        stroke: #cc4444;
        stroke-width: 2;
        stroke-dasharray: 4 4;
      }
      .centreline {
        stroke: #fffff0;
        stroke-width: 1;
        stroke-dasharray: 4 6;
        opacity: 0.35;
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        font-size: 12px;
        pointer-events: none;
        text-anchor: middle;
      }
      .sublabel {
        fill: #9dc4e0;
        font-family: sans-serif;
        font-size: 11px;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>

  <text x="500" y="30" class="label" font-size="22" font-weight="bold" fill="#FFD700">
    Observation Deck — Tier 3
  </text>
  <text x="500" y="50" class="label" font-size="10" opacity="0.55">
    129,5 m across the bow, 17 m deep, 1 516 m² under a 9 m deckhead — ch. 358 for where it stands,
    ch. 380 for the bay
  </text>

  <!-- What is on the other side of the glass, which is the reason for the room -->
  <text x="500" y="90" class="sublabel" font-size="11">
    Bow ↑ — the container city on the tiers below, then the sea out to the horizon
  </text>

  <polygon points={outline} class="room" />

  <!-- z = 0, the one line of the ship's own frame that can be drawn here -->
  <line x1={px(0)} y1={py(-157) - 8} x2={px(0)} y2={py(-140) + 8} class="centreline" />

  <!-- The bay, across the cap of the bow -->
  <line
    role="button"
    tabindex="0"
    aria-label="Inspect the observation window"
    onkeydown={activate}
    class="window"
    x1={px(bayFrom)}
    y1={py(bay.at[0])}
    x2={px(bayTo)}
    y2={py(bay.at[0])}
    onclick={() => handleElementClick('observation-window')}
  />
  <text x={px(0)} y={py(bay.at[0]) + 24} class="sublabel">Observation window — 30 m of glass</text>

  <!-- Decorative interior (Ch. 380: parasols, bars, loungers) -->
  <rect x={px(-10)} y={py(-152)} width={4 * SCALE} height={1.5 * SCALE} class="bar" />
  <rect x={px(-12)} y={py(-149)} width={1.5 * SCALE} height={2.5 * SCALE} class="lounger" />
  <rect x={px(-8)} y={py(-149)} width={1.5 * SCALE} height={2.5 * SCALE} class="lounger" />
  <circle cx={px(-10)} cy={py(-150)} r={1.5 * SCALE} class="parasol" />

  <rect x={px(10)} y={py(-152)} width={4 * SCALE} height={1.5 * SCALE} class="bar" />
  <rect x={px(12)} y={py(-149)} width={1.5 * SCALE} height={2.5 * SCALE} class="lounger" />
  <rect x={px(8)} y={py(-149)} width={1.5 * SCALE} height={2.5 * SCALE} class="lounger" />
  <circle cx={px(10)} cy={py(-150)} r={1.5 * SCALE} class="parasol" />
  
  <text x={px(0)} y={py(-146)} class="sublabel">Indoor beach / Lounge area (ch. 380)</text>

  <!-- The one way in: the promenade behind the deck -->
  <line
    role="button"
    tabindex="0"
    aria-label="Open the doors"
    onkeydown={activate}
    class="door"
    x1={px(door.from[1])}
    y1={py(door.from[0])}
    x2={px(door.to[1])}
    y2={py(door.to[0])}
    onclick={() => handleElementClick('port-promenade')}
  />
  <text x={px(-5.25)} y={py(-140) + 22} class="label" font-size="11" opacity="0.6">
    To the promenade — reconstructed to make the deck contiguous, no panel draws it
  </text>
</svg>
