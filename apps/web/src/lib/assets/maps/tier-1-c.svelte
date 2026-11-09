<script lang="ts">
  /**
   * Tier 1-C, generated from `data/ship/blueprint.json`.
   *
   * The authored plan uses a 1000 x 600 coordinate frame at 0.35 m per unit,
   * with the ship's midpoint at (500, 300). Every tier uses the same landscape
   * frame; the walkthrough geometry remains in the shared ship axes.
   * Every room in the blueprint is drawn rather than leaving unnamed deck.
   *
   * Rooms the catalogue has a record for are clickable and zoom into their own
   * plan. Corridors and the spaces the reconstruction invented to keep the deck
   * contiguous are drawn dimmer and are not: there is nothing to open.
   *
   * Do not hand-edit — regenerate from the blueprint and annotations.
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
      points: '640.97,402.14 656.17,402.14 656.17,460.0 640.97,460.0',
      label: '',
      size: 0,
      at: [648.6, 431.1],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-c-port-corridor',
      region: null,
      points: '385.0,310.0 390.0,310.0 390.0,460.0 385.0,460.0',
      label: '',
      size: 0,
      at: [387.5, 385.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-c-aft-passage',
      region: null,
      points: '335.0,460.0 730.0,460.0 730.0,477.14 335.0,477.14',
      label: 'Aft Passage',
      size: 12,
      at: [532.5, 472.6],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-1-princes-burial-chamber-rotunda',
      region: 'princes-burial-chamber',
      points:
        '640.97,402.14 656.17,402.14 663.23,398.2 669.31,393.54 673.97,387.49 676.91,380.4 677.91,372.8 676.91,365.2 673.97,358.14 669.31,352.06 663.23,347.4 656.17,344.46 648.57,343.46 640.97,344.46 633.91,347.4 627.83,352.06 623.17,358.11 620.23,365.2 619.23,372.8 620.23,380.4 623.17,387.49 627.83,393.54 633.89,398.2 640.97,401.14',
      label: '',
      size: 0,
      at: [648.6, 372.9],
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
      id: 'tier-1-lifeboats-port',
      region: 'lifeboats',
      points: '811.43,200.0 880.0,200.0 880.0,250.0 811.43,250.0',
      label: '',
      size: 0,
      at: [845.7, 225.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-lifeboats-starboard',
      region: 'lifeboats',
      points: '811.43,350.0 880.0,350.0 880.0,400.0 811.43,400.0',
      label: '',
      size: 0,
      at: [845.7, 375.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-queens-void',
      region: null,
      points: '390.0,310.0 455.0,310.0 455.0,460.0 390.0,460.0',
      label: 'Port Central Floor',
      size: 12,
      at: [422.5, 389.0],
      turned: true,
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

  <polygon class="hull" points="326.43,301.43 738.57,301.43 738.57,485.71 326.43,485.71" />

  <g id="tier-1-c-zones">
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
