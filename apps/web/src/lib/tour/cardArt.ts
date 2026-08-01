/**
 * The faces of the twelve cards, as drawings rather than as names.
 *
 * The art was born inside `MorenaCardArt.svelte` and was fine there while the
 * panel was the only thing that drew a card. It is not any more: the table lays
 * the same twelve cards on the wood, and Little Eye films them from a hand's
 * width above her fan. A mark that means *price* in the panel and nothing at
 * all on the table would be two decks, so the drawing lives here — once — and
 * both consumers take it from the same place.
 *
 * Each entry is the inside of a 60×84 `<svg>`: no frame, no label, no colour,
 * everything stroked in `currentColor` so the card decides what ink it is drawn
 * in. `MorenaCardArt` drops it into a live SVG element; `cardFaceSvg` wraps it
 * into a standalone document a texture loader can read.
 */
import type { CardFace } from './morena'

/**
 * The bone the counter-strokes are cut in — the white of the card stock.
 *
 * A No is a black square with a white cross through it, and that white has to
 * be the card and not the ink. In the panel the card sets `--card-face`,
 * because a spent card is a shade darker; standing alone, the fallback is the
 * stock itself.
 */
export const CARD_STOCK = '#f6f3ec'

export const CARD_ART: Record<CardFace, string> = {
  // Yes is the maru: the circle a Japanese form is marked correct with, which
  // is what she is asking Borksen to write on hers.
  yes: `<circle cx="30" cy="38" r="19" stroke-width="3" />
    <circle cx="30" cy="38" r="12" stroke-width="1" opacity="0.45" />
    <path d="M14 66h32" stroke-width="1.5" opacity="0.5" />`,
  // And No is the batsu, drawn the way the panel draws it: white on black.
  no: `<rect x="8" y="16" width="44" height="44" fill="currentColor" stroke="none" />
    <path d="M18 26 42 50M42 26 18 50" stroke="var(--card-face, ${CARD_STOCK})" stroke-width="4" />
    <path d="M14 66h32" stroke-width="1.5" opacity="0.5" />`,
  // Return: an arrow that goes down into the pile and comes back up.
  back: `<path d="M44 20v14a10 10 0 0 1-10 10H18" stroke-width="3" />
    <path d="M26 36 17 44l9 8" stroke-width="3" />
    <path d="M12 60h36" stroke-width="1.5" opacity="0.5" />
    <path d="M12 66h24" stroke-width="1.5" opacity="0.3" />`,
  // The joker is the one card drawn twice on itself: whichever way up you hold
  // it, it is already the other answer.
  joker: `<path d="M8 12 52 72" stroke-width="1" opacity="0.4" />
    <circle cx="20" cy="24" r="9" stroke-width="2.5" />
    <rect x="31" y="48" width="18" height="18" fill="currentColor" stroke="none" />
    <path d="M35 52l10 10M45 52 35 62" stroke="var(--card-face, ${CARD_STOCK})" stroke-width="3" />`,
  // X voids the game, so it is drawn as the thing that swallows it.
  x: `<path d="M30 8c-14 8-22 18-22 30s10 22 22 22 22-8 22-22-8-22-22-30z" opacity="0.25" />
    <path d="M14 22 46 54M46 22 14 54" stroke-width="4" />
    <circle cx="30" cy="38" r="26" stroke-width="1" opacity="0.4" />`,
  // Aim: the eye the chapter draws on her side of the fan, and the light coming
  // off it.
  goal: `<path d="M8 38c8-11 15-16 22-16s14 5 22 16c-8 11-15 16-22 16s-14-5-22-16z" stroke-width="2.5" />
    <circle cx="30" cy="38" r="7" fill="currentColor" stroke="none" />
    <path d="M30 8v8M12 16l5 6M48 16l-5 6M30 60v8M12 60l5-6M48 60l-5-6" stroke-width="1.5" />`,
  // Power: an aura going out from a body, which is the only honest picture of
  // an ability that spreads by touching people.
  power: `<circle cx="30" cy="38" r="6" fill="currentColor" stroke="none" />
    <circle cx="30" cy="38" r="13" stroke-width="2" opacity="0.75" />
    <circle cx="30" cy="38" r="20" stroke-width="1.5" opacity="0.5" />
    <circle cx="30" cy="38" r="27" stroke-width="1" opacity="0.3" />`,
  // What a Yes costs: the circle, and a question mark over it.
  'if-yes': `<circle cx="26" cy="42" r="16" stroke-width="2.5" opacity="0.7" />
    <path d="M34 16c0-5 4-8 8-8s8 3 8 8-6 6-7 10" stroke-width="3" />
    <circle cx="42" cy="34" r="2" fill="currentColor" stroke="none" />
    <path d="M12 68h32" stroke-width="1.5" opacity="0.4" />`,
  // And what a No costs, which the chapters say is nothing.
  'if-no': `<path d="M12 30 34 52M34 30 12 52" stroke-width="4" opacity="0.7" />
    <path d="M34 16c0-5 4-8 8-8s8 3 8 8-6 6-7 10" stroke-width="3" />
    <circle cx="42" cy="34" r="2" fill="currentColor" stroke="none" />
    <path d="M12 68h32" stroke-width="1.5" opacity="0.4" />`,
  // The contract is the game itself, so it is drawn as the thing that is signed
  // and then sealed: a sheet, a line, a stamp.
  contract: `<rect x="12" y="12" width="36" height="46" stroke-width="2.5" />
    <path d="M19 24h22M19 32h22M19 40h14" stroke-width="1.5" opacity="0.6" />
    <circle cx="41" cy="52" r="8" stroke-width="2.5" />
    <path d="M12 70h36" stroke-width="1.5" opacity="0.4" />`,
  // Where she comes from: a door left open behind her, and no name on it.
  origin: `<path d="M16 68V20a14 14 0 0 1 28 0v48" stroke-width="2.5" />
    <path d="M16 68h28" stroke-width="2.5" />
    <circle cx="37" cy="44" r="2.5" fill="currentColor" stroke="none" />
    <path d="M24 34h8" stroke-width="1.5" opacity="0.5" />`,
  // Price: the scale, tipped, because she has already weighed you.
  price: `<path d="M30 14v46M18 66h24" stroke-width="2.5" />
    <path d="M10 26h40" stroke-width="2.5" transform="rotate(-9 30 26)" />
    <path d="M10 24l-6 12h12z" stroke-width="2" transform="rotate(-9 30 26)" />
    <path d="M50 28l-6 12h12z" stroke-width="2" transform="rotate(-9 30 26)" />`,
}

/** The attributes every one of those drawings is stroked under. */
const PEN =
  'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'

/**
 * One face as a standalone SVG document, in the ink it is to be drawn in.
 *
 * This is for the table rather than for the panel: three.js takes an image, an
 * image takes a URL, and a data URL is the only one that needs no round trip to
 * a server for a drawing that is already in the bundle. The ground stays
 * transparent — the card underneath is already the right colour, and what the
 * face wants is the mark laid on it rather than a second card printed over it.
 *
 * `encodeURIComponent` rather than base64: the markup is ASCII, the result is
 * legible in a debugger, and there is no `btoa` on the server.
 */
export function cardFaceSvg(face: CardFace, ink: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="168" viewBox="0 0 60 84" ` +
    `color="${ink}" ${PEN}>${CARD_ART[face]}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
