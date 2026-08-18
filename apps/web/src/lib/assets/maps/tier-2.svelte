<script lang="ts">
  /**
   * Tier 2, generated from `data/ship/blueprint.json`.
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
      id: 'tier-2-tier-1-access',
      region: null,
      points: '512.0,132.0 503.0,123.0 503.0,101.0 512.0,92.0 538.0,92.0 547.0,101.0 547.0,123.0 538.0,132.0',
      label: '',
      size: 0,
      at: [525.0, 112.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-2-forward-corridor',
      region: null,
      points: '250.0,132.0 800.0,132.0 800.0,150.0 250.0,150.0',
      label: 'Forward Corridor',
      size: 12,
      at: [525.0, 145.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-2-main-corridor',
      region: null,
      points: '250.0,300.0 800.0,300.0 800.0,320.0 250.0,320.0',
      label: 'Main Corridor',
      size: 12,
      at: [525.0, 314.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-2-aft-corridor',
      region: null,
      points: '250.0,450.0 800.0,450.0 800.0,480.0 250.0,480.0',
      label: 'Aft Corridor',
      size: 12,
      at: [525.0, 469.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-2-port-promenade',
      region: null,
      points: '150.0,132.0 250.0,132.0 250.0,480.0 150.0,480.0',
      label: 'Port Promenade',
      size: 12,
      at: [200.0, 310.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-2-starboard-promenade',
      region: null,
      points: '800.0,132.0 880.0,132.0 880.0,480.0 800.0,480.0',
      label: 'Starboard Promenade',
      size: 12,
      at: [840.0, 310.0],
      turned: true,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-2-vip-quarters',
      region: null,
      points: '250.0,150.0 470.0,150.0 470.0,300.0 250.0,300.0',
      label: 'VIP Quarters',
      size: 12,
      at: [360.0, 229.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-2-heilly-secret-hideout',
      region: 't2-vip',
      points: '475.0,150.0 550.0,150.0 550.0,300.0 475.0,300.0',
      label: 'Heil-Ly Secret Hideout',
      size: 12,
      at: [512.5, 229.0],
      turned: true,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-2-screening-room',
      region: 't2-screening-room',
      points: '250.0,320.0 500.0,320.0 500.0,450.0 250.0,450.0',
      label: 'Screening Room',
      size: 12,
      at: [375.0, 389.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-2-ministry-of-justice',
      region: 't2-justice',
      points: '520.0,320.0 700.0,320.0 700.0,450.0 520.0,450.0',
      label: 'Ministry of Justice',
      size: 12,
      at: [610.0, 389.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-2-vip-witness-protection-area',
      region: 't2-justice',
      points: '705.0,320.0 800.0,320.0 800.0,450.0 705.0,450.0',
      label: '',
      size: 0,
      at: [752.5, 385.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-2-bulkhead',
      region: 't2-security',
      points: '150.0,480.0 850.0,480.0 850.0,515.0 150.0,515.0',
      label: 'Tier 2 Bulkhead',
      size: 12,
      at: [500.0, 501.5],
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

  <polygon class="hull" points="200.0,80.0 159.51,92.31 128.0,125.77 105.51,175.03 92.0,234.89 87.51,300.0 92.0,365.11 105.51,424.97 128.0,474.23 159.51,507.69 200.0,520.0 750.0,520.0 804.0,507.69 846.0,474.23 876.0,424.97 894.0,365.11 900.0,300.0 894.0,234.89 876.0,175.03 846.0,125.77 804.0,92.31 750.0,80.0" />

  <g id="tier-2-zones">
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
