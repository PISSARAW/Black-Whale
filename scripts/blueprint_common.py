"""What the deck maps and the section map both need from the blueprint.

Both drawings are generated from `data/ship/blueprint.json` and both have to
agree on which room a click opens, so the lookup that answers that question
lives here rather than twice. A region resolved one way on a deck plan and
another way on the section would send the same room to two different pages.
"""
import json, re

BLUEPRINT_PATH = 'data/ship/blueprint.json'
REGISTRY_PATH = 'apps/web/src/lib/map/mapAssetRegistry.ts'
LOCATIONS_PATH = 'data/locations/locations.json'

# Categories that read as circulation rather than as a room you enter.
THROUGH = {'corridor'}


def load_blueprint():
    return json.load(open(BLUEPRINT_PATH, encoding='utf-8'))


def _load_registry():
    reg = open(REGISTRY_PATH, encoding='utf-8').read()
    body = reg[reg.index('const REGION_LOCATION_SLUGS'):reg.index('/// Prince apartments')]
    region_of = {}
    for k, v in re.findall(r"^\s*'?([\w-]+)'?:\s*('[\w-]+'|null),", body, re.M):
        if v != 'null':
            region_of.setdefault(v.strip("'"), k)
    asset_keys = set(re.findall(
        r"^\s*'?([\w-]+)'?:\s*'[\w-]+',",
        reg[reg.index('const LOCATION_ASSETS'):reg.index('const REGION_LOCATION_SLUGS')], re.M))
    return region_of, asset_keys


REGION_OF, ASSET_KEYS = _load_registry()
LOCATIONS = {l['id']: l for l in json.load(open(LOCATIONS_PATH, encoding='utf-8'))}


def region_for(space):
    """The region id to click: the one whose local plan actually opens.

    A room the registry knows by name gives that name. A room it does not —
    a queen's room, one of the princes' fourteen — gives its own location id
    if something zooms into it, and otherwise the nearest parent that does, so
    clicking a queen's room still opens the block plan rather than nothing.
    """
    loc = space['locationId']
    if not loc: return None
    named = REGION_OF.get(loc)
    if named: return named
    if 'royal-residential-sector-room-10' in loc: return loc   # the shared apartment plan
    walk, depth = loc, 0
    while walk and depth < 6:
        if walk in ASSET_KEYS or REGION_OF.get(walk): return REGION_OF.get(walk, walk)
        walk = (LOCATIONS.get(walk) or {}).get('parentLocationId')
        depth += 1
    return loc


def centroid(fp):
    a = cx = cy = 0.0
    for i in range(len(fp)):
        x0, y0 = fp[i]; x1, y1 = fp[(i + 1) % len(fp)]
        f = x0 * y1 - x1 * y0
        a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f
    a *= 0.5
    return (cx / (6 * a), cy / (6 * a)) if a else (fp[0][0], fp[0][1])


def span_along(polygon, at=0.0):
    """Where the plane `z = at` cuts a footprint, as a (bow x, stern x).

    `z = 0` is the centreline, and the ship is long in `x`: every deck hull is
    a parallel midbody between two caps at the extremes of `x`, and each cap is
    symmetric about `z = 0`. That is a bow and a stern, so a section cut on
    `z = 0` runs the length of the ship and a section cut on `x = 0` runs across
    her beam. This one is cut the long way.

    `None` when the plane does not cut it: the room is wholly to port or wholly
    to starboard, so the section passes beside it rather than through it, and
    the drawing owes it a different treatment.

    A room that merely *rests* a wall on the plane is not cut by it, and saying
    otherwise is not a rounding error — the courthouse and the police station
    share the centreline wall, one to each side, so counting a touch as a cut
    drew both of them in the cut and drew them on top of each other. The
    straddle is therefore tested first, on the corners, and only then are the
    crossings measured.
    """
    zs = [p[1] for p in polygon]
    if not (min(zs) < at < max(zs)):
        return None
    xs = []
    n = len(polygon)
    for i in range(n):
        x1, z1 = polygon[i]
        x2, z2 = polygon[(i + 1) % n]
        if (z1 - at) * (z2 - at) < 0:
            xs.append(x1 + (x2 - x1) * (at - z1) / (z2 - z1))
        elif z1 == at:
            xs.append(x1)
    return (min(xs), max(xs)) if xs else None


def x_extent(polygon):
    """How far a footprint reaches fore and aft: the bow end first."""
    xs = [p[0] for p in polygon]
    return min(xs), max(xs)


def svelte_string(value):
    return value.replace('\\', '\\\\').replace("'", "\\'")
