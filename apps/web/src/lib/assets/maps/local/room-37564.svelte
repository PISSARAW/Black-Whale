<script lang="ts">
  import { t } from '$lib/i18n'
  /**
   * Area 37564, restricted to what the published material establishes.
   *
   * The label and its Tier 5 footprint are catalogued; volumes 34–36 do not
   * show an identifiable interior. Earlier versions invented a vast hall,
   * pillars, ducts and a randomly scattered crowd. A deliberately empty plan
   * is more detailed canonically because it states the exact boundary between
   * what is known and what is not.
   */
  function inspect(_area: string) {}
  function activate(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    inspect('unpublished-interior')
  }

  const SCALE = 26
  const room = { x0: -94.5, x1: -66.5, z0: 12.25, z1: 26.25 }
  const x = (metres: number) => (metres - room.x0) * SCALE + 136
  const y = (metres: number) => (metres - room.z0) * SCALE + 128
</script>

<svg viewBox="0 0 1000 600" class="h-full w-full rounded-lg border border-[#333] bg-[#050505]">
  <defs>
    <style>
      .room {
        fill: rgba(255, 255, 240, 0.025);
        stroke: #fffff0;
        stroke-width: 4;
      }
      .unknown {
        fill: none;
        stroke: #666;
        stroke-width: 2;
        stroke-dasharray: 9 8;
      }
      .label {
        fill: #fffff0;
        font: 700 15px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
      .sub {
        fill: #9dc4e0;
        font: 11px sans-serif;
        text-anchor: middle;
        pointer-events: none;
      }
    </style>
  </defs>

  <text x="500" y="38" class="label" font-size="25" fill="#ffd700"
    >{$t.map.localMaps.room37564.title}</text
  >
  <text x="500" y="62" class="sub">{$t.map.localMaps.room37564.subtitle}</text>

  <rect
    role="button"
    tabindex="0"
    aria-label="Inspecter l’enveloppe connue de la zone 37564"
    x={x(room.x0)}
    y={y(room.z0)}
    width={(room.x1 - room.x0) * SCALE}
    height={(room.z1 - room.z0) * SCALE}
    class="room"
    onclick={() => inspect('unpublished-interior')}
    onkeydown={activate}
  />
  <rect x={x(-91.5)} y={y(14.2)} width={22 * SCALE} height={10.1 * SCALE} class="unknown" />
  <text x="500" y="295" class="label" font-size="30" opacity="0.24"
    >{$t.map.localMaps.room37564.zone}</text
  >
  <text x="500" y="330" class="sub"
    >Aucun mobilier ni détail de plafond attesté dans les tomes 34–36</text
  >
  <text x="500" y="520" class="sub"
    >Le contour vient du plan de visite ; le rectangle pointillé marque l’inconnu</text
  >
</svg>
