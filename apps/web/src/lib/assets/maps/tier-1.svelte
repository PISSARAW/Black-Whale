<script lang="ts">
  /**
   * Tier 1, generated from `data/ship/blueprint.json`.
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
      id: 'tier-1-burial-passage',
      region: null,
      points: '467.06,105.0 482.94,105.0 482.94,120.0 467.06,120.0',
      label: '',
      size: 0,
      at: [475.0, 112.5],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-vvip-corridor',
      region: 'vvip-living-quarters',
      points: '288.57,310.0 297.14,310.0 297.14,460.0 288.57,460.0',
      label: '',
      size: 0,
      at: [292.9, 385.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-queens-corridor',
      region: 'queens-living-quarters',
      points: '414.0,310.0 431.0,310.0 431.0,460.0 414.0,460.0',
      label: "Queens' Quarters Corridor",
      size: 9,
      at: [422.5, 388.0],
      turned: true,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-royal-residential-corridor',
      region: 'tier-1-royal-residential-sector',
      points: '495.0,310.0 565.0,310.0 565.0,460.0 495.0,460.0',
      label: 'Royal Residential Corridor',
      size: 9,
      at: [530.0, 388.0],
      turned: true,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-jail-block-walkway',
      region: null,
      points: '835.0,250.0 850.0,250.0 850.0,350.0 835.0,350.0',
      label: 'Jail Block Walkway',
      size: 9,
      at: [842.5, 303.0],
      turned: true,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-jail-block-hall',
      region: null,
      points: '730.0,220.0 850.0,220.0 850.0,250.0 745.0,250.0 745.0,350.0 730.0,350.0',
      label: 'Jail Block Hall',
      size: 12,
      at: [774.6, 258.1],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-royal-approach',
      region: null,
      points: '250.0,200.0 700.0,200.0 700.0,220.0 250.0,220.0',
      label: 'Banquet Hall Vestibule',
      size: 12,
      at: [475.0, 214.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-1-main-corridor',
      region: null,
      points: '250.0,290.0 494.86,290.0 494.86,310.0 250.0,310.0',
      label: 'Main Corridor (port)',
      size: 12,
      at: [372.4, 304.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-port-promenade',
      region: null,
      points: '150.0,120.0 200.0,120.0 200.0,200.0 250.0,200.0 250.0,470.0 150.0,470.0',
      label: 'Port Promenade',
      size: 12,
      at: [196.8, 316.4],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-starboard-corridor',
      region: null,
      points: '700.0,200.0 730.0,200.0 730.0,470.0 700.0,470.0',
      label: 'Starboard Corridor',
      size: 12,
      at: [715.0, 339.0],
      turned: true,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-aft-promenade',
      region: null,
      points: '250.0,460.0 700.0,460.0 700.0,480.0 250.0,480.0',
      label: 'Aft Promenade',
      size: 12,
      at: [475.0, 474.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-main-corridor-starboard',
      region: null,
      points: '565.14,290.0 700.0,290.0 700.0,310.0 565.14,310.0',
      label: 'Main Corridor (starboard)',
      size: 9,
      at: [632.6, 303.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-king-living-quarters',
      region: 'king-quarters',
      points: '200.0,120.0 750.0,120.0 750.0,200.0 200.0,200.0',
      label: "King's Living Quarters",
      size: 12,
      at: [475.0, 164.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-princes-burial-chamber',
      region: 'princes-burial-chamber',
      points:
        '482.94,105.0 490.2,100.66 495.34,93.97 497.74,85.89 497.03,77.46 493.31,69.89 487.09,64.17 479.23,61.11 470.77,61.11 462.91,64.17 456.69,69.89 452.97,77.46 452.26,85.89 454.66,93.97 459.8,100.66 467.06,105.0',
      label: '',
      size: 0,
      at: [475.0, 83.4],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-banquet-hall',
      region: 'banquet-hall',
      points: '250.0,220.0 700.0,220.0 700.0,290.0 250.0,290.0',
      label: 'Banquet Hall',
      size: 12,
      at: [475.0, 259.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-restricted-royal-01',
      region: null,
      points: '250.0,310.0 288.57,310.0 288.57,347.5 250.0,347.5',
      label: '',
      size: 0,
      at: [269.3, 328.8],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-restricted-royal-02',
      region: null,
      points: '250.0,347.5 288.57,347.5 288.57,385.0 250.0,385.0',
      label: '',
      size: 0,
      at: [269.3, 366.2],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-suite-01',
      region: null,
      points: '250.0,385.0 288.57,385.0 288.57,422.5 250.0,422.5',
      label: '',
      size: 0,
      at: [269.3, 403.8],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-suite-02',
      region: null,
      points: '250.0,422.5 288.57,422.5 288.57,460.0 250.0,460.0',
      label: '',
      size: 0,
      at: [269.3, 441.2],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-suite-03',
      region: null,
      points: '297.14,310.0 330.0,310.0 330.0,347.5 297.14,347.5',
      label: '',
      size: 0,
      at: [313.6, 328.8],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-suite-04',
      region: null,
      points: '297.14,347.5 330.0,347.5 330.0,385.0 297.14,385.0',
      label: '',
      size: 0,
      at: [313.6, 366.2],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-mafia-suite',
      region: null,
      points: '297.14,385.0 330.0,385.0 330.0,422.5 297.14,422.5',
      label: '',
      size: 0,
      at: [313.6, 403.8],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-v5-suite',
      region: null,
      points: '297.14,422.5 330.0,422.5 330.0,460.0 297.14,460.0',
      label: '',
      size: 0,
      at: [313.6, 441.2],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vip-casino',
      region: 'casino',
      points: '335.0,310.0 385.0,310.0 385.0,460.0 335.0,460.0',
      label: 'VIP Casino',
      size: 12,
      at: [360.0, 389.0],
      turned: true,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-queens-living-quarters-room-01',
      region: 'queens-living-quarters',
      points: '390.0,310.0 414.0,310.0 414.0,347.51 390.0,347.51',
      label: '',
      size: 0,
      at: [402.0, 328.8],
      turned: false,
      through: false,
      inferred: true,
    },
    {
      id: 'tier-1-queens-living-quarters-room-02',
      region: 'queens-living-quarters',
      points: '431.0,310.0 455.0,310.0 455.0,347.51 431.0,347.51',
      label: '',
      size: 0,
      at: [443.0, 328.8],
      turned: false,
      through: false,
      inferred: true,
    },
    {
      id: 'tier-1-queens-living-quarters-room-03',
      region: 'queens-living-quarters',
      points: '390.0,347.51 414.0,347.51 414.0,385.0 390.0,385.0',
      label: '',
      size: 0,
      at: [402.0, 366.3],
      turned: false,
      through: false,
      inferred: true,
    },
    {
      id: 'tier-1-queens-living-quarters-room-04',
      region: 'queens-living-quarters',
      points: '431.0,347.51 455.0,347.51 455.0,385.0 431.0,385.0',
      label: '',
      size: 0,
      at: [443.0, 366.3],
      turned: false,
      through: false,
      inferred: true,
    },
    {
      id: 'tier-1-queens-living-quarters-room-05',
      region: 'queens-living-quarters',
      points: '390.0,385.0 414.0,385.0 414.0,422.51 390.0,422.51',
      label: '',
      size: 0,
      at: [402.0, 403.8],
      turned: false,
      through: false,
      inferred: true,
    },
    {
      id: 'tier-1-queens-living-quarters-room-06',
      region: 'queens-living-quarters',
      points: '431.0,385.0 455.0,385.0 455.0,422.51 431.0,422.51',
      label: '',
      size: 0,
      at: [443.0, 403.8],
      turned: false,
      through: false,
      inferred: true,
    },
    {
      id: 'tier-1-queens-living-quarters-room-07',
      region: 'queens-living-quarters',
      points: '390.0,422.51 414.0,422.51 414.0,460.0 390.0,460.0',
      label: '',
      size: 0,
      at: [402.0, 441.3],
      turned: false,
      through: false,
      inferred: true,
    },
    {
      id: 'tier-1-queens-living-quarters-room-08',
      region: 'queens-living-quarters',
      points: '431.0,422.51 455.0,422.51 455.0,460.0 431.0,460.0',
      label: '',
      size: 0,
      at: [443.0, 441.3],
      turned: false,
      through: false,
      inferred: true,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1001',
      region: 'tier-1-royal-residential-sector-room-1001',
      points: '565.0,310.0 600.0,310.0 600.0,331.4 565.0,331.4',
      label: '',
      size: 0,
      at: [582.5, 320.7],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1002',
      region: 'tier-1-royal-residential-sector-room-1002',
      points: '460.0,310.0 495.0,310.0 495.0,331.4 460.0,331.4',
      label: '',
      size: 0,
      at: [477.5, 320.7],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1003',
      region: 'tier-1-royal-residential-sector-room-1003',
      points: '565.0,331.4 600.0,331.4 600.0,352.8 565.0,352.8',
      label: '',
      size: 0,
      at: [582.5, 342.1],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1004',
      region: 'tier-1-royal-residential-sector-room-1004',
      points: '460.0,331.4 495.0,331.4 495.0,352.8 460.0,352.8',
      label: '',
      size: 0,
      at: [477.5, 342.1],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1005',
      region: 'tier-1-royal-residential-sector-room-1005',
      points: '565.0,352.8 600.0,352.8 600.0,374.2 565.0,374.2',
      label: '',
      size: 0,
      at: [582.5, 363.5],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1006',
      region: 'tier-1-royal-residential-sector-room-1006',
      points: '460.0,352.8 495.0,352.8 495.0,374.2 460.0,374.2',
      label: '',
      size: 0,
      at: [477.5, 363.5],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1007',
      region: 'tier-1-royal-residential-sector-room-1007',
      points: '565.0,374.2 600.0,374.2 600.0,395.6 565.0,395.6',
      label: '',
      size: 0,
      at: [582.5, 384.9],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1008',
      region: 'tier-1-royal-residential-sector-room-1008',
      points: '460.0,374.2 495.0,374.2 495.0,395.6 460.0,395.6',
      label: '',
      size: 0,
      at: [477.5, 384.9],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1009',
      region: 'tier-1-royal-residential-sector-room-1009',
      points: '565.0,395.6 600.0,395.6 600.0,417.0 565.0,417.0',
      label: '',
      size: 0,
      at: [582.5, 406.3],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1010',
      region: 'tier-1-royal-residential-sector-room-1010',
      points: '460.0,395.6 495.0,395.6 495.0,417.0 460.0,417.0',
      label: '',
      size: 0,
      at: [477.5, 406.3],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1011',
      region: 'tier-1-royal-residential-sector-room-1011',
      points: '565.0,417.0 600.0,417.0 600.0,438.4 565.0,438.4',
      label: '',
      size: 0,
      at: [582.5, 427.7],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1012',
      region: 'tier-1-royal-residential-sector-room-1012',
      points: '460.0,417.0 495.0,417.0 495.0,438.4 460.0,438.4',
      label: '',
      size: 0,
      at: [477.5, 427.7],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1013',
      region: 'tier-1-royal-residential-sector-room-1013',
      points: '565.0,438.4 600.0,438.4 600.0,460.0 565.0,460.0',
      label: '',
      size: 0,
      at: [582.5, 449.2],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-royal-residential-sector-room-1014',
      region: 'tier-1-royal-residential-sector-room-1014',
      points: '460.0,438.4 495.0,438.4 495.0,460.0 460.0,460.0',
      label: '',
      size: 0,
      at: [477.5, 449.2],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-soldiers-living-quarters',
      region: 'soldiers-living-quarters',
      points: '605.0,310.0 700.0,310.0 700.0,460.0 605.0,460.0',
      label: "Soldiers' Living Quarters",
      size: 9,
      at: [652.5, 388.0],
      turned: true,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-prison-beyond',
      region: 'beyond-cell',
      points: '745.0,250.0 835.0,250.0 835.0,290.0 745.0,290.0',
      label: '',
      size: 0,
      at: [790.0, 270.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vip-jail',
      region: 'vip-detention',
      points: '745.0,300.0 835.0,300.0 835.0,340.0 745.0,340.0',
      label: 'VIP Jail',
      size: 12,
      at: [790.0, 324.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-supreme-court',
      region: 'supreme-court',
      points: '730.0,370.0 850.0,370.0 850.0,450.0 730.0,450.0',
      label: 'Supreme Court',
      size: 12,
      at: [790.0, 414.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-lifeboats-port',
      region: 'lifeboats',
      points: '120.0,250.0 150.0,250.0 150.0,350.0 120.0,350.0',
      label: '',
      size: 0,
      at: [135.0, 300.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-lifeboats-starboard',
      region: 'lifeboats',
      points: '850.0,250.0 880.0,250.0 880.0,350.0 850.0,350.0',
      label: '',
      size: 0,
      at: [865.0, 300.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-princes-quarters-gate',
      region: null,
      points: '494.86,290.0 565.14,290.0 565.14,310.0 494.86,310.0',
      label: '',
      size: 0,
      at: [530.0, 300.0],
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
    points="250.0,100.0 209.51,111.2 178.0,141.6 155.51,186.4 142.0,240.8 137.51,300.0 142.0,359.2 155.51,413.6 178.0,458.4 209.51,488.8 250.0,500.0 700.0,500.0 754.0,488.8 796.0,458.4 826.0,413.6 844.0,359.2 850.0,300.0 844.0,240.8 826.0,186.4 796.0,141.6 754.0,111.2 700.0,100.0"
  />

  <g id="tier-1-zones">
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
