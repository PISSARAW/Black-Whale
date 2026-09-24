<script lang="ts">
  /**
   * Tier 1-C, generated from `data/ship/blueprint.json`.
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
      points: '640.63,402.14 656.51,402.14 656.51,417.14 640.63,417.14',
      label: '',
      size: 0,
      at: [648.6, 409.6],
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
      id: 'tier-1-princes-burial-chamber',
      region: 'princes-burial-chamber',
      points: '656.51,402.14 663.77,397.8 668.91,391.11 671.31,383.03 670.6,374.6 666.89,367.03 660.66,361.31 652.8,358.26 644.34,358.26 636.49,361.31 630.26,367.03 626.54,374.6 625.83,383.03 628.23,391.11 633.37,397.8 640.63,402.14',
      label: '',
      size: 0,
      at: [648.6, 380.6],
      turned: false,
      through: false,
      inferred: true,
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
      points: '120.0,250.0 150.0,250.0 150.0,350.0 120.0,350.0',
      label: '',
      size: 0,
      at: [135.0, 300.0],
      turned: false,
      through: false,
      inferred: true,
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
      inferred: true,
    },
    {
      id: 'tier-1-lifeboats-port-pod-cabin',
      region: 'lifeboats',
      points: '500.0,307.43 502.83,306.86 505.26,305.26 506.86,302.83 507.43,300.0 506.86,297.17 505.26,294.74 502.83,293.14 500.0,292.57 497.17,293.14 494.74,294.74 493.14,297.17 492.57,300.0 493.14,302.83 494.74,305.26 497.17,306.86',
      label: '',
      size: 0,
      at: [500.0, 300.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-1-vvip-recreation-gallery',
      region: 'vvip-recreation-hall',
      points: '500.0,328.57 580.0,328.57 580.0,420.0 500.0,420.0',
      label: '',
      size: 0,
      at: [540.0, 374.3],
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
