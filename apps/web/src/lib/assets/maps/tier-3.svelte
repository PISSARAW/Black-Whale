<script lang="ts">
  /**
   * Tier 3, generated from `data/ship/blueprint.json`.
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
      id: 'tier-3-bulkhead-access',
      region: null,
      points: '450.0,52.0 550.0,52.0 550.0,68.0 450.0,68.0',
      label: '',
      size: 0,
      at: [500.0, 60.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-3-forward-corridor',
      region: null,
      points: '150.0,68.0 830.0,68.0 830.0,100.0 150.0,100.0',
      label: 'Forward Corridor',
      size: 12,
      at: [490.0, 88.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-3-central-spine',
      region: null,
      points: '360.0,100.0 400.0,100.0 400.0,470.0 360.0,470.0',
      label: 'Central Spine',
      size: 12,
      at: [380.0, 289.0],
      turned: true,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-3-starboard-corridor',
      region: null,
      points: '600.0,100.0 640.0,100.0 640.0,470.0 600.0,470.0',
      label: 'Starboard Corridor',
      size: 12,
      at: [620.0, 289.0],
      turned: true,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-3-aft-corridor',
      region: null,
      points: '150.0,470.0 830.0,470.0 830.0,505.0 150.0,505.0',
      label: 'Aft Corridor',
      size: 12,
      at: [490.0, 491.5],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-3-port-promenade',
      region: null,
      points: '100.0,100.0 180.0,100.0 180.0,470.0 100.0,470.0',
      label: 'Port Promenade',
      size: 9,
      at: [140.0, 288.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-3-starboard-promenade',
      region: null,
      points: '790.0,100.0 940.0,100.0 940.0,470.0 790.0,470.0 790.0,350.0 830.0,350.0 790.0,240.0',
      label: 'Starboard Promenade',
      size: 12,
      at: [867.5, 287.8],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-3-residential-first-class',
      region: 't3-residential-1st',
      points:
        '180.0,100.0 360.0,100.0 360.0,250.0 180.0,250.0 180.0,210.0 240.0,210.0 240.0,180.0 180.0,180.0',
      label: 'First-Class Residential Block',
      size: 9,
      at: [274.3, 176.6],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-3-residential-room-3101',
      region: 'room-3101',
      points: '180.0,180.0 240.0,180.0 240.0,210.0 180.0,210.0',
      label: '',
      size: 0,
      at: [210.0, 195.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-3-residential-standard',
      region: 't3-residential-ord',
      points: '180.0,270.0 360.0,270.0 360.0,470.0 180.0,470.0',
      label: 'Standard Residential Block',
      size: 12,
      at: [270.0, 374.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-3-central-hospital',
      region: 't3-hospital',
      points: '640.0,220.0 790.0,220.0 790.0,370.0 640.0,370.0',
      label: 'Central Hospital',
      size: 12,
      at: [715.0, 299.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-3-central-police-station',
      region: 'central-police-station',
      points: '400.0,300.0 500.0,300.0 500.0,430.0 400.0,430.0',
      label: 'Central Police Station',
      size: 9,
      at: [450.0, 368.0],
      turned: true,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-3-residential-units',
      region: 'central-police-station',
      points: '400.0,430.0 500.0,430.0 500.0,470.0 400.0,470.0',
      label: '',
      size: 0,
      at: [450.0, 450.0],
      turned: false,
      through: false,
      inferred: true,
    },
    {
      id: 'tier-3-central-courthouse',
      region: 'central-courthouse',
      points: '500.0,300.0 600.0,300.0 600.0,470.0 500.0,470.0',
      label: 'Central Courthouse',
      size: 9,
      at: [550.0, 388.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-3-cineplex',
      region: 't3-cinema',
      points: '640.0,100.0 790.0,100.0 790.0,220.0 640.0,220.0',
      label: 'Cineplex',
      size: 12,
      at: [715.0, 164.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-3-observation-deck',
      region: 't3-obs-deck',
      points:
        '100.0,100.0 100.0,470.0 77.14,448.57 60.0,385.71 51.43,300.0 60.0,214.29 77.14,151.43',
      label: 'Observation Deck',
      size: 12,
      at: [80.7, 299.2],
      turned: true,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-3-heilly-family-office',
      region: 't3-heilly',
      points: '640.0,370.0 790.0,370.0 790.0,470.0 640.0,470.0',
      label: 'Heil-Ly Family Office',
      size: 12,
      at: [715.0, 424.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-3-royal-army-local-section',
      region: null,
      points: '400.0,171.43 600.0,171.43 600.0,280.0 400.0,280.0',
      label: 'Royal Army Local Section',
      size: 12,
      at: [500.0, 229.7],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-3-forward-port-floor',
      region: null,
      points: '400.0,100.0 600.0,100.0 600.0,171.43 400.0,171.43',
      label: 'Forward Port Floor',
      size: 12,
      at: [500.0, 139.7],
      turned: false,
      through: false,
      inferred: true,
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
    points="120.0,50.0 90.31,64.0 67.2,102.0 50.71,158.0 40.8,226.0 37.51,300.0 40.8,374.0 50.71,442.0 67.2,498.0 90.31,536.0 120.0,550.0 850.0,550.0 885.11,536.0 912.4,498.0 931.89,442.0 943.6,374.0 947.51,300.0 943.6,226.0 931.91,158.0 912.4,102.0 885.11,64.0 850.0,50.0"
  />

  <g id="tier-3-zones">
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
