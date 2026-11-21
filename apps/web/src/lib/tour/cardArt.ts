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

/** Sets a drawing made on the 120-unit answer grid into the 60×84 field. */
const answer = (marks: string): string => `<g transform="translate(0 12) scale(0.5)">${marks}</g>`

/**
 * The stock each answer card is printed on, in the panel.
 *
 * The table lays the five answers in saturated colours under warm light, and
 * what reaches the eye there is a pastel. The panel has no lamp, so it prints
 * the pastel directly: the card in the hand and the same card on the wood read
 * as one card. Questions have no entry; they stay on white stock.
 */
export const ANSWER_CARD_STOCK: Partial<Record<CardFace, string>> = {
  yes: '#eaa79c',
  no: '#93a8dc',
  back: '#abc99c',
  joker: '#e6ca7d',
  x: '#c9b8e2',
}

export const CARD_ART: Record<CardFace, string> = {
  // The five answers are drawn bold and centred on a 120-unit grid, then set
  // into the 60×84 field at half size: one mark, thick enough to read across
  // the table, and the name left to the frame.
  // Yes is the maru: the circle a Japanese form is marked correct with, which
  // is what she is asking Borksen to write on hers.
  yes: answer(`<circle cx="60" cy="60" r="40" stroke-width="10" />`),
  // And No is the batsu, drawn the way the panel draws it: white on black.
  no: answer(`<rect x="20" y="20" width="80" height="80" rx="6" fill="currentColor" stroke="none" />
    <path d="M38 38 82 82M82 38 38 82" stroke="var(--card-face, ${CARD_STOCK})" stroke-width="10" />`),
  // Return: an arrow that goes down into the pile and comes back up.
  back: answer(`<path d="M92 26v40q0 16-16 16H34" stroke-width="10" />
    <path d="M50 64 30 82l20 18" stroke-width="10" />`),
  // The joker carries both answers at once: the circle, and the boxed cross.
  joker: answer(`<circle cx="38" cy="38" r="18" stroke-width="8" />
    <path d="M50 50 72 72" stroke-width="8" />
    <rect x="66" y="66" width="36" height="36" rx="4" fill="currentColor" stroke="none" />
    <path d="M75 75 93 93M93 75 75 93" stroke="var(--card-face, ${CARD_STOCK})" stroke-width="6" />`),
  // X voids the game: a cross held inside a circle.
  x: answer(`<circle cx="60" cy="60" r="42" stroke-width="9" />
    <path d="M33 33 87 87M87 33 33 87" stroke-width="9" />`),
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
