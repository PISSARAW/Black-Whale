<script lang="ts">
  /**
   * Tier 5, generated from `data/ship/blueprint.json`.
   *
   * One unit of this 1000 x 600 viewBox is 0.35 m and the ship's midpoint is
   * (500, 300) — the frame the reconstruction is authored in. So every room is
   * drawn where the blueprint puts it, and every room the blueprint holds is
   * drawn: this map used to name a dozen of them and leave the rest as deck.
   *
   * Rooms the catalogue has a record for are clickable and zoom into their own
   * plan. Corridors and the spaces the reconstruction invented to keep the deck
   * contiguous are drawn dimmer and are not: there is nothing to open.
   *
   * Do not hand-edit — regenerate from the blueprint.
   */
  import { mapState } from '$lib/state/mapState.svelte'

  type Region = {
    id: string
    region: string | null
    points: string
    label: string
    size: number
    at: [number, number]
    turned: boolean
    through: boolean
    inferred: boolean
  }

  const regions: Region[] = [
    {
      id: 'tier-5-cabin-cross-corridor-west',
      region: null,
      points: '180.0,335.0 230.0,335.0 230.0,375.0 180.0,375.0',
      label: '',
      size: 0,
      at: [205.0, 355.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-5-cabin-cross-corridor-east',
      region: null,
      points: '310.0,335.0 360.0,335.0 360.0,375.0 310.0,375.0',
      label: '',
      size: 0,
      at: [335.0, 355.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-5-forward-corridor',
      region: null,
      points: '180.0,150.0 720.0,150.0 720.0,170.0 180.0,170.0',
      label: 'Forward Corridor',
      size: 12,
      at: [450.0, 164.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-5-main-corridor',
      region: null,
      points: '360.0,170.0 400.0,170.0 400.0,420.0 360.0,420.0',
      label: 'Main Corridor',
      size: 12,
      at: [380.0, 299.0],
      turned: true,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-5-transverse-corridor',
      region: null,
      points: '400.0,310.0 720.0,310.0 720.0,330.0 400.0,330.0',
      label: 'Transverse Corridor',
      size: 12,
      at: [560.0, 324.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-5-service-corridor-forward',
      region: null,
      points: '520.0,330.0 540.0,330.0 540.0,420.0 520.0,420.0',
      label: '',
      size: 0,
      at: [530.0, 375.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-5-service-corridor-aft',
      region: null,
      points: '630.0,330.0 650.0,330.0 650.0,420.0 630.0,420.0',
      label: '',
      size: 0,
      at: [640.0, 375.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-5-aft-corridor',
      region: null,
      points: '160.0,420.0 760.0,420.0 760.0,450.0 160.0,450.0',
      label: 'Aft Corridor',
      size: 12,
      at: [460.0, 439.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-5-port-promenade',
      region: null,
      points: '100.0,150.0 180.0,150.0 180.0,420.0 100.0,420.0',
      label: 'Port Promenade',
      size: 9,
      at: [140.0, 288.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-5-starboard-promenade',
      region: null,
      points: '720.0,191.43 800.0,191.43 800.0,420.0 720.0,420.0',
      label: 'Starboard Promenade',
      size: 12,
      at: [760.0, 309.7],
      turned: true,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-5-technical-recycling',
      region: 't4-recycling',
      points: '150.0,100.0 750.0,100.0 750.0,150.0 150.0,150.0',
      label: 'Technical & Recycling Level',
      size: 12,
      at: [450.0, 129.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-5-standard-cabins',
      region: 't5-residential',
      points: '180.0,170.0 360.0,170.0 360.0,335.0 180.0,335.0',
      label: 'Tier 5 Standard Cabins (forward)',
      size: 9,
      at: [270.0, 255.5],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-5-standard-cabins-aft',
      region: 't5-residential',
      points: '180.0,375.0 360.0,375.0 360.0,420.0 180.0,420.0',
      label: 'Tier 5 Standard Cabins (aft)',
      size: 9,
      at: [270.0, 400.5],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-5-area-37564',
      region: 'room-37564',
      points: '230.0,335.0 310.0,335.0 310.0,375.0 230.0,375.0',
      label: 'Area 37564',
      size: 12,
      at: [270.0, 359.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-5-warehouse',
      region: 't5-warehouses',
      points: '400.0,170.0 720.0,170.0 720.0,310.0 400.0,310.0',
      label: 'Cha-R-Controlled Warehouse',
      size: 12,
      at: [560.0, 244.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-5-cha-r-family-office',
      region: 't5-char',
      points: '400.0,330.0 520.0,330.0 520.0,420.0 400.0,420.0',
      label: 'Cha-R Family Office',
      size: 9,
      at: [460.0, 378.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-5-central-dining-hall',
      region: 'central-dining-hall',
      points: '540.0,330.0 630.0,330.0 630.0,420.0 540.0,420.0',
      label: '',
      size: 0,
      at: [585.0, 375.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-5-medical-clinic',
      region: 't5-medical-none',
      points: '650.0,330.0 720.0,330.0 720.0,420.0 650.0,420.0',
      label: '',
      size: 0,
      at: [685.0, 375.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-5-hangar-entrance',
      region: 'tier-5-hangar-entrance',
      points: '720.0,150.0 800.0,150.0 800.0,191.43 720.0,191.43',
      label: 'Hangar Entrance',
      size: 9,
      at: [760.0, 173.7],
      turned: false,
      through: false,
      inferred: false,
    },
  ]

  function select(regionId: string | null) {
    if (regionId) mapState.selectLocation(regionId)
  }

  function selectWithKeyboard(event: KeyboardEvent, regionId: string | null) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    event.stopPropagation()
    select(regionId)
  }
</script>

<svg viewBox="0 0 1000 600" class="w-full h-full text-[#FFFFF0]">
  <defs>
    <style>
      .hull {
        fill: #1a0f0f;
        stroke: #ffd700;
        stroke-width: 4;
      }
      .zone {
        fill: #2a1515;
        stroke: #fffff0;
        stroke-width: 1.5;
        transition: fill 0.2s;
      }
      .zone.clickable {
        cursor: pointer;
      }
      .zone.clickable:hover {
        fill: #3d1c1c;
      }
      .zone.selected {
        stroke: #ffd700;
        stroke-width: 2.5;
        fill: #4d2020;
      }
      .zone.through {
        fill: #150b0b;
        stroke: #ffd700;
        stroke-opacity: 0.35;
        stroke-width: 1;
        stroke-dasharray: 4 4;
      }
      .zone.inferred {
        fill: #16171c;
        stroke: #9dc4e0;
        stroke-opacity: 0.4;
      }
      .label {
        fill: #fffff0;
        font-family: sans-serif;
        pointer-events: none;
        text-anchor: middle;
      }
    </style>
  </defs>

  <polygon
    class="hull"
    points="150.0,100.0 123.0,109.8 102.0,136.4 87.0,175.6 78.0,223.2 75.0,275.0 78.0,326.8 87.0,374.4 102.0,413.6 123.0,440.2 150.0,450.0 750.0,450.0 777.0,440.2 798.0,413.6 813.0,374.4 822.0,326.8 825.0,275.0 822.0,223.2 813.0,175.6 798.0,136.4 777.0,109.8 750.0,100.0"
  />

  <g id="tier-5-zones">
    {#each regions as zone (zone.id)}
      {#if zone.region}
        <g
          role="button"
          tabindex="0"
          aria-label={`Open ${zone.label || zone.id}`}
          onclick={() => select(zone.region)}
          onkeydown={(event) => selectWithKeyboard(event, zone.region)}
        >
          <polygon
            class="zone clickable"
            class:through={zone.through}
            class:inferred={zone.inferred}
            class:selected={mapState.selectedLocationId === zone.region}
            points={zone.points}
          />
        </g>
      {:else}
        <polygon
          class="zone"
          class:through={zone.through}
          class:inferred={zone.inferred}
          points={zone.points}
        />
      {/if}
    {/each}

    {#each regions.filter((zone) => zone.size > 0) as zone (zone.id)}
      <text
        class="label"
        x={zone.at[0]}
        y={zone.at[1]}
        font-size={zone.size}
        transform={zone.turned ? `rotate(-90 ${zone.at[0]} ${zone.at[1]})` : ''}>{zone.label}</text
      >
    {/each}
  </g>
</svg>
