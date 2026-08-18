<script lang="ts">
  /**
   * Tier 1-B, generated from `data/ship/blueprint.json`.
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
      id: 'tier-1-b-starboard-corridor',
      region: null,
      points: '700.0,220.0 730.0,220.0 730.0,477.14 700.0,477.14',
      label: 'Starboard Corridor',
      size: 12,
      at: [715.0, 352.6],
      turned: true,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-soldiers-living-quarters',
      region: 'soldiers-living-quarters',
      points: '605.0,310.0 700.0,310.0 700.0,460.0 605.0,460.0',
      label: 'Soldiers\' Living Quarters',
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

  <polygon class="hull" points="326.43,211.43 850.0,211.43 850.0,485.71 326.43,485.71" />

  <g id="tier-1-b-zones">
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
