"""Generate the five deck maps of /ship from data/ship/blueprint.json.

    python3 scripts/generate-deck-maps.py     # from the repository root

One unit of the 1000x600 deck-plan viewBox is 0.35 m, with the ship's midpoint
at (500, 300) — the same frame the blueprint is authored in, so a room lands on
the map exactly where the reconstruction puts it, and every room the blueprint
holds is drawn rather than the dozen a hand-drawn map had room to name.

The deck maps are therefore generated rather than edited: change a footprint in
the blueprint and rerun this. What stays hand-written is which rooms zoom into
their own local plan, in apps/web/src/lib/map/mapAssetRegistry.ts, which this
reads to decide what a region click should open.
"""
from blueprint_common import THROUGH, centroid, load_blueprint, region_for

BP = load_blueprint()

def sx(x): return round(x / 0.35 + 500, 2)
def sy(z): return round(z / 0.35 + 300, 2)

for tier in [t for t in BP['tiers'] if t['kind'] == 'deck']:
    tid = tier['id']
    spaces = [s for s in BP['spaces'] if s['tierId'] == tid]
    hull = ' '.join(f'{sx(x)},{sy(z)}' for x, z in tier['hull'])

    rows = []
    for s in sorted(spaces, key=lambda s: 0 if s['category'] in THROUGH else 1):
        fp = s['footprint']
        pts = ' '.join(f'{sx(x)},{sy(z)}' for x, z in fp)
        cx, cy = centroid(fp)
        xs = [sx(p[0]) for p in fp]; ys = [sy(p[1]) for p in fp]
        w, h = max(xs) - min(xs), max(ys) - min(ys)
        label = s['name']
        # A label only where it fits: 6.5 px a character across, 16 px a line
        # down. A room taller than it is wide takes the label on its side.
        size = 12 if (w > len(label) * 6.5 and h > 16) else (9 if (w > len(label) * 5 and h > 12) else 0)
        turned = False
        if not size and h > w:
            size = 12 if (h > len(label) * 6.5 and w > 16) else (9 if (h > len(label) * 5 and w > 12) else 0)
            turned = bool(size)
        rows.append({
            'id': s['id'], 'region': region_for(s), 'points': pts,
            'label': label if size else '', 'size': size,
            'cx': round(sx(cx), 1), 'cy': round(sy(cy) + (size / 3 if size else 0), 1),
            'turned': turned,
            'through': s['category'] in THROUGH,
            'provenance': s['provenance'],
        })

    entries = ',\n'.join(
        '    {\n' +
        f"      id: '{r['id']}',\n"
        f"      region: {'null' if not r['region'] else chr(39) + r['region'] + chr(39)},\n"
        f"      points: '{r['points']}',\n"
        f"      label: '{r['label'].replace(chr(39), chr(92) + chr(39))}',\n"
        f"      size: {r['size']},\n"
        f"      at: [{r['cx']}, {r['cy']}],\n"
        f"      turned: {'true' if r['turned'] else 'false'},\n"
        f"      through: {'true' if r['through'] else 'false'},\n"
        f"      inferred: {'true' if r['provenance'] == 'inferred' else 'false'},\n"
        '    }'
        for r in rows)

    name = tier['name']
    src = f'''<script lang="ts">
  /**
   * {name}, generated from `data/ship/blueprint.json`.
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
  import {{ mapState }} from '$lib/state/mapState.svelte'

  type Region = {{
    id: string
    region: string | null
    points: string
    label: string
    size: number
    at: [number, number]
    turned: boolean
    through: boolean
    inferred: boolean
  }}

  const regions: Region[] = [
{entries},
  ]

  function select(regionId: string | null) {{
    if (regionId) mapState.selectLocation(regionId)
  }}

  function selectWithKeyboard(event: KeyboardEvent, regionId: string | null) {{
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    event.stopPropagation()
    select(regionId)
  }}
</script>

<svg viewBox="0 0 1000 600" class="w-full h-full text-[#FFFFF0]">
  <defs>
    <style>
      .hull {{
        fill: #1a0f0f;
        stroke: #ffd700;
        stroke-width: 4;
      }}
      .zone {{
        fill: #2a1515;
        stroke: #fffff0;
        stroke-width: 1.5;
        transition: fill 0.2s;
      }}
      .zone.clickable {{
        cursor: pointer;
      }}
      .zone.clickable:hover {{
        fill: #3d1c1c;
      }}
      .zone.selected {{
        stroke: #ffd700;
        stroke-width: 2.5;
        fill: #4d2020;
      }}
      .zone.through {{
        fill: #150b0b;
        stroke: #ffd700;
        stroke-opacity: 0.35;
        stroke-width: 1;
        stroke-dasharray: 4 4;
      }}
      .zone.inferred {{
        fill: #16171c;
        stroke: #9dc4e0;
        stroke-opacity: 0.4;
      }}
      .label {{
        fill: #fffff0;
        font-family: sans-serif;
        pointer-events: none;
        text-anchor: middle;
      }}
    </style>
  </defs>

  <polygon class="hull" points="{hull}" />

  <g id="{tid}-zones">
    {{#each regions as zone (zone.id)}}
      {{#if zone.region}}
        <g
          role="button"
          tabindex="0"
          aria-label={{`Open ${{zone.label || zone.id}}`}}
          onclick={{() => select(zone.region)}}
          onkeydown={{(event) => selectWithKeyboard(event, zone.region)}}
        >
          <polygon
            class="zone clickable"
            class:through={{zone.through}}
            class:inferred={{zone.inferred}}
            class:selected={{mapState.selectedLocationId === zone.region}}
            points={{zone.points}}
          />
        </g>
      {{:else}}
        <polygon
          class="zone"
          class:through={{zone.through}}
          class:inferred={{zone.inferred}}
          points={{zone.points}}
        />
      {{/if}}
    {{/each}}

    {{#each regions.filter((zone) => zone.size > 0) as zone (zone.id)}}
      <text
        class="label"
        x={{zone.at[0]}}
        y={{zone.at[1]}}
        font-size={{zone.size}}
        transform={{zone.turned ? `rotate(-90 ${{zone.at[0]}} ${{zone.at[1]}})` : ''}}>{{zone.label}}</text
      >
    {{/each}}
  </g>
</svg>
'''
    out = f'apps/web/src/lib/assets/maps/{tid}.svelte'
    open(out, 'w', encoding='utf-8').write(src)
    labelled = sum(1 for r in rows if r['size'])
    clickable = sum(1 for r in rows if r['region'])
    print(f'{tid}: {len(rows):3} zones, {clickable:3} cliquables, {labelled:3} libellées -> {out}')
