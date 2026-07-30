"""Generate the longitudinal section of /ship from data/ship/blueprint.json.

    python3 scripts/generate-section-map.py     # from the repository root
    npx prettier --write apps/web/src/lib/assets/maps/black-whale-overview.svelte

This is the drawing the deck maps cannot make. A deck plan answers *what adjoins
what on one floor*; the ship's own cross-section — the double page of ch. 349 —
answers *what is above what*, and the reconstruction had nothing that said it.
The overview it replaces was five hand-drawn slabs: it named no room, it was
traced from no data, and its whale was a shape rather than a hull.

The section is cut on the centreline, `x = 0`, looking to starboard, bow to the
left. Three things are drawn, and the difference between them is the whole point:

  * the rooms the cut passes **through** — solid, labelled, clickable;
  * the rooms it passes **beside** — port or starboard of the centreline, drawn
    behind and dim. They are the strips of texture the ch. 349 page is filled
    with, and they are real rooms rather than hatching;
  * the decks the reconstruction does **not** hold — the band between one tier's
    ceiling and the next tier's floor. The ship has 41 decks and the tour walks
    five, so roughly thirteen metres of ship sit between each pair of them. That
    space was always in the elevations; nothing drew it, so nothing said it.

Scale is isotropic and its own — a section 175 m long and 77 m tall does not fit
the deck plans' 0.35 m per unit — and the figure is printed when this runs.

Do not hand-edit the output; regenerate, then run prettier over it the way the
deck maps are.
"""
from blueprint_common import (
    THROUGH, load_blueprint, region_for, span_across, svelte_string, z_extent,
)

BP = load_blueprint()
DECKS = [t for t in BP['tiers'] if t['kind'] == 'deck']
BY_ID = {t['id']: t for t in DECKS}

VIEW_W, VIEW_H = 1000.0, 600.0
PAD_X = 44.0           # room for the bow and stern of the hull outline
TOP_ROOM = 74.0        # the title strip above the ship
SEA_ROOM = 92.0        # the water the hull sits in, below the keel

# Read off the ch. 349 cross-section: the sea cuts the hull at about a third of
# its height, which on these elevations falls inside tier 4. The blueprint holds
# no waterline — it is a fact about the ship rather than about a room — so it is
# stated here, with its source, and drawn as the one line that is measured off
# the page rather than derived.
WATERLINE = 24.0
WATERLINE_SOURCE = 'Coupe des ponts, chap. 349 — la flottaison y coupe la coque au niveau du pont 4.'

# Likewise the eye: the page draws it low and forward, on the flank the tour
# never sees from outside. It carries no room and opens nothing.
EYE_AT = (-56.0, 28.0)
EYE_R = 5.0

# Tier 1 is a liner, and the reconstruction holds one floor of it.
#
# The ch. 369 night exterior shows the vessel from outside: a hull pierced by
# two or three rows of lit portholes, and above it a superstructure stepped back
# in terraces, a dozen levels at its tallest block. The one floor plan anyone has
# drawn of it — the King's quarters, the reception hall and the princes' block in
# an unbroken chain, 115 m of the 140 m hull — has to be a *low* deck of that
# vessel, since no terrace runs the full length. Everything above it is ship this
# reconstruction does not hold.
#
# So the band over tier 1 is drawn open at the top rather than closed at a
# height. A closed band would be a claim about how tall the liner is, and the
# page gives its shape, not its scale.
SUPERSTRUCTURE_SOURCE = (
    'Extérieur de nuit, chap. 369 — la superstructure du paquebot du pont 1, '
    'étagée en gradins au-dessus du pont royal.'
)

KEEL = 0.0
TOP = max(t['elevation'] + t['ceiling'] for t in DECKS)
Z_MIN = min(z_extent(t['hull'])[0] for t in DECKS)
Z_MAX = max(z_extent(t['hull'])[1] for t in DECKS)

SCALE = min((VIEW_W - 2 * PAD_X) / (Z_MAX - Z_MIN), (VIEW_H - TOP_ROOM - SEA_ROOM) / (TOP - KEEL))
BASE = VIEW_H - SEA_ROOM          # where the keel line lands


def px(z): return round(PAD_X + (z - Z_MIN) * SCALE, 2)
def py(y): return round(BASE - (y - KEEL) * SCALE, 2)


def hull_span(tier):
    """How long the ship is at this deck, measured where the cut crosses it."""
    return span_across(tier['hull']) or z_extent(tier['hull'])


def hull_profile():
    """The whale in profile, sampled at the five decks and straight between them.

    The blueprint holds a hull outline per deck and nothing in between, so the
    profile is the honest thing to draw: five measured widths and a straight run
    from each to the next. It is not a curve anyone has drawn, and it does not
    pretend to be one.
    """
    bow, stern = [], []
    for tier in sorted(DECKS, key=lambda t: t['elevation']):
        z0, z1 = hull_span(tier)
        for y in (tier['elevation'], tier['elevation'] + tier['ceiling']):
            bow.append((px(z0), py(y)))
            stern.append((px(z1), py(y)))
    return bow + stern[::-1]


rows = []
for tier in DECKS:
    default_ceiling = tier['ceiling']
    for space in [s for s in BP['spaces'] if s['tierId'] == tier['id']]:
        cut = span_across(space['footprint'])
        z0, z1 = cut if cut else z_extent(space['footprint'])
        floor = tier['elevation'] + (space.get('floor') or 0.0)
        head = space['ceiling'] if space['ceiling'] is not None else default_ceiling
        x0, x1 = px(z0), px(z1)
        y1, y0 = py(floor), py(floor + head)
        w, h = x1 - x0, y1 - y0
        label = space['name']
        # A label only where it fits, as on the deck plans: 6.5 px a character
        # across, 16 px a line down. A section room is long and low, so nothing
        # is ever turned on its side here.
        size = 0
        if cut:
            size = 11 if (w > len(label) * 6 and h > 15) else (8 if (w > len(label) * 4.6 and h > 11) else 0)
        rows.append({
            'id': space['id'], 'tier': tier['id'], 'region': region_for(space),
            'x': round(x0, 2), 'y': round(y0, 2), 'w': round(w, 2), 'h': round(h, 2),
            'label': label if size else '',
            'name': label,
            'size': size,
            'at': [round(x0 + w / 2, 1), round(y0 + h / 2 + (size / 3 if size else 0), 1)],
            'cut': bool(cut),
            'through': space['category'] in THROUGH,
            'inferred': space['provenance'] == 'inferred',
        })

# Behind first, so the cut is drawn over the ship it is cut out of.
rows.sort(key=lambda r: (r['cut'], -r['w'] * r['h']))

decks_out = []
for tier in sorted(DECKS, key=lambda t: -t['elevation']):
    z0, z1 = hull_span(tier)
    decks_out.append({
        'id': tier['id'], 'name': tier['nameFr'],
        'child': bool(tier.get('parentTierId')),
        'x0': px(z0), 'x1': px(z1),
        'floor': py(tier['elevation']), 'ceiling': py(tier['elevation'] + tier['ceiling']),
        'elevation': tier['elevation'],
    })

# The ship the reconstruction does not hold: between one tier's ceiling and the
# floor of the tier above it. Drawn as a band rather than as invented decks —
# the page says the space is full, and says nothing whatever about what fills it.
gaps = []
order = sorted(DECKS, key=lambda t: t['elevation'])
for lower, upper in zip(order, order[1:]):
    top_of_lower = lower['elevation'] + lower['ceiling']
    if upper['elevation'] - top_of_lower < 1: continue
    z0 = max(hull_span(lower)[0], hull_span(upper)[0])
    z1 = min(hull_span(lower)[1], hull_span(upper)[1])
    gaps.append({
        'id': f"{lower['id']}-{upper['id']}",
        'x': px(z0), 'y': py(upper['elevation']),
        'w': round(px(z1) - px(z0), 2), 'h': round(py(top_of_lower) - py(upper['elevation']), 2),
        'metres': round(upper['elevation'] - top_of_lower, 1),
    })

# The liner over the topmost deck, open at the top: see SUPERSTRUCTURE_SOURCE.
top_deck = max(DECKS, key=lambda t: t['elevation'])
sz0, sz1 = hull_span(top_deck)
superstructure = {
    'x': px(sz0), 'y': 0.0,
    'w': round(px(sz1) - px(sz0), 2),
    'h': py(top_deck['elevation'] + top_deck['ceiling']),
}


def ts(rows_, fields):
    out = []
    for r in rows_:
        parts = []
        for key, kind in fields:
            v = r[key]
            if kind == 's': parts.append(f"      {key}: '{svelte_string(v)}',")
            elif kind == 'b': parts.append(f"      {key}: {'true' if v else 'false'},")
            elif kind == 'n?': parts.append(f"      {key}: {'null' if not v else chr(39) + v + chr(39)},")
            elif kind == 'a': parts.append(f"      {key}: [{v[0]}, {v[1]}],")
            else: parts.append(f"      {key}: {v},")
        out.append('    {\n' + '\n'.join(parts) + '\n    }')
    return ',\n'.join(out)


ROOM_FIELDS = [('id', 's'), ('tier', 's'), ('region', 'n?'), ('x', 'n'), ('y', 'n'),
               ('w', 'n'), ('h', 'n'), ('label', 's'), ('name', 's'), ('size', 'n'),
               ('at', 'a'), ('cut', 'b'), ('through', 'b'), ('inferred', 'b')]
DECK_FIELDS = [('id', 's'), ('name', 's'), ('child', 'b'), ('x0', 'n'), ('x1', 'n'),
               ('floor', 'n'), ('ceiling', 'n'), ('elevation', 'n')]
GAP_FIELDS = [('id', 's'), ('x', 'n'), ('y', 'n'), ('w', 'n'), ('h', 'n'), ('metres', 'n')]

hull = ' '.join(f'{x},{y}' for x, y in hull_profile())

src = f'''<script lang="ts">
  /**
   * The Black Whale in longitudinal section, generated from
   * `data/ship/blueprint.json` by `scripts/generate-section-map.py`.
   *
   * Cut on the centreline, looking to starboard, bow to the left — the view of
   * the ch. 349 double page, drawn from the reconstruction instead of traced.
   * One unit is {round(1 / SCALE, 4)} m; the section has its own scale because 175 m of ship
   * and 77 m of freeboard do not fit the deck plans' 0.35 m per unit.
   *
   * Rooms the cut passes through are solid, labelled where the label fits, and
   * open their deck. Rooms it passes beside — everything to port or starboard —
   * are drawn behind and dim: they are what fills the ship, and on the manga
   * page they are the strips of texture between the labelled callouts.
   *
   * The banded gaps are the decks this reconstruction does not hold. The ship
   * has 41 of them and the tour walks 5, so about thirteen metres of ship sit
   * between each pair. Nothing is drawn inside them, because nothing is known
   * to be.
   *
   * The band over tier 1 is the same admission, and it is open at the top: the
   * ch. 369 exterior shows a liner terraced a dozen levels above the one floor
   * of it anyone has drawn a plan for. Closing that band at a height would be a
   * claim about how tall the liner is, and the page gives its shape, not its
   * scale.
   *
   * Do not hand-edit — regenerate from the blueprint.
   */
  import {{ mapState }} from '$lib/state/mapState.svelte'
  import {{ t }} from '$lib/i18n'

  type Room = {{
    id: string
    tier: string
    region: string | null
    x: number
    y: number
    w: number
    h: number
    label: string
    name: string
    size: number
    at: [number, number]
    cut: boolean
    through: boolean
    inferred: boolean
  }}

  const rooms: Room[] = [
{ts(rows, ROOM_FIELDS)},
  ]

  /**
   * A deck of the tier-1 liner is labelled to starboard and on one line: three
   * tiers-worth of tab on the port margin, three and a half metres apart, is
   * three labels written over each other.
   */
  const decks = [
{ts(decks_out, DECK_FIELDS)},
  ]

  const gaps = [
{ts(gaps, GAP_FIELDS)},
  ]

  /**
   * The liner over tier 1, open at the top edge of the drawing rather than
   * closed at a height. It is the only band here that says how far up the ship
   * goes by refusing to say it.
   */
  const superstructure = {{
    x: {superstructure['x']},
    y: {superstructure['y']},
    w: {superstructure['w']},
    h: {superstructure['h']},
  }}

  const waterline = {py(WATERLINE)}

  /**
   * A room on the section opens the deck it belongs to and then itself, which
   * is the same two steps a reader takes by hand: the section is the way in to
   * a deck, not a replacement for it.
   */
  function open(room: Room) {{
    mapState.selectTier(room.tier)
    if (room.region) mapState.selectLocation(room.region)
  }}

  function openWithKeyboard(event: KeyboardEvent, room: Room) {{
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    event.stopPropagation()
    open(room)
  }}

  function openDeck(tierId: string) {{
    mapState.selectTier(tierId)
  }}

  function openDeckWithKeyboard(event: KeyboardEvent, tierId: string) {{
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    openDeck(tierId)
  }}
</script>

<svg viewBox="0 0 {int(VIEW_W)} {int(VIEW_H)}" class="w-full h-full text-[#FFFFF0]">
  <defs>
    <style>
      .sea {{
        fill: #0f172a;
      }}
      .hull {{
        fill: #1a0f0f;
        stroke: #ffd700;
        stroke-width: 3;
      }}
      .room {{
        fill: #2a1515;
        stroke: #fffff0;
        stroke-width: 1;
        transition: fill 0.2s;
      }}
      .room.behind {{
        fill: #221010;
        stroke: #fffff0;
        stroke-opacity: 0.18;
        stroke-width: 0.5;
        fill-opacity: 0.55;
      }}
      .room.clickable {{
        cursor: pointer;
      }}
      .room.clickable:hover {{
        fill: #3d1c1c;
      }}
      g[role='button']:focus .room {{
        stroke: #ffd700;
        stroke-width: 2;
      }}
      .room.through {{
        fill: #150b0b;
        stroke: #ffd700;
        stroke-opacity: 0.35;
        stroke-dasharray: 4 4;
      }}
      .room.inferred {{
        fill: #16171c;
        stroke: #9dc4e0;
        stroke-opacity: 0.4;
      }}
      .gap {{
        fill: url(#unbuilt);
        stroke: #ffd700;
        stroke-opacity: 0.12;
        stroke-width: 0.5;
      }}
      .deck-rule {{
        stroke: #ffd700;
        stroke-opacity: 0.45;
        stroke-width: 1;
        stroke-dasharray: 2 5;
      }}
      .deck-tab {{
        cursor: pointer;
      }}
      .deck-tab text {{
        fill: #ffd700;
        font-family: sans-serif;
        font-size: 12px;
        letter-spacing: 1px;
      }}
      .deck-tab:hover text {{
        fill: #fffff0;
      }}
      .label {{
        fill: #fffff0;
        font-family: sans-serif;
        pointer-events: none;
        text-anchor: middle;
      }}
      .note {{
        fill: #fffff0;
        fill-opacity: 0.5;
        font-family: sans-serif;
        font-size: 10px;
        pointer-events: none;
      }}
      .waterline {{
        stroke: #9dc4e0;
        stroke-opacity: 0.55;
        stroke-width: 1.5;
        stroke-dasharray: 8 6;
      }}
    </style>
    <!-- The liner fades out toward the top edge rather than stopping at a line:
         the drawing does not know how tall it is, and says so. -->
    <linearGradient id="open-top" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="1" />
      <stop offset="1" stop-color="#fff" stop-opacity="0" />
    </linearGradient>
    <mask id="fade-up">
      <rect x="{superstructure['x']}" y="{superstructure['y']}" width="{superstructure['w']}" height="{superstructure['h']}" fill="url(#open-top)" />
    </mask>
    <pattern id="unbuilt" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill="#140d0d" />
      <line x1="0" y1="0" x2="0" y2="6" stroke="#ffd700" stroke-opacity="0.13" stroke-width="1.5" />
    </pattern>
  </defs>

  <rect class="sea" x="0" y={{waterline}} width="{int(VIEW_W)}" height={{{int(VIEW_H)} - waterline}} />

  <polygon class="hull" points="{hull}" />

  <rect
    class="gap"
    mask="url(#fade-up)"
    x={{superstructure.x}}
    y={{superstructure.y}}
    width={{superstructure.w}}
    height={{superstructure.h}}
  />

  {{#each gaps as gap (gap.id)}}
    <rect class="gap" x={{gap.x}} y={{gap.y}} width={{gap.w}} height={{gap.h}} />
  {{/each}}

  <g id="section-rooms">
    {{#each rooms as room (room.id)}}
      {{#if room.cut && room.region}}
        <g
          role="button"
          tabindex="0"
          aria-label={{room.name}}
          onclick={{() => open(room)}}
          onkeydown={{(event) => openWithKeyboard(event, room)}}
        >
          <title>{{room.name}}</title>
          <rect
            class="room clickable"
            class:through={{room.through}}
            class:inferred={{room.inferred}}
            x={{room.x}}
            y={{room.y}}
            width={{room.w}}
            height={{room.h}}
          />
        </g>
      {{:else}}
        <rect
          class="room"
          class:behind={{!room.cut}}
          class:through={{room.through}}
          class:inferred={{room.inferred}}
          x={{room.x}}
          y={{room.y}}
          width={{room.w}}
          height={{room.h}}
        />
      {{/if}}
    {{/each}}

    {{#each rooms.filter((room) => room.size > 0) as room (room.id)}}
      <text class="label" x={{room.at[0]}} y={{room.at[1]}} font-size={{room.size}}>{{room.label}}</text>
    {{/each}}
  </g>

  <line class="waterline" x1="0" y1={{waterline}} x2="{int(VIEW_W)}" y2={{waterline}} />

  <!-- The eye of the ch. 349 page: low, forward, and opening nothing. -->
  <circle cx="{px(EYE_AT[0])}" cy="{py(EYE_AT[1])}" r="{round(EYE_R * SCALE, 1)}" fill="#050505" stroke="#ffd700" stroke-width="2" pointer-events="none" />
  <circle cx="{px(EYE_AT[0])}" cy="{py(EYE_AT[1])}" r="{round(EYE_R * SCALE / 2.6, 1)}" fill="#fffff0" pointer-events="none" />

  {{#each decks as deck (deck.id)}}
    <line class="deck-rule" x1={{deck.x0}} y1={{deck.floor}} x2={{deck.x1}} y2={{deck.floor}} />
    <g
      class="deck-tab"
      role="button"
      tabindex="0"
      aria-label={{deck.name}}
      onclick={{() => openDeck(deck.id)}}
      onkeydown={{(event) => openDeckWithKeyboard(event, deck.id)}}
    >
      {{#if deck.child}}
        <text x="{int(VIEW_W)}" y={{deck.ceiling + 11}} text-anchor="end" font-size="10"
          >{{deck.name}} · {{deck.elevation}} m</text
        >
      {{:else}}
        <text x="6" y={{deck.ceiling + 12}}>{{deck.name}}</text>
        <text x="6" y={{deck.ceiling + 25}} font-size="9" fill-opacity="0.55"
          >{{deck.elevation}} m</text
        >
      {{/if}}
    </g>
  {{/each}}

  {{#each gaps as gap (gap.id)}}
    {{#if gap.h > 26}}
      <text class="note" x={{gap.x + gap.w / 2}} y={{gap.y + gap.h / 2 + 3}} text-anchor="middle"
        >{{$t.ship.unmodelledDecks(gap.metres)}}</text
      >
    {{/if}}
  {{/each}}

  <text
    class="note"
    x={{superstructure.x + superstructure.w / 2}}
    y={{superstructure.y + superstructure.h - 12}}
    text-anchor="middle">{{$t.ship.superstructure}}</text
  >
</svg>
'''

open('apps/web/src/lib/assets/maps/black-whale-overview.svelte', 'w', encoding='utf-8').write(src)

cut = sum(1 for r in rows if r['cut'])
print(f'coupe : {len(rows)} pièces, {cut} dans la coupe, '
      f'{sum(1 for r in rows if r["cut"] and r["region"])} cliquables, '
      f'{sum(1 for r in rows if r["size"])} libellées')
print(f'échelle : 1 unité = {1 / SCALE:.4f} m   ({SCALE:.3f} unités/m)')
print(f'flottaison : {WATERLINE} m — {WATERLINE_SOURCE}')
print('ponts non modélisés : ' + ', '.join(f"{g['id']} {g['metres']} m" for g in gaps))
print('tierOverviewY (%) : ' + ', '.join(
    f"{d['id']} {round((d['floor'] + d['ceiling']) / 2 / VIEW_H * 100, 1)}" for d in decks_out))
print('tierOverviewBand (%) : ' + ', '.join(
    f"{d['id']} {round((d['floor'] - d['ceiling']) / VIEW_H * 100, 1)}" for d in decks_out))
