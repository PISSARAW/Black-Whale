<script lang="ts">
  /**
   * Tier 4, generated from `data/ship/blueprint.json`.
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
      id: 'tier-4-central-passage',
      region: 'tier-4-central-passage',
      points: '160.0,230.0 655.0,230.0 655.0,270.0 160.0,270.0',
      label: 'Central Passage Tier 4–5',
      size: 12,
      at: [407.5, 254.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-4-secondary-passage',
      region: null,
      points: '160.0,330.0 655.0,330.0 655.0,370.0 160.0,370.0',
      label: 'Secondary Transport Route',
      size: 12,
      at: [407.5, 354.0],
      turned: false,
      through: true,
      inferred: false,
    },
    {
      id: 'tier-4-forward-corridor',
      region: null,
      points: '130.0,60.0 850.0,60.0 850.0,80.0 130.0,80.0',
      label: 'Forward Corridor',
      size: 12,
      at: [490.0, 74.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-4-port-corridor',
      region: null,
      points: '130.0,80.0 160.0,80.0 160.0,500.0 130.0,500.0',
      label: 'Port Corridor',
      size: 12,
      at: [145.0, 294.0],
      turned: true,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-4-starboard-corridor',
      region: null,
      points: '655.0,80.0 670.0,80.0 670.0,480.0 655.0,480.0',
      label: 'Starboard Corridor',
      size: 9,
      at: [662.5, 283.0],
      turned: true,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-4-aft-corridor',
      region: null,
      points: '160.0,480.0 850.0,480.0 850.0,500.0 160.0,500.0',
      label: 'Aft Corridor',
      size: 12,
      at: [505.0, 494.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-4-starboard-promenade',
      region: null,
      points: '810.0,80.0 940.0,80.0 940.0,480.0 810.0,480.0',
      label: 'Starboard Promenade',
      size: 12,
      at: [875.0, 284.0],
      turned: false,
      through: true,
      inferred: true,
    },
    {
      id: 'tier-4-general-area-west-north',
      region: null,
      points: '160.0,80.0 300.0,80.0 300.0,230.0 160.0,230.0',
      label: 'West General Area (forward)',
      size: 9,
      at: [230.0, 158.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-4-general-area-west-mid',
      region: null,
      points: '160.0,270.0 300.0,270.0 300.0,330.0 160.0,330.0',
      label: '',
      size: 0,
      at: [230.0, 300.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-4-general-area-west-south',
      region: null,
      points: '160.0,370.0 300.0,370.0 300.0,480.0 160.0,480.0',
      label: 'West General Area (aft)',
      size: 9,
      at: [230.0, 428.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-4-general-area-center-north',
      region: null,
      points: '320.0,80.0 480.0,80.0 480.0,230.0 320.0,230.0',
      label: 'Central General Area (forward)',
      size: 9,
      at: [400.0, 158.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-4-general-area-center-south',
      region: null,
      points: '320.0,370.0 480.0,370.0 480.0,480.0 320.0,480.0',
      label: 'Central General Area (aft)',
      size: 9,
      at: [400.0, 428.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-4-general-area-east',
      region: null,
      points: '670.0,80.0 810.0,80.0 810.0,480.0 670.0,480.0',
      label: 'East General Area',
      size: 12,
      at: [740.0, 284.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-4-xi-yu-family-office',
      region: 't4-xiyu',
      points: '320.0,270.0 480.0,270.0 480.0,330.0 320.0,330.0',
      label: 'Xi-Yu Family Office',
      size: 12,
      at: [400.0, 304.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-4-royal-army-conference-room',
      region: 'royal-army-office',
      points: '500.0,80.0 650.0,80.0 650.0,230.0 500.0,230.0',
      label: '',
      size: 0,
      at: [575.0, 155.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-4-medical-clinic',
      region: null,
      points: '500.0,370.0 650.0,370.0 650.0,480.0 500.0,480.0',
      label: 'Tier 4 Medical Clinic',
      size: 12,
      at: [575.0, 429.0],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-4-recycling-sewage-facilities',
      region: 't4-recycling',
      points: '120.0,500.0 850.0,500.0 850.0,545.0 120.0,545.0',
      label: 'Recycling & Sewage Facilities',
      size: 12,
      at: [485.0, 526.5],
      turned: false,
      through: false,
      inferred: false,
    },
    {
      id: 'tier-4-ei-i-family-office',
      region: 'tier-4-ei-i-family-office',
      points: '480.0,270.0 654.86,270.0 654.86,330.0 480.0,330.0',
      label: 'Ei-I Family Office',
      size: 12,
      at: [567.4, 304.0],
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
    points="120.0,50.0 93.0,64.0 72.0,102.0 57.0,158.0 48.0,226.0 45.0,300.0 48.0,374.0 57.0,442.0 72.0,498.0 93.0,536.0 120.0,550.0 850.0,550.0 882.4,536.0 907.6,498.0 925.6,442.0 936.4,374.0 940.0,300.0 936.4,226.0 925.6,158.0 907.6,102.0 882.4,64.0 850.0,50.0"
  />

  <g id="tier-4-zones">
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
