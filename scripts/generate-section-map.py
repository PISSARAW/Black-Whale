"""Generate the longitudinal section of /ship from data/ship/blueprint.json.

    python3 scripts/generate-section-map.py     # from the repository root
    npx prettier --write apps/web/src/lib/assets/maps/black-whale-overview.svelte

This is the drawing the deck maps cannot make. A deck plan answers *what adjoins
what on one floor*; the ship's own cross-section — the double page of ch. 349 —
answers *what is above what*, and the reconstruction had nothing that said it.
The overview it replaces was five hand-drawn slabs: it named no room, it was
traced from no data, and its whale was a shape rather than a hull.

The section is cut on the centreline, `z = 0`, looking to starboard, bow to the
left.

Which plane that is, is not a detail: this drawing was first cut on `x = 0`,
which is a *transverse* section — it showed the 175 m of the whale's beam where
the page shows the 318 m of her length. The hulls say which axis is which and
say it twice over. Each one is a parallel midbody between two caps at the
extremes of `x`, and each cap is symmetric about `z = 0`: flat sides and two
rounded ends, which is a bow and a stern. And the two caps differ from each
other — 28.9 m of taper forward of tier 3, 34.1 m aft — where a hull symmetric
about her centreline cannot tell one side from the other. Several room names
still read the short axis as fore and aft (`Forward Corridor`, `Aft
Promenade`); the hull is the older reading and the drawn one, and it wins.

Three things are drawn, and the difference between them is the whole point:

  * the rooms the cut passes **through** — solid, labelled, clickable;
  * the rooms it passes **beside** — port or starboard of the centreline, drawn
    behind and dim. They are the strips of texture the ch. 349 page is filled
    with, and they are real rooms rather than hatching;
  * the decks the reconstruction does **not** hold — the band between one tier's
    ceiling and the next tier's floor, and the terraced liner over tier 1. The
    ship has 41 decks and this holds eleven, so a handful sit in each band and
    eight stand above the last one anyone has drawn. Nothing is put inside them:
    the drawing says the space is full and not a word about what fills it.

Scale is isotropic and derived, and the figure is printed when this runs. It
lands within a millimetre of the deck plans' 0.35 m per unit, which is no
coincidence and no constraint either: the hull fills the width of a deck plan
much as it fills the width of this one, so the two drawings ended up at the same
scale by drawing the same 318 m across the same 1000 units.

Do not hand-edit the output; regenerate, then run prettier over it the way the
deck maps are.
"""
from blueprint_common import (
    THROUGH, load_blueprint, region_for, span_along, svelte_string, x_extent,
)

BP = load_blueprint()
DECKS = [t for t in BP['tiers'] if t['kind'] == 'deck']
BY_ID = {t['id']: t for t in DECKS}

VIEW_W, VIEW_H = 1000.0, 600.0
PAD_X = 44.0           # room for the bow and stern of the hull outline
TOP_ROOM = 74.0        # the title strip above the ship
SEA_ROOM = 92.0        # the water the hull sits in, below the keel

# Read off the ch. 349 cross-section: the sea cuts the hull at about a third of
# its height, which on these elevations falls inside the band of tier 4. The
# blueprint holds no waterline — it is a fact about the ship rather than about a
# room — so it is stated here, with its source, and drawn as the one line that is
# measured off the page rather than derived.
WATERLINE = 48.0
WATERLINE_SOURCE = 'Coupe des ponts, chap. 349 — la flottaison y coupe la coque au niveau du pont 4.'

# Likewise the eye: the page draws it low and forward, on the flank the tour
# never sees from outside. It carries no room and opens nothing. Forward is the
# bow cap, `-x`: the one room anyone has placed in the whale's teeth — the Xi-Yu
# family office, called the forward section — is at `x -63 … -7`.
EYE_AT = (-130.0, 55.0)
EYE_R = 5.0

# Tier 1 is a liner, and the reconstruction holds one floor of it.
#
# The ch. 369 night exterior shows the vessel from outside: a hull pierced by
# two or three rows of lit portholes, and above it a superstructure stepped back
# in terraces, a dozen levels at its tallest block. The one floor plan anyone has
# drawn of it — the King's quarters, the reception hall and the princes' block in
# an unbroken chain, 192 m of the 249 m hull — has to be a *low* deck of that
# vessel, since no terrace runs the full length. Everything above it is ship this
# reconstruction does not hold.
#
# That band used to be drawn open at the top, on the argument that closing it
# would claim a height no page gives. The ship's own deck count gives it. The
# Black Whale has 41 decks; this reconstruction holds eleven of them, and the
# elevations spend twenty-two more in the bands between them — the band above a
# tier is shorter now that the tier's own upper decks stand in it. What is left
# over stands above the topmost deck anyone has drawn, and it is the liner:
# eight decks of it, 4.5 m each.
#
# So the liner is drawn as the page draws it — terraces stepping back as they
# rise — and closed at the count. The number of steps is the ship's own; how far
# each one steps back is not. Nothing gives the plan of a terrace nobody has
# drawn, so they recede evenly from the topmost held deck to a top block a third
# of its length, they carry the same hatch as every other deck the
# reconstruction does not hold, and the drawing says so in as many words.
SHIP_DECKS = 41                 # the catalogue's figure for the whole vessel
SHIP_DECK = 4.5                 # metres: the headroom of the two lowest tiers
LINER_TOP_SHARE = 1 / 3         # what is left of the base block at the top
SUPERSTRUCTURE_SOURCE = (
    'Extérieur de nuit, chap. 369 — la superstructure du paquebot du pont 1, '
    'étagée en gradins au-dessus du pont royal ; le nombre de ponts vient des '
    '41 ponts du navire, leur longueur est celle de la reconstruction.'
)

KEEL = 0.0
X_MIN = min(x_extent(t['hull'])[0] for t in DECKS)
X_MAX = max(x_extent(t['hull'])[1] for t in DECKS)

_order = sorted(DECKS, key=lambda t: t['elevation'])
_banded = sum(round((upper['elevation'] - (lower['elevation'] + lower['ceiling'])) / SHIP_DECK)
              for lower, upper in zip(_order, _order[1:]))
LINER_DECKS = SHIP_DECKS - len(DECKS) - _banded
HELD_TOP = max(t['elevation'] + t['ceiling'] for t in DECKS)
TOP = HELD_TOP + LINER_DECKS * SHIP_DECK

SCALE = min((VIEW_W - 2 * PAD_X) / (X_MAX - X_MIN), (VIEW_H - TOP_ROOM - SEA_ROOM) / (TOP - KEEL))
BASE = VIEW_H - SEA_ROOM          # where the keel line lands


def px(x): return round(PAD_X + (x - X_MIN) * SCALE, 2)
def py(y): return round(BASE - (y - KEEL) * SCALE, 2)


def hull_span(tier):
    """How long the ship is at this deck, measured where the cut crosses it."""
    return span_along(tier['hull']) or x_extent(tier['hull'])


def liner_terraces():
    """The decks of the liner nobody has drawn, as the steps the page shows.

    One entry per deck, lowest first: `(elevation, fore, aft)` in metres. They
    stand on the topmost deck the reconstruction holds and recede evenly from
    its length to a third of it, which is the reconstruction's doing — the count
    is the ship's, the taper is not.
    """
    base_fore, base_aft = hull_span(max(DECKS, key=lambda t: t['elevation']))
    middle, half = (base_fore + base_aft) / 2, (base_aft - base_fore) / 2
    out = []
    for i in range(LINER_DECKS):
        share = 1 - (1 - LINER_TOP_SHARE) * (i + 1) / LINER_DECKS
        out.append((HELD_TOP + i * SHIP_DECK, middle - half * share, middle + half * share))
    return out


TERRACES = liner_terraces()


def hull_profile():
    """The whale in profile, sampled at every deck and straight between them.

    The blueprint holds a hull outline per deck and nothing in between, so the
    profile is the honest thing to draw: measured lengths and a straight run from
    each to the next. It is not a curve anyone has drawn, and it does not pretend
    to be one. Above the last of them the outline steps up the liner's terraces,
    which is the one part of this silhouette that is reconstruction rather than
    relevé — see SUPERSTRUCTURE_SOURCE.
    """
    bow, stern = [], []
    for tier in sorted(DECKS, key=lambda t: t['elevation']):
        fore, aft = hull_span(tier)
        for y in (tier['elevation'], tier['elevation'] + tier['ceiling']):
            bow.append((px(fore), py(y)))
            stern.append((px(aft), py(y)))
    for elevation, fore, aft in TERRACES:
        for y in (elevation, elevation + SHIP_DECK):
            bow.append((px(fore), py(y)))
            stern.append((px(aft), py(y)))
    return bow + stern[::-1]


rows = []
for tier in DECKS:
    default_ceiling = tier['ceiling']
    for space in [s for s in BP['spaces'] if s['tierId'] == tier['id']]:
        cut = span_along(space['footprint'])
        fore, aft = cut if cut else x_extent(space['footprint'])
        floor = tier['elevation'] + (space.get('floor') or 0.0)
        head = space['ceiling'] if space['ceiling'] is not None else default_ceiling
        x0, x1 = px(fore), px(aft)
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

# Four of the five tiers are more than one deck, and the drawing has to say so.
# The decks of a tier stand a few metres apart, which is a handful of units
# here: tabs in the margin would be labels written over each other, and tabs of
# different sizes would read as one deck with annexes. So each tier that carries
# more than one deck gets a bracket of its own on the stern margin, ticked at
# each deck and lettered A, B, C — one tier, several floors.
GROUPED = {t['id'] for t in DECKS if t.get('parentTierId')}
GROUPED |= {t['parentTierId'] for t in DECKS if t.get('parentTierId')}
GROUP_OF = {t['id']: (t.get('parentTierId') or t['id']) for t in DECKS if t['id'] in GROUPED}

decks_out = []
for tier in sorted(DECKS, key=lambda t: -t['elevation']):
    fore, aft = hull_span(tier)
    letter = tier['name'].rsplit('-', 1)[-1] if tier['id'] in GROUPED else ''
    decks_out.append({
        'id': tier['id'], 'name': tier['name'], 'nameFr': tier['nameFr'],
        'child': bool(tier.get('parentTierId')),
        'grouped': tier['id'] in GROUPED,
        'group': GROUP_OF.get(tier['id'], ''),
        'letter': letter,
        'x0': px(fore), 'x1': px(aft),
        'floor': py(tier['elevation']), 'ceiling': py(tier['elevation'] + tier['ceiling']),
        'elevation': tier['elevation'],
    })

# The brackets themselves: one per tier that carries more than one deck, from
# the top of its highest deck to the floor of its lowest, on the margin the
# ship's stern leaves free. They share one abscissa because they never overlap —
# a tier is a band of the ship, and no two of them are at the same height.
BRACKET_X = round(VIEW_W - 26, 2)
brackets = []
for group in sorted({d['group'] for d in decks_out if d['grouped']},
                    key=lambda g: -BY_ID[g]['elevation']):
    of_group = [d for d in decks_out if d['group'] == group]
    brackets.append({
        'id': group,
        'tier': group.replace('tier-', ''),
        'x': BRACKET_X,
        'top': min(d['ceiling'] for d in of_group),
        'bottom': max(d['floor'] for d in of_group),
    })

# The ship the reconstruction does not hold: between one tier's ceiling and the
# floor of the tier above it. Drawn as a band rather than as invented decks —
# the page says the space is full, and says nothing whatever about what fills it.
gaps = []
order = sorted(DECKS, key=lambda t: t['elevation'])
for lower, upper in zip(order, order[1:]):
    top_of_lower = lower['elevation'] + lower['ceiling']
    if upper['elevation'] - top_of_lower < 1: continue
    fore = max(hull_span(lower)[0], hull_span(upper)[0])
    aft = min(hull_span(lower)[1], hull_span(upper)[1])
    gaps.append({
        'id': f"{lower['id']}-{upper['id']}",
        'x': px(fore), 'y': py(upper['elevation']),
        'w': round(px(aft) - px(fore), 2), 'h': round(py(top_of_lower) - py(upper['elevation']), 2),
        'metres': round(upper['elevation'] - top_of_lower, 1),
    })

# The liner over the topmost deck, terraced and closed at the ship's own deck
# count: see SUPERSTRUCTURE_SOURCE.
terraces = [{
    'x': px(fore), 'y': py(elevation + SHIP_DECK),
    'w': round(px(aft) - px(fore), 2),
    'h': round(py(elevation) - py(elevation + SHIP_DECK), 2),
} for elevation, fore, aft in TERRACES]

# Where the note about them sits: over the top step, centred on the widest one.
# A step is 4.5 m and about ten units tall here, which is no room for a caption.
superstructure = {
    'x': terraces[0]['x'], 'y': terraces[-1]['y'],
    'w': terraces[0]['w'],
    'h': round(sum(t['h'] for t in terraces), 2),
    'decks': LINER_DECKS,
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
DECK_FIELDS = [('id', 's'), ('name', 's'), ('nameFr', 's'), ('child', 'b'), ('grouped', 'b'),
               ('group', 's'), ('letter', 's'), ('x0', 'n'), ('x1', 'n'), ('floor', 'n'),
               ('ceiling', 'n'), ('elevation', 'n')]
BRACKET_FIELDS = [('id', 's'), ('tier', 's'), ('x', 'n'), ('top', 'n'), ('bottom', 'n')]
GAP_FIELDS = [('id', 's'), ('x', 'n'), ('y', 'n'), ('w', 'n'), ('h', 'n'), ('metres', 'n')]
TERRACE_FIELDS = [('x', 'n'), ('y', 'n'), ('w', 'n'), ('h', 'n')]

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
   * has 41 of them and the tour walks 11, so between four and twenty-seven
   * metres of ship sit between each pair. Nothing is drawn inside them, because
   * nothing is known to be.
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
  import {{ locale, t }} from '$lib/i18n'

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
   * The decks, and how each one is labelled.
   *
   * A deck that stands alone carries its name in the bow margin — tier 2 is the
   * only one. The decks of the other four tiers do not stand alone: they are
   * the floors of one band of the ship, a few metres apart, which is a handful
   * of units of this drawing. Named in the margin they would be labels written
   * over each other; named in different sizes they would read as one deck with
   * annexes. They are bracketed instead, one bracket a tier, and lettered.
   */
  const decks = [
{ts(decks_out, DECK_FIELDS)},
  ]

  /**
   * A deck carries both of its names, because the tabs are the only labels on
   * the section that come from the ship's own data rather than the dictionary,
   * and a single name means one of the two languages reads the other's.
   */
  const deckName = (deck: {{ name: string; nameFr: string }}) =>
    $locale === 'fr' ? deck.nameFr : deck.name

  /** The brackets that say a run of lettered decks is one tier. */
  const brackets = [
{ts(brackets, BRACKET_FIELDS)},
  ]

  /** Where the ticks and the letters hang, the same for every bracket. */
  const bracketX = {BRACKET_X}

  const gaps = [
{ts(gaps, GAP_FIELDS)},
  ]

  /**
   * The liner over tier 1: the decks of it the reconstruction does not hold,
   * stepping back as they rise the way the ch. 369 exterior shows them.
   *
   * How many there are is the ship's own arithmetic — 41 decks, eleven held,
   * the rest spent in the bands between the tiers, and what is left over stands
   * up here. How far each one steps back is not: nothing draws the plan of a
   * terrace, so they recede evenly to a third of the deck below them and carry
   * the same hatch as every other deck nobody has drawn.
   */
  const terraces = [
{ts(terraces, TERRACE_FIELDS)},
  ]

  /** Where the note about the liner sits: on its widest, lowest step. */
  const superstructure = {{
    x: {superstructure['x']},
    y: {superstructure['y']},
    w: {superstructure['w']},
    h: {superstructure['h']},
    decks: {superstructure['decks']},
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
      .liner-rail {{
        stroke: #ffd700;
        stroke-opacity: 0.5;
        stroke-width: 1;
      }}
      .liner-tick {{
        stroke: #ffd700;
        stroke-opacity: 0.5;
        stroke-width: 1;
      }}
      .liner-name {{
        fill: #ffd700;
        fill-opacity: 0.75;
        font-family: sans-serif;
        font-size: 10px;
        letter-spacing: 1px;
        pointer-events: none;
      }}
      .waterline {{
        stroke: #9dc4e0;
        stroke-opacity: 0.55;
        stroke-width: 1.5;
        stroke-dasharray: 8 6;
      }}
    </style>
    <pattern id="unbuilt" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill="#140d0d" />
      <line x1="0" y1="0" x2="0" y2="6" stroke="#ffd700" stroke-opacity="0.13" stroke-width="1.5" />
    </pattern>
  </defs>

  <rect class="sea" x="0" y={{waterline}} width="{int(VIEW_W)}" height={{{int(VIEW_H)} - waterline}} />

  <polygon class="hull" points="{hull}" />

  {{#each terraces as terrace, i (i)}}
    <rect class="gap" x={{terrace.x}} y={{terrace.y}} width={{terrace.w}} height={{terrace.h}} />
  {{/each}}

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

  <!-- One tier, several floors: the bracket says it, the letters place them. -->
  {{#each brackets as bracket (bracket.id)}}
    <line
      class="liner-rail"
      x1={{bracket.x}}
      y1={{bracket.top}}
      x2={{bracket.x}}
      y2={{bracket.bottom}}
    />
    <text class="liner-name" x={{bracket.x + 6}} y={{bracket.top - 8}}
      >{{$t.ship.tierLabel(bracket.tier)}}</text
    >
  {{/each}}

  {{#each decks as deck (deck.id)}}
    <line class="deck-rule" x1={{deck.x0}} y1={{deck.floor}} x2={{deck.x1}} y2={{deck.floor}} />
    <g
      class="deck-tab"
      role="button"
      tabindex="0"
      aria-label={{deckName(deck)}}
      onclick={{() => openDeck(deck.id)}}
      onkeydown={{(event) => openDeckWithKeyboard(event, deck.id)}}
    >
      {{#if deck.grouped}}
        <line class="liner-tick" x1={{bracketX}} y1={{deck.floor}} x2={{bracketX + 7}} y2={{deck.floor}} />
        <text x={{bracketX + 11}} y={{deck.floor + 3}} font-size="10">{{deck.letter}}</text>
      {{:else}}
        <text x="6" y={{deck.ceiling + 12}}>{{deckName(deck)}}</text>
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
    y={{superstructure.y - 8}}
    text-anchor="middle">{{$t.ship.superstructure(superstructure.decks)}}</text
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
print('tierOverviewSpan (%) : ' + ', '.join(
    f"{d['id']} [{round(d['x0'] / VIEW_W * 100, 1)}, {round(d['x1'] / VIEW_W * 100, 1)}]"
    for d in decks_out))
